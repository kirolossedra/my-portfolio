#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..', '..', '..', '..');
const DATABASE = 'kirolos-portfolio-db';
const VECTOR_INDEX = 'portfolio-career-rag-cloudflare-v1';
const VECTOR_BATCH_SIZE = 100;
const VECTOR_VERIFY_BATCH_SIZE = 20;
const API_ROOT = 'https://api.cloudflare.com/client/v4';
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

function runWrangler(args) {
  const windows = process.platform === 'win32';
  const executable = windows ? (process.env.ComSpec || 'cmd.exe') : 'npx';
  const commandArgs = windows
    ? ['/d', '/s', '/c', `npx wrangler ${args.map((v) => /\s/.test(v) ? `"${v.replaceAll('"', '\\"')}"` : v).join(' ')}`]
    : ['wrangler', ...args];
  const result = spawnSync(executable, commandArgs, { cwd: PROJECT_ROOT, encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || String(result.stderr || result.stdout || 'Wrangler failed').trim());
  return String(result.stdout || '').trim();
}

function query(sql) {
  const output = runWrangler(['d1', 'execute', DATABASE, '--remote', '--command', sql, '--json']);
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']');
  const parsed = JSON.parse(start >= 0 && end >= start ? output.slice(start, end + 1) : output);
  const rows = Array.isArray(parsed) ? parsed[0]?.results : parsed?.result?.[0]?.results;
  return Array.isArray(rows) ? rows : [];
}

function execute(sql) {
  runWrangler(['d1', 'execute', DATABASE, '--remote', '--command', sql, '--yes']);
}

const pointer = (name) => query(`SELECT config_value FROM rag_runtime_config WHERE config_key=${sqlString(name)}`)[0]?.config_value ?? null;
const release = (id) => query(`SELECT release_id,d1_published,vectorize_published FROM rag_releases WHERE release_id=${sqlString(id)}`)[0] ?? null;

function protectedReleases() {
  return new Set([pointer('active_rag_release'), pointer('previous_rag_release')].filter(Boolean));
}

function resolveCloudflareAccountId() {
  const configured = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  if (configured) return configured;
  const whoami = JSON.parse(runWrangler(['whoami', '--json']));
  const accounts = Array.isArray(whoami.accounts) ? whoami.accounts.filter((item) => item?.id) : [];
  if (accounts.length !== 1) throw new Error('Cleanup requires exactly one Wrangler account or CLOUDFLARE_ACCOUNT_ID.');
  return String(accounts[0].id);
}

function resolveCloudflareAuth() {
  const bearer = String(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN || '').trim();
  if (bearer) return { Authorization: `Bearer ${bearer}` };
  const key = String(process.env.CLOUDFLARE_API_KEY || '').trim();
  const email = String(process.env.CLOUDFLARE_EMAIL || '').trim();
  if (key && email) return { 'X-Auth-Key': key, 'X-Auth-Email': email };
  const auth = JSON.parse(runWrangler(['auth', 'token', '--json']));
  if ((auth.type === 'api_token' || auth.type === 'oauth') && auth.token) return { Authorization: `Bearer ${auth.token}` };
  if (auth.type === 'api_key' && auth.key && auth.email) return { 'X-Auth-Key': auth.key, 'X-Auth-Email': auth.email };
  throw new Error('Wrangler did not provide a usable Cloudflare credential for Vectorize cleanup.');
}

async function vectorizeRequest(accountId, headers, method, suffix, body) {
  const response = await fetch(`${API_ROOT}/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(VECTOR_INDEX)}${suffix}`, {
    method,
    headers: { ...headers, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* error below includes raw response */ }
  if (!response.ok || parsed?.success === false) {
    const message = parsed?.errors?.map((item) => item?.message || String(item)).join(' | ') || text.slice(0, 500);
    throw new Error(`Vectorize HTTP ${response.status}: ${message}`);
  }
  return parsed?.result ?? {};
}

async function waitForMutation(accountId, headers, mutationId) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const info = await vectorizeRequest(accountId, headers, 'GET', '', undefined);
    const processed = String(info.processedUpToMutation ?? info.processed_up_to_mutation ?? '');
    if (processed === mutationId) return;
    await sleep(2_000);
  }
  throw new Error(`Timed out waiting for Vectorize mutation ${mutationId}.`);
}

async function deleteReleaseVectors(accountId, headers, releaseId, documentIds) {
  const vectorIds = documentIds.map((documentId) => releaseId === 'legacy-v1' ? documentId : `${releaseId}:${documentId}`);
  for (let start = 0; start < vectorIds.length; start += VECTOR_VERIFY_BATCH_SIZE) {
    const ids = vectorIds.slice(start, start + VECTOR_VERIFY_BATCH_SIZE);
    const result = await vectorizeRequest(accountId, headers, 'POST', '/delete_by_ids', { ids });
    const mutationId = String(result.mutationId ?? result.mutation_id ?? '');
    if (!mutationId) throw new Error(`Vectorize returned no mutation ID while deleting ${releaseId}.`);
    await waitForMutation(accountId, headers, mutationId);
  }
  for (let start = 0; start < vectorIds.length; start += VECTOR_BATCH_SIZE) {
    const ids = vectorIds.slice(start, start + VECTOR_BATCH_SIZE);
    const result = await vectorizeRequest(accountId, headers, 'POST', '/get_by_ids', { ids });
    const remaining = Array.isArray(result) ? result : result.vectors ?? [];
    if (remaining.length) throw new Error(`Vectorize still contains ${remaining.length} vectors for obsolete release ${releaseId}.`);
  }
  return vectorIds.length;
}

