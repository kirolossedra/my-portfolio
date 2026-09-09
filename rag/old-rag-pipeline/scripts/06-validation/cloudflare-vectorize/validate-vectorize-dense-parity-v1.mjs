#!/usr/bin/env node
/**
 * Portfolio GitHub RAG pipeline — Stage 06 / Cloudflare Vectorize dense parity v1.
 *
 * ZERO-ARGUMENT USAGE
 * -------------------
 *   node rag/scripts/06-validation/cloudflare-vectorize/validate-vectorize-dense-parity-v1.mjs
 *
 * PURPOSE
 * -------
 * Prove that Cloudflare Vectorize is a faithful hosted dense-recall backend for
 * the validated Stage 03 Cloudflare/Qwen vector space.
 *
 * This validator deliberately separates:
 *   1. index/document identity,
 *   2. stored-vector fidelity,
 *   3. ANN candidate-set parity against exact local cosine,
 *   4. high-precision score fidelity using returnValues=true,
 *   5. compact metadata mapping.
 *
 * It does NOT mutate Vectorize.
 */

import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync, renameSync } from "node:fs";
import { promises as fs } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_PATH);
const SCRIPT_NAME = SCRIPT_PATH.split(/[\\/]/).pop();

class PipelineError extends Error {}

function findRagRoot(startDir) {
  let current = resolve(startDir);
  while (true) {
    if (
      current.split(/[\\/]/).pop() === "rag"
      && existsSync(join(current, "scripts"))
      && existsSync(join(current, "rag-corpus"))
    ) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new PipelineError("Could not locate the enclosing rag/ root.");
}

const RAG_ROOT = findRagRoot(SCRIPT_DIR);
const PORTFOLIO_ROOT = dirname(RAG_ROOT);
const CORPUS_ROOT = join(RAG_ROOT, "rag-corpus");
const EMBEDDING_DIR = join(CORPUS_ROOT, "embeddings-cloudflare-v1");
const MATRIX_PATH = join(EMBEDDING_DIR, "embeddings.npy");
const RECORDS_PATH = join(EMBEDDING_DIR, "embedding-records.jsonl");
const EMBEDDING_MANIFEST_PATH = join(EMBEDDING_DIR, "embedding-manifest.json");
const VECTORIZE_DIR = join(CORPUS_ROOT, "vectorize-cloudflare-v1");
const PUBLICATION_MANIFEST_PATH = join(VECTORIZE_DIR, "vectorize-publication-manifest.json");
const JSON_REPORT_PATH = join(VECTORIZE_DIR, "vectorize-dense-parity-validation-v1.json");
const TEXT_REPORT_PATH = join(VECTORIZE_DIR, "vectorize-dense-parity-validation-v1.txt");

const VALIDATION_SCHEMA_VERSION = "1.1.0";
const INDEX_NAME = "portfolio-career-rag-cloudflare-v1";
const EXPECTED_COUNT = 2808;
const EXPECTED_REPOSITORIES = 134;
const DIMENSIONS = 1024;
const METRIC = "cosine";
const MODEL = "@cf/qwen/qwen3-embedding-0.6b";
const QUERY_INPUT_MODE = "queries";
const QUERY_INSTRUCTION = "Given a web search query, retrieve relevant passages that answer the query";
const EXPECTED_EMBEDDING_SCHEMA_MAJOR = "4";
const PROVIDER_ARTIFACT_GENERATION = "cloudflare-v1";

const API_MAX_RETRIES = 5;
const API_TIMEOUT_MS = 120_000;
const LIST_PAGE_SIZE = 1000;
const GET_BY_IDS_MAX = 20;
const EXHAUSTIVE_ID_FETCH_BATCH_SIZE = GET_BY_IDS_MAX;
const STORAGE_SAMPLE_COUNT = 64;
const STORAGE_FETCH_BATCH = GET_BY_IDS_MAX;
const MAX_VECTOR_ABS_DELTA = 1e-6;
const MAX_RECOMPUTED_SCORE_DELTA = 1e-6;
const REPORTED_SCORE_DIAGNOSTIC_TOLERANCE = 2e-5;
const TOP1_EXACT_TIE_TOLERANCE = 1e-7;
const UNIT_NORM_TOLERANCE = 2e-5;
const TOP_K = 50;
const MIN_OVERLAP_10 = 0.90;
const MIN_OVERLAP_25 = 0.90;
const MIN_OVERLAP_50 = 0.90;

const REGRESSION_QUERIES = [
  "What evidence shows experience with authorization architecture?",
  "How has the candidate's testing discipline evolved over time?",
  "Which projects provide the strongest evidence of backend engineering?",
  "What are the candidate's weakest engineering areas?",
  "Which repositories demonstrate product ownership rather than only coding?",
];

function utcNow() { return new Date().toISOString(); }
function sleep(ms) { return new Promise((resolveSleep) => setTimeout(resolveSleep, ms)); }
function rel(path) {
  const value = relative(RAG_ROOT, path);
  return value && !value.startsWith("..") ? value : path;
}

async function sha256File(path) {
  return await new Promise((resolveHash, rejectHash) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("error", rejectHash);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolveHash(hash.digest("hex")));
  });
}

function parseJsonFromCommand(stdout) {
  const trimmed = String(stdout || "").trim();
  try { return JSON.parse(trimmed); } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(trimmed.slice(start, end + 1)); } catch { /* handled below */ }
    }
  }
  throw new PipelineError("Wrangler returned output that could not be parsed as JSON.");
}

function runWranglerJson(args) {
  const isWindows = process.platform === "win32";
  const executable = isWindows ? (process.env.ComSpec || "cmd.exe") : "npx";
  const commandArgs = isWindows
    ? ["/d", "/s", "/c", `npx wrangler ${args.join(" ")}`]
    : ["wrangler", ...args];
  const result = spawnSync(executable, commandArgs, {
    cwd: PORTFOLIO_ROOT,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
    env: process.env,
  });
  if (result.error) throw new PipelineError(`Could not execute Wrangler: ${result.error.message}`);
  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim().split(/\r?\n/).slice(-4).join(" | ");
    throw new PipelineError(`Wrangler command failed${stderr ? `: ${stderr}` : "."}`);
  }
  return parseJsonFromCommand(result.stdout);
}

