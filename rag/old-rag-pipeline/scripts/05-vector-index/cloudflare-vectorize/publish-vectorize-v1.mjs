#!/usr/bin/env node
/**
 * Portfolio GitHub RAG pipeline — Stage 05 / Cloudflare Vectorize publication v1.
 *
 * ZERO-ARGUMENT USAGE
 * -------------------
 * Run from any working directory:
 *
 *   node rag/scripts/05-vector-index/cloudflare-vectorize/publish-vectorize-v1.mjs
 *
 * PURPOSE
 * -------
 * Publish the already validated Cloudflare/Qwen Stage 03 vectors to a dedicated
 * Cloudflare Vectorize V2 index without modifying the Nomic/Pinecone reference
 * path.
 *
 * INPUT
 * -----
 *   rag/rag-corpus/embeddings-cloudflare-v1/embeddings.npy
 *   rag/rag-corpus/embeddings-cloudflare-v1/embedding-records.jsonl
 *   rag/rag-corpus/embeddings-cloudflare-v1/embedding-manifest.json
 *
 * REMOTE TARGET
 * -------------
 *   Index:      portfolio-career-rag-cloudflare-v1
 *   Dimensions: 1024
 *   Metric:     cosine
 *   Vector IDs: exact Stage 03 document_id values
 *
 * OUTPUT
 * ------
 *   rag/rag-corpus/vectorize-cloudflare-v1/vectorize-publication-manifest.json
 *   rag/rag-corpus/vectorize-cloudflare-v1/vectorize-publication-validation-report.txt
 *
 * SAFETY
 * ------
 * - Takes zero arguments.
 * - Uses upsert, so an interrupted run can be rerun safely.
 * - Never deletes or recreates a Vectorize index.
 * - If an existing index has the wrong dimensions/metric, fails loudly.
 * - Requires the final remote ID set to equal the exact 2,808 local document IDs.
 * - Never persists Cloudflare credentials.
 * - Existing Nomic/Pinecone artifacts are untouched.
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
    ) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new PipelineError("Could not locate the enclosing rag/ root. Expected this script under rag/scripts/.");
}

const RAG_ROOT = findRagRoot(SCRIPT_DIR);
const PORTFOLIO_ROOT = dirname(RAG_ROOT);
const CORPUS_ROOT = join(RAG_ROOT, "rag-corpus");
const EMBEDDING_DIR = join(CORPUS_ROOT, "embeddings-cloudflare-v1");
const MATRIX_PATH = join(EMBEDDING_DIR, "embeddings.npy");
const RECORDS_PATH = join(EMBEDDING_DIR, "embedding-records.jsonl");
const EMBEDDING_MANIFEST_PATH = join(EMBEDDING_DIR, "embedding-manifest.json");

const OUTPUT_DIR = join(CORPUS_ROOT, "vectorize-cloudflare-v1");
const PUBLICATION_MANIFEST_PATH = join(OUTPUT_DIR, "vectorize-publication-manifest.json");
const PUBLICATION_REPORT_PATH = join(OUTPUT_DIR, "vectorize-publication-validation-report.txt");

const PUBLICATION_SCHEMA_VERSION = "1.0.0";
const INDEX_NAME = "portfolio-career-rag-cloudflare-v1";
const INDEX_DESCRIPTION = "Portfolio career RAG — Qwen3 evidence-document vectors v1";
const EXPECTED_COUNT = 2808;
const EXPECTED_REPOSITORIES = 134;
const DIMENSIONS = 1024;
const METRIC = "cosine";
const MODEL = "@cf/qwen/qwen3-embedding-0.6b";
const PROVIDER = "cloudflare-workers-ai";
const PROVIDER_ARTIFACT_GENERATION = "cloudflare-v1";
const EXPECTED_EMBEDDING_SCHEMA_MAJOR = "4";
const DTYPE = "float32";

// Cloudflare's current HTTP API supports up to 5,000 vectors per upsert. A
// smaller batch keeps retries bounded and avoids rebuilding one very large
// multipart request on transient failures.
const UPSERT_BATCH_SIZE = 500;
const API_MAX_RETRIES = 5;
const API_TIMEOUT_MS = 120_000;
const MUTATION_VISIBILITY_TIMEOUT_MS = 5 * 60_000;
const MUTATION_POLL_MS = 3_000;
const LIST_PAGE_SIZE = 1000;
const GET_BY_IDS_MAX = 20;
const EXHAUSTIVE_ID_FETCH_BATCH_SIZE = GET_BY_IDS_MAX;
const ROUND_TRIP_SAMPLE_COUNT = 32;
const ROUND_TRIP_FETCH_BATCH_SIZE = GET_BY_IDS_MAX;
const MAX_VECTOR_ABS_DELTA = 1e-6;
const UNIT_NORM_TOLERANCE = 2e-5;
const MAX_METADATA_BYTES = 10 * 1024;

function utcNow() {
  return new Date().toISOString();
}

function rel(path) {
  const value = relative(RAG_ROOT, path);
  return value && !value.startsWith("..") ? value : path;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
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
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        // handled below
      }
    }
  }
  throw new PipelineError("Wrangler returned output that could not be parsed as JSON.");
}

function runWranglerJson(args) {
  // Node on Windows can throw EINVAL when spawning the npx.cmd shim directly.
  // Route fixed internal Wrangler subcommands through cmd.exe instead.
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
  const accounts = Array.isArray(whoami.accounts) ? whoami.accounts : [];
  const valid = accounts.filter((account) => account && typeof account.id === "string" && account.id.trim());
  if (valid.length === 1) return { accountId: valid[0].id.trim(), source: "wrangler whoami" };
  if (valid.length === 0) throw new PipelineError("Wrangler returned no Cloudflare account ID.");
  const options = valid.map((account) => `${account.name || "unnamed"} (${account.id})`).join(", ");
  throw new PipelineError(`Multiple Cloudflare accounts found. Set CLOUDFLARE_ACCOUNT_ID for this run. Accounts: ${options}`);
}

function resolveCloudflareAuth() {
  const bearer = String(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN || "").trim();
  if (bearer) return { headers: { Authorization: `Bearer ${bearer}` }, source: "environment bearer token" };

  const key = String(process.env.CLOUDFLARE_API_KEY || "").trim();
  const email = String(process.env.CLOUDFLARE_EMAIL || "").trim();
  if (key && email) {
    return { headers: { "X-Auth-Key": key, "X-Auth-Email": email }, source: "environment API key/email" };
  }

  const auth = runWranglerJson(["auth", "token", "--json"]);
  if ((auth.type === "api_token" || auth.type === "oauth") && typeof auth.token === "string" && auth.token.trim()) {
    return { headers: { Authorization: `Bearer ${auth.token.trim()}` }, source: `wrangler ${auth.type}` };
  }
  if (auth.type === "api_key" && auth.key && auth.email) {
    return {
      headers: { "X-Auth-Key": String(auth.key), "X-Auth-Email": String(auth.email) },
      source: "wrangler api_key",
    };
  }
  throw new PipelineError("Wrangler did not return a usable Cloudflare authentication credential.");
}

function summarizeApiError(parsed, bodyText) {
  return parsed?.errors?.map((item) => item?.message || String(item)).join(" | ")
    || parsed?.messages?.map((item) => item?.message || String(item)).join(" | ")
    || String(bodyText || "").slice(0, 700).replace(/\s+/g, " ");
}

function vectorizePermissionHint(status, summary) {
  if (status !== 403) return "";
  return " Wrangler is authenticated but this token may be missing Cloudflare Vectorize Read/Write permission. "
    + "Re-run `npx wrangler login` and grant the Vectorize permissions, then retry.";
}

async function apiJson({ accountId, authHeaders, method, suffix, body = undefined, allow404 = false, label }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes${suffix}`;
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

    if (allow404 && response.status === 404) return { status: 404, parsed };
    if (response.ok && parsed && parsed.success !== false) return { status: response.status, parsed };

    const summary = summarizeApiError(parsed, bodyText);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= API_MAX_RETRIES) {
      throw new PipelineError(`${label}: Cloudflare API HTTP ${response.status}. ${summary}${vectorizePermissionHint(response.status, summary)}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(30_000, retryAfter * 1000)
      : Math.min(30_000, 1000 * 2 ** (attempt - 1));
    await sleep(waitMs);
  }
  throw new PipelineError(`${label}: unexpected retry-loop termination.`);
}

async function apiUpsertNdjson({ accountId, authHeaders, ndjson, label }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/vectorize/v2/indexes/${encodeURIComponent(INDEX_NAME)}/upsert?unparsable-behavior=error`;

  for (let attempt = 1; attempt <= API_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    let response;
    let bodyText = "";
    try {
      const form = new FormData();
      form.append("vectors", new Blob([ndjson], { type: "application/x-ndjson" }), "vectors.ndjson");
      response = await fetch(url, {
        method: "POST",
        headers: { ...authHeaders, Accept: "application/json" },
        body: form,
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
    if (response.ok && parsed && parsed.success !== false) {
      const mutationId = parsed.result?.mutationId ?? parsed.result?.mutation_id;
      if (!mutationId) throw new PipelineError(`${label}: Cloudflare succeeded but returned no mutation ID.`);
      return String(mutationId);
    }

    const summary = summarizeApiError(parsed, bodyText);
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= API_MAX_RETRIES) {
      throw new PipelineError(`${label}: Cloudflare API HTTP ${response.status}. ${summary}${vectorizePermissionHint(response.status, summary)}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(30_000, retryAfter * 1000)
      : Math.min(30_000, 1000 * 2 ** (attempt - 1));
    await sleep(waitMs);
  }
  throw new PipelineError(`${label}: unexpected retry-loop termination.`);
}

function loadJson(path) {
  try {
    const value = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not a JSON object");
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
  if (rows.length === 0) throw new PipelineError(`Input is empty: ${rel(path)}`);
  return rows;
}

function readNpyHeader(buffer) {
  if (buffer.length < 10 || buffer[0] !== 0x93 || buffer.toString("ascii", 1, 6) !== "NUMPY") {
    throw new PipelineError("embeddings.npy has an invalid NPY magic header.");
  }
  if (buffer[6] !== 1 || buffer[7] !== 0) throw new PipelineError("embeddings.npy must be NPY v1.0.");
  const headerLength = buffer.readUInt16LE(8);
  const headerEnd = 10 + headerLength;
  const text = buffer.toString("ascii", 10, headerEnd);
  const shape = text.match(/'shape':\s*\((\d+)\s*,\s*(\d+)\s*\)/);
  if (!shape || !text.includes("'descr': '<f4'") || !text.includes("'fortran_order': False")) {
    throw new PipelineError("embeddings.npy header contract is invalid; expected C-order little-endian float32.");
  }
  return { rows: Number(shape[1]), cols: Number(shape[2]), dataOffset: headerEnd };
}

function validateMatrix(buffer) {
  const header = readNpyHeader(buffer);
  if (header.rows !== EXPECTED_COUNT || header.cols !== DIMENSIONS) {
    throw new PipelineError(`Embedding matrix shape (${header.rows}, ${header.cols}) != (${EXPECTED_COUNT}, ${DIMENSIONS}).`);
  }
  const expectedBytes = header.dataOffset + EXPECTED_COUNT * DIMENSIONS * 4;
  if (buffer.length !== expectedBytes) throw new PipelineError(`embeddings.npy byte length ${buffer.length} != expected ${expectedBytes}.`);

  let maxNormError = 0;
  for (let row = 0; row < EXPECTED_COUNT; row += 1) {
    let sum = 0;
    let offset = header.dataOffset + row * DIMENSIONS * 4;
    for (let col = 0; col < DIMENSIONS; col += 1) {
      const value = buffer.readFloatLE(offset);
      offset += 4;
      if (!Number.isFinite(value)) throw new PipelineError(`Matrix contains NaN/Inf at row ${row}, col ${col}.`);
      sum += value * value;
    }
    const norm = Math.sqrt(sum);
    if (norm <= 0) throw new PipelineError(`Matrix row ${row} is a zero vector.`);
    maxNormError = Math.max(maxNormError, Math.abs(norm - 1));
  }
  if (maxNormError > UNIT_NORM_TOLERANCE) {
    throw new PipelineError(`Matrix vectors are not L2-normalized; max norm error ${maxNormError}.`);
  }
  return { ...header, maxNormError };
}

function vectorAt(buffer, header, row) {
  if (!Number.isInteger(row) || row < 0 || row >= header.rows) throw new PipelineError(`Invalid matrix row ${row}.`);
  const vector = new Array(header.cols);
  let offset = header.dataOffset + row * header.cols * 4;
  for (let col = 0; col < header.cols; col += 1) {
    vector[col] = buffer.readFloatLE(offset);
    offset += 4;
  }
  return vector;
}

async function validateLocalInputs() {
  for (const path of [MATRIX_PATH, RECORDS_PATH, EMBEDDING_MANIFEST_PATH]) {
    if (!existsSync(path)) throw new PipelineError(`Missing Stage 03 artifact: ${rel(path)}`);
  }

  const manifest = loadJson(EMBEDDING_MANIFEST_PATH);
  if (String(manifest.embedding_schema_version || "").split(".", 1)[0] !== EXPECTED_EMBEDDING_SCHEMA_MAJOR) {
    throw new PipelineError(`Unsupported embedding schema ${JSON.stringify(manifest.embedding_schema_version)}.`);
  }
  if (Number(manifest.pipeline_step) !== 3) throw new PipelineError("Embedding manifest pipeline_step must be 3.");
  if (manifest.provider_artifact_generation !== PROVIDER_ARTIFACT_GENERATION) {
    throw new PipelineError(`Expected provider artifact ${PROVIDER_ARTIFACT_GENERATION}; found ${manifest.provider_artifact_generation}.`);
  }
  const embedding = manifest.embedding || {};
  const identityChecks = [
    ["provider", embedding.provider, PROVIDER],
    ["model", embedding.model, MODEL],
    ["dimensions", Number(embedding.dimensions), DIMENSIONS],
    ["similarity", embedding.similarity, METRIC],
    ["dtype", embedding.dtype, DTYPE],
  ];
  const mismatches = identityChecks.filter(([, actual, expected]) => actual !== expected);
  if (mismatches.length) {
    throw new PipelineError(`Embedding identity mismatch: ${mismatches.map(([name, actual, expected]) => `${name}=${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`).join("; ")}`);
  }

  const [matrixSha, recordsSha] = await Promise.all([sha256File(MATRIX_PATH), sha256File(RECORDS_PATH)]);
  if (manifest.artifacts?.["embeddings.npy"]?.sha256 !== matrixSha) throw new PipelineError("embeddings.npy SHA-256 does not match Stage 03 manifest.");
  if (manifest.artifacts?.["embedding-records.jsonl"]?.sha256 !== recordsSha) throw new PipelineError("embedding-records.jsonl SHA-256 does not match Stage 03 manifest.");

  const matrixBuffer = await fs.readFile(MATRIX_PATH);
  const matrixHeader = validateMatrix(matrixBuffer);
  const records = loadJsonl(RECORDS_PATH);
  if (records.length !== EXPECTED_COUNT) throw new PipelineError(`Embedding record count ${records.length} != ${EXPECTED_COUNT}.`);

  const ids = new Set();
  const repositories = new Set();
  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const id = String(record.document_id || "").trim();
    if (!id) throw new PipelineError(`Embedding record ${i} has no document_id.`);
    if (Buffer.byteLength(id, "utf8") > 64) throw new PipelineError(`Vector ID exceeds 64 bytes: ${id}`);
    if (ids.has(id)) throw new PipelineError(`Duplicate document_id: ${id}`);
    ids.add(id);
    if (Number(record.vector_index) !== i) throw new PipelineError(`vector_index mismatch at record ${i}.`);
    if (record.embedding_model !== MODEL) throw new PipelineError(`Embedding model mismatch for ${id}.`);
    if (Number(record.embedding_dimensions) !== DIMENSIONS) throw new PipelineError(`Embedding dimension metadata mismatch for ${id}.`);
    if (record.embedding_similarity !== METRIC) throw new PipelineError(`Embedding similarity metadata mismatch for ${id}.`);
    repositories.add(Number(record.repository_index));
  }
  if (repositories.size !== EXPECTED_REPOSITORIES) throw new PipelineError(`Records cover ${repositories.size}/${EXPECTED_REPOSITORIES} repositories.`);

  return { manifest, matrixBuffer, matrixHeader, records, matrixSha, recordsSha, ids };
}

function compactMetadata(record) {
  const metadata = {
    repository_index: Number(record.repository_index),
    repository_name: String(record.repository_name || ""),
    retrieval_class: String(record.retrieval_class || ""),
    semantic_area: String(record.semantic_area || ""),
    evidence_level: String(record.evidence_level || ""),
    evidence_polarity: String(record.evidence_polarity || ""),
    specificity_score: Number(record.specificity_score || 0),
    concrete_signal_count: Number(record.concrete_signal_count || 0),
    embedding_generation: String(record.embedding_generation || "v4"),
    embedding_model: MODEL,
  };
  if (record.repository_url) metadata.repository_url = String(record.repository_url);
  const bytes = Buffer.byteLength(JSON.stringify(metadata), "utf8");
  if (bytes > MAX_METADATA_BYTES) throw new PipelineError(`Metadata for ${record.document_id} is ${bytes} bytes; Vectorize limit is ${MAX_METADATA_BYTES}.`);
  return metadata;
}

async function ensureIndex(accountId, authHeaders, { allowCreate = true } = {}) {
  const suffix = `/${encodeURIComponent(INDEX_NAME)}`;
  const existing = await apiJson({
    accountId,
    authHeaders,
    method: "GET",
    suffix,
    allow404: true,
    label: "get Vectorize index",
  });

  let created = false;
  let result;
  if (existing.status === 404) {
    if (!allowCreate) {
      throw new PipelineError(`Vectorize index ${INDEX_NAME} does not exist; --verify-only never creates remote resources.`);
    }
    const createdResponse = await apiJson({
      accountId,
      authHeaders,
      method: "POST",
      suffix: "",
      body: {
        name: INDEX_NAME,
        description: INDEX_DESCRIPTION,
        config: { dimensions: DIMENSIONS, metric: METRIC },
      },
      label: "create Vectorize index",
    });
    result = createdResponse.parsed.result;
    created = true;
  } else {
    result = existing.parsed.result;
  }

  const config = result?.config || {};
  if (String(result?.name || INDEX_NAME) !== INDEX_NAME) throw new PipelineError("Vectorize returned an unexpected index name.");
  if (Number(config.dimensions) !== DIMENSIONS || String(config.metric) !== METRIC) {
    throw new PipelineError(
      `Existing Vectorize index ${INDEX_NAME} has incompatible config dimensions=${config.dimensions}, metric=${config.metric}. `
      + "This script will not delete/recreate it automatically.",
    );
  }
  return { created, index: result };
}

async function getIndexInfo(accountId, authHeaders) {
  const response = await apiJson({
    accountId,
    authHeaders,
    method: "GET",
    suffix: `/${encodeURIComponent(INDEX_NAME)}/info`,
    label: "get Vectorize index info",
  });
  return response.parsed.result || {};
}

function buildNdjsonBatch(local, start, end) {
  const lines = [];
  for (let i = start; i < end; i += 1) {
    const record = local.records[i];
    lines.push(JSON.stringify({
      id: record.document_id,
      values: vectorAt(local.matrixBuffer, local.matrixHeader, i),
      metadata: compactMetadata(record),
    }));
  }
  return `${lines.join("\n")}\n`;
}

async function upsertCorpus(accountId, authHeaders, local) {
  const totalBatches = Math.ceil(EXPECTED_COUNT / UPSERT_BATCH_SIZE);
  const mutationIds = [];
  for (let batch = 0; batch < totalBatches; batch += 1) {
    const start = batch * UPSERT_BATCH_SIZE;
    const end = Math.min(EXPECTED_COUNT, start + UPSERT_BATCH_SIZE);
    const label = `batch ${batch + 1}/${totalBatches} [${start}-${end - 1}]`;
    process.stdout.write(`      ${label} ... `);
    const ndjson = buildNdjsonBatch(local, start, end);
    if (Buffer.byteLength(ndjson, "utf8") > 100 * 1024 * 1024) {
      throw new PipelineError(`${label} exceeds Cloudflare's 100 MB upload limit.`);
    }
    const mutationId = await apiUpsertNdjson({ accountId, authHeaders, ndjson, label });
    mutationIds.push(mutationId);
    console.log(`SUCCESS (${mutationId})`);
  }
  return mutationIds;
}

async function waitForMutationVisibility(accountId, authHeaders, lastMutationId) {
  const deadline = Date.now() + MUTATION_VISIBILITY_TIMEOUT_MS;
  let lastInfo = {};
  while (Date.now() < deadline) {
    lastInfo = await getIndexInfo(accountId, authHeaders);
    const count = Number(lastInfo.vectorCount ?? lastInfo.vector_count ?? -1);
    const processed = String(lastInfo.processedUpToMutation ?? lastInfo.processed_up_to_mutation ?? "");
    if (count === EXPECTED_COUNT && processed === lastMutationId) return lastInfo;
    process.stdout.write(`\r      visible vectors ${Math.max(0, count)}/${EXPECTED_COUNT}; processed mutation ${processed || "pending"}   `);
    await sleep(MUTATION_POLL_MS);
  }
  process.stdout.write("\n");
  const count = Number(lastInfo.vectorCount ?? lastInfo.vector_count ?? -1);
  const processed = String(lastInfo.processedUpToMutation ?? lastInfo.processed_up_to_mutation ?? "");
  throw new PipelineError(
    `Vectorize did not make the final mutation visible within ${MUTATION_VISIBILITY_TIMEOUT_MS / 1000}s. `
    + `vectorCount=${count}, processedUpToMutation=${processed || "none"}, expected final mutation=${lastMutationId}.`,
  );
}

function normalizeListedIds(result) {
  const vectors = Array.isArray(result?.vectors) ? result.vectors : [];
  return vectors.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item.id === "string") return item.id;
    throw new PipelineError(`Unexpected list-vectors item: ${JSON.stringify(item)}`);
  });
}

async function listVectorIdsDiagnostic(accountId, authHeaders) {
  // Diagnostic only. Do not depend on cursor pagination for correctness:
  // this account has returned a cursor that the next request rejects as
  // corrupted. Exact set proof is performed independently via vectorCount
  // plus exhaustive get_by_ids in the live-enforced 20-ID batches.
  const params = new URLSearchParams({ count: String(LIST_PAGE_SIZE) });
  try {
    const response = await apiJson({
      accountId,
      authHeaders,
      method: "GET",
      suffix: `/${encodeURIComponent(INDEX_NAME)}/list?${params.toString()}`,
      label: "list Vectorize IDs diagnostic page 1",
    });
    const result = response.parsed.result || {};
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
    return {
      ids: [],
      pages: 0,
      reportedTotal: null,
      complete: false,
      incompleteReason: `list-vectors diagnostic unavailable: ${error.message}`,
    };
  }
}

async function fetchExpectedIdsExhaustively(accountId, authHeaders, expectedIds) {
  const fetchedIds = [];
  for (let start = 0; start < expectedIds.length; start += EXHAUSTIVE_ID_FETCH_BATCH_SIZE) {
    const batch = expectedIds.slice(start, start + EXHAUSTIVE_ID_FETCH_BATCH_SIZE);
    const response = await apiJson({
      accountId,
      authHeaders,
      method: "POST",
      suffix: `/${encodeURIComponent(INDEX_NAME)}/get_by_ids`,
      body: { ids: batch },
      label: `get expected Vectorize IDs ${start}-${start + batch.length - 1}`,
    });
    const result = response.parsed.result;
    if (!Array.isArray(result)) throw new PipelineError("Vectorize get_by_ids returned a non-array result during exhaustive ID verification.");
    const returned = result.map((item) => item?.id).filter((id) => typeof id === "string");
    const returnedSet = new Set(returned);
    if (returnedSet.size !== returned.length) throw new PipelineError(`Vectorize get_by_ids returned duplicate IDs for batch starting at ${start}.`);
    const requestedSet = new Set(batch);
    const unexpected = returned.filter((id) => !requestedSet.has(id));
    const missing = batch.filter((id) => !returnedSet.has(id));
    if (unexpected.length || missing.length || returned.length !== batch.length) {
      throw new PipelineError(
        `Exhaustive expected-ID verification failed for batch ${start}-${start + batch.length - 1}: `
        + `missing=${missing.slice(0, 10).join(",") || "none"}; unexpected=${unexpected.slice(0, 10).join(",") || "none"}.`,
      );
    }
    fetchedIds.push(...returned);
  }
  return fetchedIds;
}

async function verifyExactRemoteIdSet(accountId, authHeaders, local, finalInfo) {
  const remoteCount = Number(finalInfo.vectorCount ?? finalInfo.vector_count ?? -1);
  if (remoteCount !== EXPECTED_COUNT) {
    throw new PipelineError(`Remote Vectorize vectorCount ${remoteCount} != ${EXPECTED_COUNT}; exact ID-set proof is impossible.`);
  }

  const expectedIds = local.records.map((record) => record.document_id);
  const expectedSet = new Set(expectedIds);
  if (expectedSet.size !== EXPECTED_COUNT) throw new PipelineError("Local expected document IDs are not unique.");

  const listing = await listVectorIdsDiagnostic(accountId, authHeaders);
  const listedSet = new Set(listing.ids);
  if (listing.complete && listedSet.size === EXPECTED_COUNT && [...expectedSet].every((id) => listedSet.has(id))) {
    return {
      method: "list-vectors-cursor-pagination",
      exactCount: EXPECTED_COUNT,
      listObservedCount: listing.ids.length,
      listPages: listing.pages,
      listReportedTotal: listing.reportedTotal,
      listFallbackUsed: false,
    };
  }

  const fetchedIds = await fetchExpectedIdsExhaustively(accountId, authHeaders, expectedIds);
  const fetchedSet = new Set(fetchedIds);
  if (fetchedIds.length !== EXPECTED_COUNT || fetchedSet.size !== EXPECTED_COUNT || [...expectedSet].some((id) => !fetchedSet.has(id))) {
    throw new PipelineError(`Exhaustive get_by_ids verification did not return all ${EXPECTED_COUNT} expected IDs.`);
  }

  // vectorCount == EXPECTED_COUNT plus successful retrieval of every one of the
  // EXPECTED_COUNT unique expected IDs is a complete set proof: there is no
  // remaining cardinality for an extra remote ID. This also avoids treating a
  // stale/incomplete list-vectors snapshot as data loss.
  return {
    method: "vector-count-plus-exhaustive-get-by-ids",
    exactCount: EXPECTED_COUNT,
    listObservedCount: listing.ids.length,
    listPages: listing.pages,
    listReportedTotal: listing.reportedTotal,
    listFallbackUsed: true,
    listIncompleteReason: listing.incompleteReason || "listed IDs did not exactly match the expected set",
  };
}

function samplePositions(total, count) {
  if (count <= 1) return [0];
  const result = [];
  const seen = new Set();
  for (let i = 0; i < count; i += 1) {
    const idx = Math.round((i * (total - 1)) / (count - 1));
    if (!seen.has(idx)) {
      seen.add(idx);
      result.push(idx);
    }
  }
  return result;
}

function normalizeFetchedVectors(result) {
  if (!Array.isArray(result)) throw new PipelineError("Vectorize get_by_ids returned a non-array result.");
  const map = new Map();
  for (const item of result) {
    if (!item || typeof item.id !== "string") throw new PipelineError("Vectorize get_by_ids returned a vector without an ID.");
    map.set(item.id, item);
  }
  return map;
}

async function fetchVectors(accountId, authHeaders, ids) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > GET_BY_IDS_MAX) {
    throw new PipelineError(`Vectorize get_by_ids requires 1-${GET_BY_IDS_MAX} IDs per request; got ${Array.isArray(ids) ? ids.length : "non-array"}.`);
  }
  const response = await apiJson({
    accountId,
    authHeaders,
    method: "POST",
    suffix: `/${encodeURIComponent(INDEX_NAME)}/get_by_ids`,
    body: { ids },
    label: `fetch ${ids.length} Vectorize vectors`,
  });
  return normalizeFetchedVectors(response.parsed.result);
}

async function validateRoundTripSamples(accountId, authHeaders, local) {
  const positions = samplePositions(EXPECTED_COUNT, ROUND_TRIP_SAMPLE_COUNT);
  const fetched = new Map();
  for (let start = 0; start < positions.length; start += ROUND_TRIP_FETCH_BATCH_SIZE) {
    const batchPositions = positions.slice(start, start + ROUND_TRIP_FETCH_BATCH_SIZE);
    const batchIds = batchPositions.map((position) => local.records[position].document_id);
    const batchFetched = await fetchVectors(accountId, authHeaders, batchIds);
    if (batchFetched.size !== batchIds.length) {
      throw new PipelineError(`Round-trip fetched ${batchFetched.size}/${batchIds.length} vectors for sample batch ${start}.`);
    }
    for (const [id, row] of batchFetched) fetched.set(id, row);
  }
  if (fetched.size !== positions.length) throw new PipelineError(`Round-trip fetched ${fetched.size}/${positions.length} total sample vectors.`);

  let maxDelta = 0;
  for (const position of positions) {
    const record = local.records[position];
    const remote = fetched.get(record.document_id);
    if (!remote) throw new PipelineError(`Round-trip missing sample ${record.document_id}.`);
    if (!Array.isArray(remote.values) || remote.values.length !== DIMENSIONS) {
      throw new PipelineError(`Round-trip vector ${record.document_id} has invalid values shape.`);
    }
    const localVector = vectorAt(local.matrixBuffer, local.matrixHeader, position);
    for (let i = 0; i < DIMENSIONS; i += 1) {
      const delta = Math.abs(localVector[i] - Number(remote.values[i]));
      if (!Number.isFinite(delta)) throw new PipelineError(`Round-trip vector ${record.document_id} contains invalid numeric data.`);
      maxDelta = Math.max(maxDelta, delta);
    }
    const expectedMetadata = compactMetadata(record);
    for (const [key, value] of Object.entries(expectedMetadata)) {
      if (stableStringify(remote.metadata?.[key]) !== stableStringify(value)) {
        throw new PipelineError(`Metadata mismatch for ${record.document_id}.${key}.`);
      }
    }
  }
  if (maxDelta > MAX_VECTOR_ABS_DELTA) {
    throw new PipelineError(`Stored-vector sample fidelity failed; max absolute delta ${maxDelta} > ${MAX_VECTOR_ABS_DELTA}.`);
  }
  return { sample_count: positions.length, maximum_vector_absolute_delta: maxDelta };
}

async function atomicWrite(path, content) {
  await fs.mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await fs.writeFile(tmp, content, "utf8");
  renameSync(tmp, path);
}

async function writePublicationArtifacts({ local, accountSource, authSource, indexState, beforeInfo, finalInfo, mutationIds, idSetValidation, roundTrip }) {
  const manifest = {
    schema_version: PUBLICATION_SCHEMA_VERSION,
    pipeline_stage: 5,
    backend_family: "cloudflare-vectorize",
    backend_generation: "v1",
    generated_at_utc: utcNow(),
    script: SCRIPT_NAME,
    source: {
      embedding_directory: rel(EMBEDDING_DIR),
      embedding_manifest: rel(EMBEDDING_MANIFEST_PATH),
      embeddings_npy_sha256: local.matrixSha,
      embedding_records_sha256: local.recordsSha,
      document_count: EXPECTED_COUNT,
      repository_count: EXPECTED_REPOSITORIES,
      provider_artifact_generation: PROVIDER_ARTIFACT_GENERATION,
      embedding_provider: PROVIDER,
      embedding_model: MODEL,
      dimensions: DIMENSIONS,
      dtype: DTYPE,
      similarity: METRIC,
    },
    vectorize: {
      index_name: INDEX_NAME,
      description: INDEX_DESCRIPTION,
      index_created_by_this_run: indexState.created,
      dimensions: DIMENSIONS,
      metric: METRIC,
      namespace: null,
      vector_id_contract: "document_id",
      execution_mode: mutationIds.length ? "publish-upsert" : "verify-only",
      upsert_batch_size: UPSERT_BATCH_SIZE,
      get_by_ids_max_per_request: GET_BY_IDS_MAX,
      mutation_ids: mutationIds,
      vector_count_before: Number(beforeInfo.vectorCount ?? beforeInfo.vector_count ?? 0),
      vector_count_after: Number(finalInfo.vectorCount ?? finalInfo.vector_count ?? 0),
      processed_up_to_mutation: finalInfo.processedUpToMutation ?? finalInfo.processed_up_to_mutation ?? null,
      exact_remote_id_count: idSetValidation.exactCount,
      id_set_validation_method: idSetValidation.method,
      list_vectors_observed_count: idSetValidation.listObservedCount,
      list_vectors_pages_observed: idSetValidation.listPages,
      list_vectors_reported_total: idSetValidation.listReportedTotal,
      list_vectors_fallback_used: idSetValidation.listFallbackUsed,
    },
    authentication: {
      account_resolution: accountSource,
      credential_resolution: authSource,
      secret_persisted_to_artifacts: false,
    },
    validation: {
      index_identity: "PASS",
      exact_remote_id_set: "PASS",
      vector_count: "PASS",
      mutation_visibility: mutationIds.length ? "PASS" : "NOT_APPLICABLE_VERIFY_ONLY",
      stored_vector_round_trip: "PASS",
      metadata_round_trip: "PASS",
      round_trip_sample_count: roundTrip.sample_count,
      maximum_vector_absolute_delta: roundTrip.maximum_vector_absolute_delta,
    },
    runtime_binding_candidate: {
      binding: "RAG_VECTOR_INDEX",
      index_name: INDEX_NAME,
      note: "Do not add the Worker binding until the production runtime integration stage.",
    },
    next_stage: "rag/scripts/06-validation/cloudflare-vectorize/validate-vectorize-dense-parity-v1.mjs",
  };

  const report = [
    "Portfolio GitHub RAG pipeline — Stage 05 / Cloudflare Vectorize publication v1",
    "",
    "STATUS: PASS",
    "",
    "SOURCE",
    `  Embedding generation: ${PROVIDER_ARTIFACT_GENERATION}`,
    `  Model: ${MODEL}`,
    `  Documents/vectors: ${EXPECTED_COUNT}`,
    `  Repositories: ${EXPECTED_REPOSITORIES}/${EXPECTED_REPOSITORIES}`,
    `  Dimensions: ${DIMENSIONS}`,
    `  Matrix SHA-256: ${local.matrixSha}`,
    `  Records SHA-256: ${local.recordsSha}`,
    "",
    "VECTORIZE TARGET",
    `  Index: ${INDEX_NAME}`,
    `  Created by this run: ${indexState.created ? "YES" : "NO (existing compatible index reused)"}`,
    `  Metric: ${METRIC}`,
    `  Namespace: NONE (index generation itself versions the corpus)` ,
    `  Execution mode: ${mutationIds.length ? "publish-upsert" : "verify-only"}`,
    `  Upsert batches: ${mutationIds.length}`,
    `  get_by_ids batch limit used: ${GET_BY_IDS_MAX}`,
    `  Upsert batch size: ${UPSERT_BATCH_SIZE}`,
    `  Final processed mutation: ${finalInfo.processedUpToMutation ?? finalInfo.processed_up_to_mutation ?? "unknown"}`,
    "",
    "VALIDATION",
    `  Remote vector count: ${Number(finalInfo.vectorCount ?? finalInfo.vector_count ?? -1)}/${EXPECTED_COUNT} — PASS`,
    `  Exact remote ID set: ${idSetValidation.exactCount}/${EXPECTED_COUNT} — PASS`,
    `  ID-set proof: ${idSetValidation.method}`,
    `  list-vectors observed: ${idSetValidation.listObservedCount}/${EXPECTED_COUNT}${idSetValidation.listFallbackUsed ? " (incomplete snapshot; exhaustive get_by_ids fallback used)" : ""}`,
    `  Round-trip stored-vector samples: ${roundTrip.sample_count} — PASS`,
    `  Max stored-vector absolute delta: ${roundTrip.maximum_vector_absolute_delta}`,
    "  Compact metadata round-trip: PASS",
    "  Existing Nomic/Pinecone path modified: NO",
    "  Cloudflare credential persisted: NO",
    "",
    "NEXT STAGE",
    "  node rag/scripts/06-validation/cloudflare-vectorize/validate-vectorize-dense-parity-v1.mjs",
    "",
  ].join("\n");

  await atomicWrite(PUBLICATION_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  await atomicWrite(PUBLICATION_REPORT_PATH, report);

  const reread = loadJson(PUBLICATION_MANIFEST_PATH);
  if (reread.vectorize?.index_name !== INDEX_NAME || reread.validation?.exact_remote_id_set !== "PASS") {
    throw new PipelineError("Published Stage 05 manifest failed re-read validation.");
  }
  return manifest;
}

function printHeader(verifyOnly) {
  console.log("Portfolio GitHub RAG pipeline — Stage 05 / Cloudflare Vectorize publication v1");
  console.log(`RAG root: ${RAG_ROOT}`);
  console.log();
  console.log("TARGET");
  console.log(`  ${INDEX_NAME}`);
  console.log(`  ${DIMENSIONS} dimensions | ${METRIC}`);
  console.log(`  ${EXPECTED_COUNT} vectors | exact document_id mapping`);
  console.log();
  console.log("SAFETY");
  console.log(`  Mode: ${verifyOnly ? "VERIFY ONLY (no upsert)" : "PUBLISH/UPSERT"}`);
  console.log("  Upsert is rerunnable; no remote delete/recreate is performed.");
  console.log("  Existing Nomic/Pinecone artifacts remain untouched.");
  console.log();
}

async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.length === 1 && args[0] === "--verify-only";
  if (args.length > 0 && !verifyOnly) {
    throw new PipelineError("Supported usage: no arguments for publication, or --verify-only to validate an already-published index without another upsert.");
  }
  printHeader(verifyOnly);

  console.log("[1/9] Locate and validate Stage 03 Cloudflare embedding artifacts ...");
  const local = await validateLocalInputs();
  console.log(`      SUCCESS (${EXPECTED_COUNT} x ${DIMENSIONS}; max norm error ${local.matrixHeader.maxNormError})`);

  console.log("[2/9] Resolve Cloudflare account and existing Wrangler authentication ...");
  const account = resolveCloudflareAccountId();
  const auth = resolveCloudflareAuth();
  console.log(`      SUCCESS (account via ${account.source}; credential via ${auth.source})`);

  console.log("[3/9] Create or validate the dedicated Vectorize v1 index ...");
  const indexState = await ensureIndex(account.accountId, auth.headers, { allowCreate: !verifyOnly });
  console.log(`      SUCCESS (${indexState.created ? "created" : "existing compatible index"}; ${DIMENSIONS}D ${METRIC})`);

  console.log("[4/9] Read pre-publication Vectorize index state ...");
  const beforeInfo = await getIndexInfo(account.accountId, auth.headers);
  console.log(`      SUCCESS (existing vectors: ${Number(beforeInfo.vectorCount ?? beforeInfo.vector_count ?? 0)})`);

  let mutationIds = [];
  let finalInfo;
  if (verifyOnly) {
    console.log("[5/9] Skip upsert because --verify-only was requested ...");
    console.log("      SUCCESS (no Vectorize mutation performed)");
    console.log("[6/9] Verify the existing index is fully query-visible ...");
    finalInfo = await getIndexInfo(account.accountId, auth.headers);
    const visibleCount = Number(finalInfo.vectorCount ?? finalInfo.vector_count ?? -1);
    if (visibleCount !== EXPECTED_COUNT) {
      throw new PipelineError(`--verify-only requires ${EXPECTED_COUNT} visible vectors; Vectorize reports ${visibleCount}.`);
    }
    console.log(`      SUCCESS (${visibleCount}/${EXPECTED_COUNT} visible)`);
  } else {
    console.log(`[5/9] Upsert ${EXPECTED_COUNT} vectors with compact evidence metadata ...`);
    mutationIds = await upsertCorpus(account.accountId, auth.headers, local);
    console.log(`      SUCCESS (${mutationIds.length} mutation batches accepted)`);

    console.log("[6/9] Wait for the final Vectorize mutation to become query-visible ...");
    finalInfo = await waitForMutationVisibility(account.accountId, auth.headers, mutationIds.at(-1));
    process.stdout.write("\r");
    console.log(`      SUCCESS (${Number(finalInfo.vectorCount ?? finalInfo.vector_count ?? 0)}/${EXPECTED_COUNT} visible; final mutation processed)`);
  }

  console.log("[7/9] Prove the complete remote vector-ID set ...");
  const idSetValidation = await verifyExactRemoteIdSet(account.accountId, auth.headers, local, finalInfo);
  if (idSetValidation.listFallbackUsed) {
    console.log(`      NOTE (list-vectors observed ${idSetValidation.listObservedCount}/${EXPECTED_COUNT}; using exhaustive get_by_ids proof)`);
  }
  console.log(`      SUCCESS (${idSetValidation.exactCount}/${EXPECTED_COUNT}; exact ID set via ${idSetValidation.method})`);

  console.log(`[8/9] Fetch ${ROUND_TRIP_SAMPLE_COUNT} stratified vectors and validate storage + metadata fidelity ...`);
  const roundTrip = await validateRoundTripSamples(account.accountId, auth.headers, local);
  console.log(`      SUCCESS (max vector delta ${roundTrip.maximum_vector_absolute_delta})`);

  console.log("[9/9] Write and re-read Stage 05 publication artifacts ...");
  await writePublicationArtifacts({
    local,
    accountSource: account.source,
    authSource: auth.source,
    indexState,
    beforeInfo,
    finalInfo,
    mutationIds,
    idSetValidation,
    roundTrip,
  });
  console.log("      SUCCESS");

  console.log();
  console.log("STAGE 05 CLOUDFLARE VECTORIZE PUBLICATION: SUCCESS");
  console.log(`Index:             ${INDEX_NAME}`);
  console.log(`Vectors:           ${EXPECTED_COUNT}`);
  console.log(`Dimensions:        ${DIMENSIONS}`);
  console.log(`Metric:            ${METRIC}`);
  console.log(`Execution mode:    ${mutationIds.length ? "publish-upsert" : "verify-only"}`);
  console.log(`Upsert mutations:  ${mutationIds.length}`);
  console.log(`ID-set validation: PASS`);
  console.log(`Storage fidelity:  PASS (${roundTrip.sample_count} samples)`);
  console.log();
  console.log("OUTPUT");
  console.log("  rag-corpus/vectorize-cloudflare-v1/vectorize-publication-manifest.json");
  console.log("  rag-corpus/vectorize-cloudflare-v1/vectorize-publication-validation-report.txt");
  console.log();
  console.log("NEXT STAGE");
  console.log("  node rag/scripts/06-validation/cloudflare-vectorize/validate-vectorize-dense-parity-v1.mjs");
}

main().catch((error) => {
  console.error();
  console.error("STAGE 05 CLOUDFLARE VECTORIZE PUBLICATION: FAILED");
  console.error(`Reason: ${error?.message || error}`);
  process.exitCode = 1;
});