function requireReady(id) {
  const row = release(id);
  if (!row || Number(row.d1_published) !== 1 || Number(row.vectorize_published) !== 1) throw new Error(`Release ${id} is not fully published to D1 and Vectorize.`);
}

function activate(id, deployed) {
  if (!/^rag-[0-9a-f]{24}$/.test(id)) throw new Error('Invalid release ID.');
  if (deployed !== id) throw new Error('Deployed runtime release does not match the cutover candidate.');
  requireReady(id);
  const previous = pointer('active_rag_release');
  execute(`BEGIN; INSERT OR REPLACE INTO rag_runtime_config(config_key,config_value,updated_at) VALUES ('previous_rag_release',${sqlString(previous)},CURRENT_TIMESTAMP); INSERT OR REPLACE INTO rag_runtime_config(config_key,config_value,updated_at) VALUES ('active_rag_release',${sqlString(id)},CURRENT_TIMESTAMP); INSERT OR REPLACE INTO rag_runtime_config(config_key,config_value,updated_at) VALUES ('deployed_rag_release',${sqlString(deployed)},CURRENT_TIMESTAMP); UPDATE rag_releases SET activated_at=CURRENT_TIMESTAMP WHERE release_id=${sqlString(id)}; COMMIT;`);
  console.log(`Previous active release: ${previous ?? 'none'}`);
  console.log(`Active release switched: ${id}`);
  console.log(JSON.stringify({ action: 'activate', release_id: id, previous_active_release: previous }));
}

function rollback() {
  const active = pointer('active_rag_release');
  const previous = pointer('previous_rag_release');
  if (!previous) throw new Error('No previous RAG release is retained for rollback.');
  requireReady(previous);
  execute(`BEGIN; INSERT OR REPLACE INTO rag_runtime_config(config_key,config_value,updated_at) VALUES ('active_rag_release',${sqlString(previous)},CURRENT_TIMESTAMP); INSERT OR REPLACE INTO rag_runtime_config(config_key,config_value,updated_at) VALUES ('previous_rag_release',${sqlString(active)},CURRENT_TIMESTAMP); COMMIT;`);
  console.log(JSON.stringify({ action: 'rollback', release_id: previous, previous_active_release: active }));
}

async function cleanup() {
  const initiallyProtected = protectedReleases();
  const obsolete = query('SELECT release_id,document_count FROM rag_releases ORDER BY created_at ASC')
    .map((row) => ({ releaseId: String(row.release_id), documentCount: Number(row.document_count) }))
    .filter(({ releaseId }) => !initiallyProtected.has(releaseId));
  if (!obsolete.length) {
    console.log(JSON.stringify({ action: 'cleanup', releases_deleted: [], vectors_deleted: 0, documents_deleted: 0 }));
    return;
  }

  const accountId = resolveCloudflareAccountId();
  const headers = resolveCloudflareAuth();
  const deleted = [];
  let vectorsDeleted = 0;
  let documentsDeleted = 0;
  for (const { releaseId, documentCount } of obsolete) {
    if (protectedReleases().has(releaseId)) throw new Error(`Refusing to clean protected release ${releaseId}.`);
    const rows = query(`SELECT document_id FROM rag_documents WHERE release_id=${sqlString(releaseId)} ORDER BY document_id`);
    const documentIds = rows.map((row) => String(row.document_id));
    if (!Number.isInteger(documentCount) || documentCount < 1 || documentIds.length !== documentCount) {
      throw new Error(`Refusing to clean ${releaseId}: D1 has ${documentIds.length}/${documentCount} expected document IDs.`);
    }
    vectorsDeleted += await deleteReleaseVectors(accountId, headers, releaseId, documentIds);
    if (protectedReleases().has(releaseId)) throw new Error(`Release ${releaseId} became protected during cleanup; D1 data was retained.`);
    execute(`BEGIN; DELETE FROM rag_documents WHERE release_id=${sqlString(releaseId)}; DELETE FROM rag_releases WHERE release_id=${sqlString(releaseId)} AND release_id NOT IN (SELECT config_value FROM rag_runtime_config WHERE config_key IN ('active_rag_release','previous_rag_release')); COMMIT;`);
    if (release(releaseId)) throw new Error(`D1 refused to remove obsolete release ${releaseId}.`);
    documentsDeleted += documentIds.length;
    deleted.push(releaseId);
  }
  console.log(JSON.stringify({ action: 'cleanup', releases_deleted: deleted, vectors_deleted: vectorsDeleted, documents_deleted: documentsDeleted }));
}

const args = process.argv.slice(2);
if (args[0] === '--rollback' && args.length === 1) rollback();
else if (args[0] === '--activate' && args[2] === '--deployed-release' && args.length === 4) activate(args[1], args[3]);
else if (args[0] === '--cleanup' && args.length === 1) await cleanup();
else throw new Error('Usage: --activate <release-id> --deployed-release <release-id> | --rollback | --cleanup');