function resolveCloudflareAccountId() {
  const envId = String(process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  if (envId) return { accountId: envId, source: "CLOUDFLARE_ACCOUNT_ID" };
  const whoami = runWranglerJson(["whoami", "--json"]);
  if (whoami.loggedIn === false) throw new PipelineError("Wrangler is not authenticated. Run `npx wrangler login` first.");
  const valid = (Array.isArray(whoami.accounts) ? whoami.accounts : [])
    .filter((account) => account && typeof account.id === "string" && account.id.trim());
  if (valid.length === 1) return { accountId: valid[0].id.trim(), source: "wrangler whoami" };
  if (valid.length === 0) throw new PipelineError("Wrangler returned no Cloudflare account ID.");
  throw new PipelineError("Wrangler returned multiple Cloudflare accounts. Set CLOUDFLARE_ACCOUNT_ID for this run.");
}

function resolveCloudflareAuth() {
  const bearer = String(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN || "").trim();
  if (bearer) return { headers: { Authorization: `Bearer ${bearer}` }, source: "environment bearer token" };
  const key = String(process.env.CLOUDFLARE_API_KEY || "").trim();
  const email = String(process.env.CLOUDFLARE_EMAIL || "").trim();
  if (key && email) return { headers: { "X-Auth-Key": key, "X-Auth-Email": email }, source: "environment API key/email" };
  const auth = runWranglerJson(["auth", "token", "--json"]);
  if ((auth.type === "api_token" || auth.type === "oauth") && typeof auth.token === "string" && auth.token.trim()) {
    return { headers: { Authorization: `Bearer ${auth.token.trim()}` }, source: `wrangler ${auth.type}` };
  }
  if (auth.type === "api_key" && auth.key && auth.email) {
    return { headers: { "X-Auth-Key": String(auth.key), "X-Auth-Email": String(auth.email) }, source: "wrangler api_key" };
  }
  throw new PipelineError("Wrangler did not return a usable Cloudflare authentication credential.");
}

function summarizeApiError(parsed, bodyText) {
  return parsed?.errors?.map((item) => item?.message || String(item)).join(" | ")
    || parsed?.messages?.map((item) => item?.message || String(item)).join(" | ")
    || String(bodyText || "").slice(0, 700).replace(/\s+/g, " ");
}

function permissionHint(status) {
  return status === 403
    ? " Re-run `npx wrangler login` and grant the required Vectorize/Workers AI permissions, then retry."
    : "";
}

async function requestJson({ url, authHeaders, method = "GET", body = undefined, label }) {
  const encodedBody = body === undefined ? undefined : JSON.stringify(body);
  for (let attempt = 1; attempt <= API_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    let response;
    let bodyText = "";
    try {
      response = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          Accept: "application/json",
          ...(encodedBody === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: encodedBody,
        signal: controller.signal,
      });
      bodyText = await response.text();
    } catch (error) {
      clearTimeout(timer);
      if (attempt >= API_MAX_RETRIES) throw new PipelineError(`${label}: network failure after ${attempt} attempts: ${error.message}`);
      await sleep(Math.min(30_000, 1000 * 2 ** (attempt - 1)));
      continue;
    }
    clearTimeout(timer);
    let parsed = null;
    try { parsed = bodyText ? JSON.parse(bodyText) : null; } catch { /* handled below */ }
    if (response.ok && parsed && parsed.success !== false) return parsed;
    const summary = summarizeApiError(parsed, bodyText);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= API_MAX_RETRIES) {
      throw new PipelineError(`${label}: Cloudflare API HTTP ${response.status}. ${summary}${permissionHint(response.status)}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(30_000, retryAfter * 1000)
      : Math.min(30_000, 1000 * 2 ** (attempt - 1)));
  }
  throw new PipelineError(`${label}: unexpected retry-loop termination.`);
}

function vectorizeUrl(accountId, suffix) {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes${suffix}`;
}

function workersAiUrl(accountId) {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL}`;
}

function loadJson(path) {
  try {
    const value = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an object");
    return value;
  } catch (error) {
    throw new PipelineError(`Could not read JSON ${rel(path)}: ${error.message}`);
  }
}

function loadJsonl(path) {
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const rows = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("not an object");
      rows.push(row);
    } catch (error) {
      throw new PipelineError(`Invalid JSONL ${rel(path)} line ${index + 1}: ${error.message}`);
    }
  }
  return rows;
}

function readNpyHeader(buffer) {
  if (buffer.length < 10 || buffer[0] !== 0x93 || buffer.toString("ascii", 1, 6) !== "NUMPY") throw new PipelineError("Invalid NPY magic header.");
  if (buffer[6] !== 1 || buffer[7] !== 0) throw new PipelineError("Expected NPY v1.0.");
  const headerLength = buffer.readUInt16LE(8);
  const headerEnd = 10 + headerLength;
  const text = buffer.toString("ascii", 10, headerEnd);
  const shape = text.match(/'shape':\s*\((\d+)\s*,\s*(\d+)\s*\)/);
  if (!shape || !text.includes("'descr': '<f4'") || !text.includes("'fortran_order': False")) throw new PipelineError("Unexpected NPY dtype/order contract.");
  return { rows: Number(shape[1]), cols: Number(shape[2]), dataOffset: headerEnd };
}

function vectorAt(buffer, header, row) {
  const vector = new Array(header.cols);
  let offset = header.dataOffset + row * header.cols * 4;
  for (let col = 0; col < header.cols; col += 1) {
    vector[col] = buffer.readFloatLE(offset);
    offset += 4;
  }
  return vector;
}

function dotRow(buffer, header, row, vector) {
  let sum = 0;
  let offset = header.dataOffset + row * header.cols * 4;
  for (let col = 0; col < header.cols; col += 1) {
    sum += buffer.readFloatLE(offset) * vector[col];
    offset += 4;
  }
  return sum;
}

function l2Normalize(vector) {
  if (!Array.isArray(vector) || vector.length !== DIMENSIONS) throw new PipelineError(`Query vector dimension mismatch: ${vector?.length}.`);
  let sum = 0;
  const output = new Array(DIMENSIONS);
  for (let i = 0; i < DIMENSIONS; i += 1) {
    const value = Number(vector[i]);
    if (!Number.isFinite(value)) throw new PipelineError(`Query vector contains invalid value at ${i}.`);
    output[i] = value;
    sum += value * value;
  }
  const norm = Math.sqrt(sum);
  if (!Number.isFinite(norm) || norm <= 0) throw new PipelineError("Query vector has invalid L2 norm.");
  for (let i = 0; i < DIMENSIONS; i += 1) output[i] /= norm;
  return output;
}

function extractEmbedding(payload) {
  if (!payload || payload.success === false) throw new PipelineError("Workers AI embedding response reported failure.");
  const result = payload.result ?? payload;
  const data = result?.data;
  if (!Array.isArray(data)) throw new PipelineError("Workers AI response is missing result.data.");
  let vector;
  if (data.length === 1 && Array.isArray(data[0])) vector = data[0];
  else if (data.length === DIMENSIONS && data.every((value) => typeof value === "number")) vector = data;
  else throw new PipelineError(`Unexpected Workers AI query embedding response shape.`);
  return l2Normalize(vector);
}

async function validateLocalArtifacts() {
  for (const path of [MATRIX_PATH, RECORDS_PATH, EMBEDDING_MANIFEST_PATH, PUBLICATION_MANIFEST_PATH]) {
    if (!existsSync(path)) throw new PipelineError(`Missing required artifact: ${rel(path)}`);
  }
  const embeddingManifest = loadJson(EMBEDDING_MANIFEST_PATH);
  const publicationManifest = loadJson(PUBLICATION_MANIFEST_PATH);
  if (String(embeddingManifest.embedding_schema_version || "").split(".", 1)[0] !== EXPECTED_EMBEDDING_SCHEMA_MAJOR) throw new PipelineError("Unexpected embedding schema major.");
  if (embeddingManifest.provider_artifact_generation !== PROVIDER_ARTIFACT_GENERATION) throw new PipelineError("Unexpected provider artifact generation.");
  if (embeddingManifest.embedding?.model !== MODEL || Number(embeddingManifest.embedding?.dimensions) !== DIMENSIONS) throw new PipelineError("Stage 03 embedding identity mismatch.");
  if (embeddingManifest.embedding?.runtime_query_input_mode !== QUERY_INPUT_MODE || embeddingManifest.embedding?.runtime_query_instruction !== QUERY_INSTRUCTION) {
    throw new PipelineError("Stage 03 runtime query contract does not match this validator.");
  }
  if (publicationManifest.vectorize?.index_name !== INDEX_NAME) throw new PipelineError("Stage 05 publication manifest index mismatch.");
  if (publicationManifest.validation?.exact_remote_id_set !== "PASS") throw new PipelineError("Stage 05 publication did not pass exact ID-set validation.");

  const [matrixSha, recordsSha] = await Promise.all([sha256File(MATRIX_PATH), sha256File(RECORDS_PATH)]);
  if (embeddingManifest.artifacts?.["embeddings.npy"]?.sha256 !== matrixSha) throw new PipelineError("Matrix hash differs from Stage 03 manifest.");
  if (embeddingManifest.artifacts?.["embedding-records.jsonl"]?.sha256 !== recordsSha) throw new PipelineError("Record hash differs from Stage 03 manifest.");
  if (publicationManifest.source?.embeddings_npy_sha256 !== matrixSha || publicationManifest.source?.embedding_records_sha256 !== recordsSha) {
    throw new PipelineError("Stage 05 publication was built from a different Stage 03 generation.");
  }

  const matrixBuffer = await fs.readFile(MATRIX_PATH);
  const matrixHeader = readNpyHeader(matrixBuffer);
  if (matrixHeader.rows !== EXPECTED_COUNT || matrixHeader.cols !== DIMENSIONS) throw new PipelineError(`Matrix shape (${matrixHeader.rows}, ${matrixHeader.cols}) is invalid.`);
  if (matrixBuffer.length !== matrixHeader.dataOffset + EXPECTED_COUNT * DIMENSIONS * 4) throw new PipelineError("Matrix byte length is invalid.");
  const records = loadJsonl(RECORDS_PATH);
  if (records.length !== EXPECTED_COUNT) throw new PipelineError(`Record count ${records.length} != ${EXPECTED_COUNT}.`);

  const idToIndex = new Map();
  const repositories = new Set();
  let maxNormError = 0;
  for (let row = 0; row < EXPECTED_COUNT; row += 1) {
    const record = records[row];
    const id = String(record.document_id || "");
    if (!id || idToIndex.has(id)) throw new PipelineError(`Invalid/duplicate document ID at row ${row}.`);
    if (Number(record.vector_index) !== row) throw new PipelineError(`vector_index mismatch at ${id}.`);
    idToIndex.set(id, row);
    repositories.add(Number(record.repository_index));
    let sum = 0;
    let offset = matrixHeader.dataOffset + row * DIMENSIONS * 4;
    for (let col = 0; col < DIMENSIONS; col += 1) {
      const value = matrixBuffer.readFloatLE(offset);
      offset += 4;
      if (!Number.isFinite(value)) throw new PipelineError(`Invalid matrix value at ${row},${col}.`);
      sum += value * value;
    }
    maxNormError = Math.max(maxNormError, Math.abs(Math.sqrt(sum) - 1));
  }
  if (repositories.size !== EXPECTED_REPOSITORIES) throw new PipelineError(`Repository coverage ${repositories.size}/${EXPECTED_REPOSITORIES}.`);
  if (maxNormError > UNIT_NORM_TOLERANCE) throw new PipelineError(`Local matrix norm error ${maxNormError} exceeds tolerance.`);

  return { embeddingManifest, publicationManifest, matrixSha, recordsSha, matrixBuffer, matrixHeader, records, idToIndex, maxNormError };
}

async function getIndexAndInfo(accountId, authHeaders) {
  const base = `/${encodeURIComponent(INDEX_NAME)}`;
  const [indexResponse, infoResponse] = await Promise.all([
    requestJson({ url: vectorizeUrl(accountId, base), authHeaders, label: "get Vectorize index" }),
    requestJson({ url: vectorizeUrl(accountId, `${base}/info`), authHeaders, label: "get Vectorize info" }),
  ]);
  const index = indexResponse.result || {};
  const info = infoResponse.result || {};
  if (Number(index.config?.dimensions) !== DIMENSIONS || String(index.config?.metric) !== METRIC) throw new PipelineError("Remote Vectorize index dimensions/metric mismatch.");
  if (Number(info.dimensions) !== DIMENSIONS) throw new PipelineError("Remote Vectorize info dimension mismatch.");
  if (Number(info.vectorCount ?? info.vector_count) !== EXPECTED_COUNT) throw new PipelineError(`Remote Vectorize count ${info.vectorCount ?? info.vector_count} != ${EXPECTED_COUNT}.`);
  return { index, info };
}

function normalizeListedIds(result) {
  const vectors = Array.isArray(result?.vectors) ? result.vectors : [];
  return vectors.map((item) => typeof item === "string" ? item : item?.id).filter((id) => typeof id === "string");
}

async function listIdsDiagnostic(accountId, authHeaders) {
  // Diagnostic only. Exact correctness does not depend on cursor pagination.
  // The live account has returned a continuation cursor that the API then
  // rejects, so we intentionally inspect at most the first page and prove
  // identity independently with vectorCount + exhaustive 20-ID get_by_ids.
  const params = new URLSearchParams({ count: String(LIST_PAGE_SIZE) });
  try {
    const payload = await requestJson({
      url: vectorizeUrl(accountId, `/${encodeURIComponent(INDEX_NAME)}/list?${params.toString()}`),
      authHeaders,
      label: "list vectors diagnostic page 1",
    });
    const result = payload.result || {};
    const ids = normalizeListedIds(result);
    const total = Number(result.totalCount ?? result.total_count);
    return {
      ids,
      pages: 1,
      reportedTotal: Number.isFinite(total) ? total : null,
      complete: ids.length === EXPECTED_COUNT && !(result.isTruncated ?? result.is_truncated),
      incompleteReason: ids.length === EXPECTED_COUNT
        ? null
        : `diagnostic list-vectors page observed ${ids.length}/${EXPECTED_COUNT}; cursor pagination intentionally not required`,
    };
  } catch (error) {
    return { ids: [], pages: 0, reportedTotal: null, complete: false, incompleteReason: `list-vectors diagnostic unavailable: ${error.message}` };
  }
}

async function verifyExactRemoteIds(accountId, authHeaders, local, remoteState) {
  const remoteCount = Number(remoteState.info.vectorCount ?? remoteState.info.vector_count ?? -1);
  if (remoteCount !== EXPECTED_COUNT) throw new PipelineError(`Remote Vectorize count ${remoteCount} != ${EXPECTED_COUNT}.`);
  const expectedIds = local.records.map((record) => record.document_id);
  const expectedSet = new Set(expectedIds);
  if (expectedSet.size !== EXPECTED_COUNT) throw new PipelineError("Local expected document IDs are not unique.");

  const listing = await listIdsDiagnostic(accountId, authHeaders);
  const listedSet = new Set(listing.ids);
  if (listing.complete && listedSet.size === EXPECTED_COUNT && [...expectedSet].every((id) => listedSet.has(id))) {
    return { pass: true, method: "list-vectors-cursor-pagination", exactCount: EXPECTED_COUNT, listObservedCount: listing.ids.length, listPages: listing.pages, listFallbackUsed: false };
  }

  const fetched = [];
  for (let start = 0; start < expectedIds.length; start += EXHAUSTIVE_ID_FETCH_BATCH_SIZE) {
    const batch = expectedIds.slice(start, start + EXHAUSTIVE_ID_FETCH_BATCH_SIZE);
    if (batch.length > GET_BY_IDS_MAX) throw new PipelineError(`Internal get_by_ids batch overflow: ${batch.length} > ${GET_BY_IDS_MAX}.`);
    const payload = await requestJson({
      url: vectorizeUrl(accountId, `/${encodeURIComponent(INDEX_NAME)}/get_by_ids`),
      authHeaders,
      method: "POST",
      body: { ids: batch },
      label: `verify expected IDs ${start}-${start + batch.length - 1}`,
    });
    if (!Array.isArray(payload.result)) throw new PipelineError("get_by_ids returned a non-array result during exhaustive ID verification.");
    const returned = payload.result.map((item) => item?.id).filter((id) => typeof id === "string");
    const returnedSet = new Set(returned);
    const requestedSet = new Set(batch);
    const missing = batch.filter((id) => !returnedSet.has(id));
    const unexpected = returned.filter((id) => !requestedSet.has(id));
    if (returnedSet.size !== returned.length || missing.length || unexpected.length || returned.length !== batch.length) {
      throw new PipelineError(`Exhaustive expected-ID verification failed at ${start}: missing=${missing.slice(0,10).join(",") || "none"}; unexpected=${unexpected.slice(0,10).join(",") || "none"}.`);
    }
    fetched.push(...returned);
  }
  const fetchedSet = new Set(fetched);
  const pass = fetched.length === EXPECTED_COUNT && fetchedSet.size === EXPECTED_COUNT && [...expectedSet].every((id) => fetchedSet.has(id));
  if (!pass) throw new PipelineError(`Exhaustive get_by_ids verification did not return all ${EXPECTED_COUNT} expected IDs.`);
  return {
    pass: true,
    method: "vector-count-plus-exhaustive-get-by-ids",
    exactCount: EXPECTED_COUNT,
    listObservedCount: listing.ids.length,
    listPages: listing.pages,
    listFallbackUsed: true,
    listIncompleteReason: listing.incompleteReason || "listed IDs did not exactly match expected set",
  };
}

function samplePositions(total, count) {
  const result = [];
  const seen = new Set();
  for (let i = 0; i < count; i += 1) {
    const idx = Math.round((i * (total - 1)) / Math.max(1, count - 1));
    if (!seen.has(idx)) { seen.add(idx); result.push(idx); }
  }
  return result;
}

async function fetchByIds(accountId, authHeaders, ids) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > GET_BY_IDS_MAX) {
    throw new PipelineError(`Vectorize get_by_ids requires 1-${GET_BY_IDS_MAX} IDs per request; got ${Array.isArray(ids) ? ids.length : "non-array"}.`);
  }
  const payload = await requestJson({
    url: vectorizeUrl(accountId, `/${encodeURIComponent(INDEX_NAME)}/get_by_ids`),
    authHeaders,
    method: "POST",
    body: { ids },
    label: `get ${ids.length} vectors by ID`,
  });
  if (!Array.isArray(payload.result)) throw new PipelineError("get_by_ids returned a non-array result.");
  return payload.result;
}

async function validateStoredVectorSamples(accountId, authHeaders, local) {
  const positions = samplePositions(EXPECTED_COUNT, STORAGE_SAMPLE_COUNT);
  let maxVectorDelta = 0;
  let maxSelfScoreDelta = 0;
  let metadataFailures = 0;

  for (let start = 0; start < positions.length; start += STORAGE_FETCH_BATCH) {
    const batchPositions = positions.slice(start, start + STORAGE_FETCH_BATCH);
    const ids = batchPositions.map((position) => local.records[position].document_id);
    const fetchedRows = await fetchByIds(accountId, authHeaders, ids);
    const fetched = new Map(fetchedRows.map((row) => [row.id, row]));
    if (fetched.size !== ids.length) throw new PipelineError(`Stored-vector fetch returned ${fetched.size}/${ids.length}.`);

    for (const position of batchPositions) {
      const record = local.records[position];
      const remote = fetched.get(record.document_id);
      if (!remote || !Array.isArray(remote.values) || remote.values.length !== DIMENSIONS) throw new PipelineError(`Invalid fetched vector ${record.document_id}.`);
      const localVector = vectorAt(local.matrixBuffer, local.matrixHeader, position);
      let remoteNormSq = 0;
      let localRemoteDot = 0;
      for (let col = 0; col < DIMENSIONS; col += 1) {
        const remoteValue = Number(remote.values[col]);
        const localValue = localVector[col];
        if (!Number.isFinite(remoteValue)) throw new PipelineError(`Fetched vector ${record.document_id} contains invalid values.`);
        maxVectorDelta = Math.max(maxVectorDelta, Math.abs(localValue - remoteValue));
        remoteNormSq += remoteValue * remoteValue;
        localRemoteDot += localValue * remoteValue;
      }
      maxSelfScoreDelta = Math.max(maxSelfScoreDelta, Math.abs(1 - localRemoteDot / Math.sqrt(remoteNormSq)));
      const metadata = remote.metadata || {};
      if (Number(metadata.repository_index) !== Number(record.repository_index)) metadataFailures += 1;
      if (String(metadata.repository_name || "") !== String(record.repository_name || "")) metadataFailures += 1;
      if (String(metadata.retrieval_class || "") !== String(record.retrieval_class || "")) metadataFailures += 1;
      if (String(metadata.semantic_area || "") !== String(record.semantic_area || "")) metadataFailures += 1;
    }
  }

  return {
    sample_count: positions.length,
    maximum_vector_absolute_delta: maxVectorDelta,
    maximum_self_cosine_delta: maxSelfScoreDelta,
    metadata_failures: metadataFailures,
    pass: maxVectorDelta <= MAX_VECTOR_ABS_DELTA && maxSelfScoreDelta <= MAX_RECOMPUTED_SCORE_DELTA && metadataFailures === 0,
  };
}

async function embedQuery(accountId, authHeaders, query) {
  const payload = await requestJson({
    url: workersAiUrl(accountId),
    authHeaders,
    method: "POST",
    body: { queries: [query], instruction: QUERY_INSTRUCTION },
    label: `Workers AI query embedding: ${query}`,
  });
  return extractEmbedding(payload);
}

function exactTopK(local, queryVector, k) {
  const rows = new Array(EXPECTED_COUNT);
  for (let row = 0; row < EXPECTED_COUNT; row += 1) {
    rows[row] = {
      id: local.records[row].document_id,
      score: dotRow(local.matrixBuffer, local.matrixHeader, row, queryVector),
      row,
    };
  }
  rows.sort((a, b) => b.score - a.score || a.row - b.row);
  return rows.slice(0, k);
}

async function vectorizeQuery(accountId, authHeaders, queryVector) {
  const payload = await requestJson({
    url: vectorizeUrl(accountId, `/${encodeURIComponent(INDEX_NAME)}/query`),
    authHeaders,
    method: "POST",
    body: {
      vector: queryVector,
      topK: TOP_K,
      returnValues: true,
      returnMetadata: "all",
    },
    label: "Vectorize high-precision query",
  });
  const matches = payload.result?.matches;
  if (!Array.isArray(matches) || matches.length !== TOP_K) throw new PipelineError(`Vectorize returned ${matches?.length ?? 0}/${TOP_K} matches.`);
  return matches;
}

function overlap(local, remote, k) {
  const a = new Set(local.slice(0, k).map((row) => row.id));
  const b = new Set(remote.slice(0, k).map((row) => row.id));
  const shared = [...a].filter((id) => b.has(id));
  return { k, shared: shared.length, ratio: shared.length / k };
}

function evaluateQuery(local, query, queryVector, remoteMatches) {
  const exact = exactTopK(local, queryVector, TOP_K);
  const remote = remoteMatches.map((match) => ({
    id: String(match.id),
    score: Number(match.score),
    values: match.values,
    metadata: match.metadata || {},
  }));

  for (const row of remote) {
    if (!local.idToIndex.has(row.id)) throw new PipelineError(`Vectorize query returned unknown ID ${row.id}.`);
    if (!Array.isArray(row.values) || row.values.length !== DIMENSIONS) throw new PipelineError(`Vectorize query match ${row.id} is missing high-precision values.`);
  }

  const o10 = overlap(exact, remote, 10);
  const o25 = overlap(exact, remote, 25);
  const o50 = overlap(exact, remote, 50);
  const sameTop1Id = exact[0].id === remote[0].id;
  const remoteTop1LocalScore = dotRow(
    local.matrixBuffer,
    local.matrixHeader,
    local.idToIndex.get(remote[0].id),
    queryVector,
  );
  const top1ExactTieDelta = Math.abs(exact[0].score - remoteTop1LocalScore);
  const top1Equivalent = sameTop1Id || top1ExactTieDelta <= TOP1_EXACT_TIE_TOLERANCE;
  let maxRemoteScoreDelta = 0;
  let maxReportedVsReturnedCosineDelta = 0;
  let maxFetchedCosineDelta = 0;
  let metadataFailures = 0;
  const finiteRemoteScores = remote.every((row) => Number.isFinite(row.score));

  for (const match of remote) {
    const rowIndex = local.idToIndex.get(match.id);
    const localExactScore = dotRow(local.matrixBuffer, local.matrixHeader, rowIndex, queryVector);
    maxRemoteScoreDelta = Math.max(maxRemoteScoreDelta, Math.abs(localExactScore - match.score));

    let fetchedDot = 0;
    let fetchedNormSq = 0;
    for (let col = 0; col < DIMENSIONS; col += 1) {
      const value = Number(match.values[col]);
      fetchedDot += value * queryVector[col];
      fetchedNormSq += value * value;
    }
    const fetchedCosine = fetchedDot / Math.sqrt(fetchedNormSq);
    maxFetchedCosineDelta = Math.max(maxFetchedCosineDelta, Math.abs(localExactScore - fetchedCosine));
    if (Number.isFinite(match.score)) {
      maxReportedVsReturnedCosineDelta = Math.max(
        maxReportedVsReturnedCosineDelta,
        Math.abs(match.score - fetchedCosine),
      );
    } else {
      maxReportedVsReturnedCosineDelta = Number.POSITIVE_INFINITY;
    }

    const record = local.records[rowIndex];
    if (Number(match.metadata.repository_index) !== Number(record.repository_index)) metadataFailures += 1;
    if (String(match.metadata.repository_name || "") !== String(record.repository_name || "")) metadataFailures += 1;
    if (String(match.metadata.retrieval_class || "") !== String(record.retrieval_class || "")) metadataFailures += 1;
  }

  const checks = {
    top1_same_or_exact_tie: top1Equivalent,
    overlap_at_10: o10.ratio >= MIN_OVERLAP_10,
    overlap_at_25: o25.ratio >= MIN_OVERLAP_25,
    overlap_at_50: o50.ratio >= MIN_OVERLAP_50,
    remote_reported_scores_finite: finiteRemoteScores,
    returned_value_cosine_fidelity: maxFetchedCosineDelta <= MAX_RECOMPUTED_SCORE_DELTA,
    metadata_mapping: metadataFailures === 0,
  };

  return {
    query,
    checks,
    pass: Object.values(checks).every(Boolean),
    same_top1_id: sameTop1Id,
    top1_equivalent: top1Equivalent,
    top1_exact_tie_delta: top1ExactTieDelta,
    overlap_at_10: o10,
    overlap_at_25: o25,
    overlap_at_50: o50,
    maximum_remote_reported_score_delta: maxRemoteScoreDelta,
    maximum_reported_vs_returned_cosine_delta: maxReportedVsReturnedCosineDelta,
    reported_score_delta_within_diagnostic_tolerance: maxRemoteScoreDelta <= REPORTED_SCORE_DIAGNOSTIC_TOLERANCE,
    maximum_returned_value_cosine_delta: maxFetchedCosineDelta,
    metadata_failures: metadataFailures,
    local_top_50: exact.map((row, index) => ({ rank: index + 1, document_id: row.id, score: row.score })),
    vectorize_top_50: remote.map((row, index) => ({ rank: index + 1, document_id: row.id, score: row.score })),
  };
}

async function atomicWrite(path, content) {
  await fs.mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await fs.writeFile(tmp, content, "utf8");
  renameSync(tmp, path);
}

async function writeReports({ local, accountSource, authSource, remoteState, idSetValidation, storage, queryResults }) {
  const exactIdSetPass = idSetValidation.pass;
  const allQueriesPass = queryResults.every((result) => result.pass);
  const overallPass = exactIdSetPass && storage.pass && allQueriesPass;
  const report = {
    schema_version: VALIDATION_SCHEMA_VERSION,
    pipeline_stage: 6,
    backend_family: "cloudflare-vectorize",
    validation_generation: "v1",
    generated_at_utc: utcNow(),
    script: SCRIPT_NAME,
    source: {
      embedding_generation: PROVIDER_ARTIFACT_GENERATION,
      embeddings_npy_sha256: local.matrixSha,
      embedding_records_sha256: local.recordsSha,
      documents: EXPECTED_COUNT,
      repositories: EXPECTED_REPOSITORIES,
      model: MODEL,
      dimensions: DIMENSIONS,
      query_input_mode: QUERY_INPUT_MODE,
      query_instruction: QUERY_INSTRUCTION,
    },
    vectorize: {
      index_name: INDEX_NAME,
      dimensions: Number(remoteState.index.config?.dimensions),
      metric: remoteState.index.config?.metric,
      vector_count: Number(remoteState.info.vectorCount ?? remoteState.info.vector_count),
      high_precision_query_mode: "returnValues=true",
    },
    authentication: {
      account_resolution: accountSource,
      credential_resolution: authSource,
      secret_persisted_to_artifacts: false,
    },
    criteria: {
      minimum_overlap_at_10: MIN_OVERLAP_10,
      minimum_overlap_at_25: MIN_OVERLAP_25,
      minimum_overlap_at_50: MIN_OVERLAP_50,
      maximum_stored_vector_absolute_delta: MAX_VECTOR_ABS_DELTA,
      maximum_recomputed_cosine_delta: MAX_RECOMPUTED_SCORE_DELTA,
      vectorize_reported_score_delta_diagnostic_tolerance: REPORTED_SCORE_DIAGNOSTIC_TOLERANCE,
      vectorize_reported_score_delta_is_hard_gate: false,
      top1_same_or_exact_tie_required_for_each_query: true,
      top1_exact_tie_tolerance: TOP1_EXACT_TIE_TOLERANCE,
    },
    exact_remote_id_set: exactIdSetPass ? "PASS" : "FAIL",
    exact_remote_id_set_method: idSetValidation.method,
    list_vectors_observed_count: idSetValidation.listObservedCount,
    list_vectors_fallback_used: idSetValidation.listFallbackUsed,
    stored_vector_fidelity: storage,
    regression_queries: queryResults,
    overall_result: overallPass ? "PASS" : "FAIL",
  };

  const minO10 = Math.min(...queryResults.map((result) => result.overlap_at_10.ratio));
  const minO25 = Math.min(...queryResults.map((result) => result.overlap_at_25.ratio));
  const minO50 = Math.min(...queryResults.map((result) => result.overlap_at_50.ratio));
  const maxScoreDelta = Math.max(...queryResults.map((result) => result.maximum_remote_reported_score_delta));
  const text = [
    "Portfolio GitHub RAG pipeline — Stage 06 / Cloudflare Vectorize dense parity v1",
    "",
    `STATUS: ${overallPass ? "PASS" : "FAIL"}`,
    "",
    "IDENTITY",
    `  Index: ${INDEX_NAME}`,
    `  Model: ${MODEL}`,
    `  Documents/vectors: ${EXPECTED_COUNT}`,
    `  Dimensions: ${DIMENSIONS}`,
    `  Metric: ${METRIC}`,
    `  Exact remote ID set: ${exactIdSetPass ? "PASS" : "FAIL"}`,
    `  ID-set proof: ${idSetValidation.method}`,
    `  get_by_ids batch limit used: ${GET_BY_IDS_MAX}`,
    `  list-vectors observed: ${idSetValidation.listObservedCount}/${EXPECTED_COUNT}${idSetValidation.listFallbackUsed ? " (incomplete snapshot; exhaustive get_by_ids fallback used)" : ""}`,
    "",
    "STORED-VECTOR FIDELITY",
    `  Stratified samples: ${storage.sample_count}`,
    `  Max vector absolute delta: ${storage.maximum_vector_absolute_delta}`,
    `  Max self-cosine delta: ${storage.maximum_self_cosine_delta}`,
    `  Metadata failures: ${storage.metadata_failures}`,
    `  Result: ${storage.pass ? "PASS" : "FAIL"}`,
    "",
    "ANN / HIGH-PRECISION QUERY PARITY",
    `  Regression queries: ${queryResults.length}`,
    `  Minimum overlap@10: ${(minO10 * 100).toFixed(1)}%`,
    `  Minimum overlap@25: ${(minO25 * 100).toFixed(1)}%`,
    `  Minimum overlap@50: ${(minO50 * 100).toFixed(1)}%`,
    `  Maximum Vectorize reported-score delta: ${maxScoreDelta} (diagnostic; not a hard gate)`,
    `  Reported-score diagnostic tolerance: ${REPORTED_SCORE_DIAGNOSTIC_TOLERANCE}`,
    `  Hard acceptance uses returned-vector cosine recomputation plus rank/candidate parity.`,
    `  All hard query checks: ${allQueriesPass ? "PASS" : "FAIL"}`,
    "",
    ...queryResults.flatMap((result, index) => [
      `QUERY ${index + 1}: ${result.query}`,
      `  Same top-1 ID: ${result.same_top1_id}`,
      `  Top-1 equivalent (same ID or exact-score tie): ${result.top1_equivalent}`,
      `  Top-1 exact-score tie delta: ${result.top1_exact_tie_delta}`,
      `  Overlap@10: ${result.overlap_at_10.shared}/10 (${(result.overlap_at_10.ratio * 100).toFixed(1)}%)`,
      `  Overlap@25: ${result.overlap_at_25.shared}/25 (${(result.overlap_at_25.ratio * 100).toFixed(1)}%)`,
      `  Overlap@50: ${result.overlap_at_50.shared}/50 (${(result.overlap_at_50.ratio * 100).toFixed(1)}%)`,
      `  Max reported-score vs local-cosine delta: ${result.maximum_remote_reported_score_delta} (diagnostic ${result.reported_score_delta_within_diagnostic_tolerance ? "within" : "outside"} ${REPORTED_SCORE_DIAGNOSTIC_TOLERANCE})`,
      `  Max reported-score vs returned-vector cosine delta: ${result.maximum_reported_vs_returned_cosine_delta}`,
      `  Max returned-vector cosine vs local-cosine delta: ${result.maximum_returned_value_cosine_delta}`,
      `  Metadata failures: ${result.metadata_failures}`,
      `  Hard checks: ${Object.entries(result.checks).map(([name, ok]) => `${name}=${ok}`).join(", ")}`,
      `  Result: ${result.pass ? "PASS" : "FAIL"}`,
      "",
    ]),
    "SCOPE",
    "  This validates the Vectorize dense backend against exact local cosine in the Qwen vector space.",
    "  Full production RAG ranking/generation validation belongs to the later Worker runtime integration stage.",
    "",
  ].join("\n");

  await atomicWrite(JSON_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  await atomicWrite(TEXT_REPORT_PATH, text);
  return report;
}

async function main() {
  console.log("Portfolio GitHub RAG pipeline — Stage 06 / Cloudflare Vectorize dense parity v1");
  console.log(`RAG root: ${RAG_ROOT}`);
  console.log();
  console.log("VALIDATION MODE");
  console.log("  Remote mutations: NONE");
  console.log("  Query scoring: Vectorize high precision (returnValues=true)");
  console.log(`  Regression queries: ${REGRESSION_QUERIES.length}`);
  console.log();

  if (process.argv.length !== 2) throw new PipelineError("This script intentionally accepts zero command-line arguments.");

  console.log("[1/8] Validate Stage 03 + Stage 05 local artifact lineage ...");
  const local = await validateLocalArtifacts();
  console.log(`      SUCCESS (${EXPECTED_COUNT} x ${DIMENSIONS}; exact source hashes preserved)`);

  console.log("[2/8] Resolve Cloudflare account and existing Wrangler authentication ...");
  const account = resolveCloudflareAccountId();
  const auth = resolveCloudflareAuth();
  console.log(`      SUCCESS (account via ${account.source}; credential via ${auth.source})`);

  console.log("[3/8] Validate current Vectorize index identity and vector count ...");
  const remoteState = await getIndexAndInfo(account.accountId, auth.headers);
  console.log(`      SUCCESS (${Number(remoteState.info.vectorCount ?? remoteState.info.vector_count)}/${EXPECTED_COUNT}; ${DIMENSIONS}D ${METRIC})`);

  console.log("[4/8] Prove the complete remote ID set ...");
  const idSetValidation = await verifyExactRemoteIds(account.accountId, auth.headers, local, remoteState);
  if (idSetValidation.listFallbackUsed) {
    console.log(`      NOTE (list-vectors observed ${idSetValidation.listObservedCount}/${EXPECTED_COUNT}; using exhaustive get_by_ids proof)`);
  }
  console.log(`      SUCCESS (${idSetValidation.exactCount}/${EXPECTED_COUNT}; exact ID set via ${idSetValidation.method})`);

  console.log(`[5/8] Validate ${STORAGE_SAMPLE_COUNT} stratified stored vectors + metadata ...`);
  const storage = await validateStoredVectorSamples(account.accountId, auth.headers, local);
  console.log(`      ${storage.pass ? "SUCCESS" : "FAILED"} (max vector delta ${storage.maximum_vector_absolute_delta}; metadata failures ${storage.metadata_failures})`);

  console.log(`[6/8] Embed ${REGRESSION_QUERIES.length} employer-style regression queries with the Stage 03 Qwen query contract ...`);
  const queryVectors = [];
  for (let i = 0; i < REGRESSION_QUERIES.length; i += 1) {
    process.stdout.write(`      query ${i + 1}/${REGRESSION_QUERIES.length} ... `);
    queryVectors.push(await embedQuery(account.accountId, auth.headers, REGRESSION_QUERIES[i]));
    console.log("SUCCESS");
  }

  console.log("[7/8] Compare exact local cosine against Vectorize high-precision top-50 retrieval ...");
  const queryResults = [];
  for (let i = 0; i < REGRESSION_QUERIES.length; i += 1) {
    const matches = await vectorizeQuery(account.accountId, auth.headers, queryVectors[i]);
    const result = evaluateQuery(local, REGRESSION_QUERIES[i], queryVectors[i], matches);
    queryResults.push(result);
    console.log(
      `      query ${i + 1}/${REGRESSION_QUERIES.length}: ${result.pass ? "PASS" : "FAIL"} | `
      + `top1=${result.top1_equivalent} | overlap 10/25/50=${(result.overlap_at_10.ratio * 100).toFixed(0)}%/`
      + `${(result.overlap_at_25.ratio * 100).toFixed(0)}%/${(result.overlap_at_50.ratio * 100).toFixed(0)}% `
      + `| returned-cos Δ=${result.maximum_returned_value_cosine_delta.toExponential(2)} `
      + `| reported-score/local Δ=${result.maximum_remote_reported_score_delta.toExponential(2)}${result.reported_score_delta_within_diagnostic_tolerance ? "" : " [diagnostic]"} `
      + `| score/returned-cos Δ=${result.maximum_reported_vs_returned_cosine_delta.toExponential(2)}`,
    );
  }

  console.log("[8/8] Write dense-backend parity reports ...");
  const report = await writeReports({
    local,
    accountSource: account.source,
    authSource: auth.source,
    remoteState,
    idSetValidation,
    storage,
    queryResults,
  });
  console.log(`      SUCCESS (${report.overall_result})`);

  console.log();
  console.log(`STAGE 06 CLOUDFLARE VECTORIZE DENSE PARITY: ${report.overall_result}`);
  console.log(`Index:              ${INDEX_NAME}`);
  console.log(`Exact ID set:       ${report.exact_remote_id_set}`);
  console.log(`Storage fidelity:   ${storage.pass ? "PASS" : "FAIL"}`);
  console.log(`Regression queries: ${queryResults.filter((result) => result.pass).length}/${queryResults.length} PASS`);
  console.log();
  console.log("OUTPUT");
  console.log("  rag-corpus/vectorize-cloudflare-v1/vectorize-dense-parity-validation-v1.json");
  console.log("  rag-corpus/vectorize-cloudflare-v1/vectorize-dense-parity-validation-v1.txt");
  console.log();
  if (report.overall_result !== "PASS") {
    console.log("Do not integrate Vectorize into the production Worker until the failed criterion is understood.");
    process.exitCode = 1;
  } else {
    console.log("NEXT");
    console.log("  Dense Vectorize backend accepted. Next implementation stage is Worker runtime retrieval/reranking/generation integration.");
  }
}

main().catch((error) => {
  console.error();
  console.error("STAGE 06 CLOUDFLARE VECTORIZE DENSE PARITY: FAILED");
  console.error(`Reason: ${error?.message || error}`);
  process.exitCode = 1;
});
