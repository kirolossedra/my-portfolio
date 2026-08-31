#!/usr/bin/env node
/**
 * Portfolio GitHub RAG pipeline — Stage 03 / Embedding generation v4.
 *
 * Cloudflare-native embedding candidate over the finalized Stage 02 evidence
 * documents. This is a one-time/offline build utility; production request-time
 * retrieval will later use a Cloudflare Worker + Workers AI + Vectorize.
 *
 * ZERO-ARGUMENT USAGE
 * -------------------
 * Run from any working directory:
 *
 *   node rag/scripts/03-embeddings/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs
 *
 * Authentication is resolved from the existing Wrangler login when possible:
 *   - account: CLOUDFLARE_ACCOUNT_ID, otherwise `npx wrangler whoami --json`
 *   - auth:    Cloudflare env credentials, otherwise `npx wrangler auth token --json`
 *
 * No secret is persisted into the generated corpus artifacts.
 *
 * INPUT
 * -----
 *   rag/rag-corpus/retrieval-documents-v2/documents.jsonl
 *
 * OUTPUT (parallel to the validated Nomic artifacts)
 * -------------------------------------------------
 *   rag/rag-corpus/embeddings-cloudflare-v1/embeddings.npy
 *   rag/rag-corpus/embeddings-cloudflare-v1/embedding-records.jsonl
 *   rag/rag-corpus/embeddings-cloudflare-v1/embedding-manifest.json
 *   rag/rag-corpus/embeddings-cloudflare-v1/embedding-validation-report.txt
 *
 * RESUMABLE CHECKPOINTS
 * ---------------------
 *   rag/rag-corpus/.embedding-cloudflare-v1-checkpoint/
 *
 * MODEL CONTRACT
 * --------------
 * Provider:                Cloudflare Workers AI
 * Model:                   @cf/qwen/qwen3-embedding-0.6b
 * Dimensions:              1024
 * Document input mode:     `documents`
 * Runtime query mode:      `queries`
 * Runtime query instruction:
 *   Given a web search query, retrieve relevant passages that answer the query
 * Post-processing:         explicit L2 normalization
 * Similarity:              cosine
 * Stored dtype:            float32
 *
 * The runtime query path MUST later use this exact model identifier, query
 * input mode/instruction, 1024 dimensions, and L2 normalization contract.
 */

import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { promises as fs } from "node:fs";
import { endianness } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_PATH);
const SCRIPT_NAME = SCRIPT_PATH.split(/[\\/]/).pop();

function findRagRoot(startDir) {
  let current = resolve(startDir);
  while (true) {
    const scripts = join(current, "scripts");
    const corpus = join(current, "rag-corpus");
    if (current.split(/[\\/]/).pop() === "rag" && existsSync(scripts) && existsSync(corpus)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Could not locate the enclosing rag/ root. Expected this script under rag/scripts/.");
}

const RAG_ROOT = findRagRoot(SCRIPT_DIR);
const PORTFOLIO_ROOT = dirname(RAG_ROOT);
const RAG_CORPUS_DIR = join(RAG_ROOT, "rag-corpus");
const INPUT_PATH = join(RAG_CORPUS_DIR, "retrieval-documents-v2", "documents.jsonl");
const OUTPUT_DIR = join(RAG_CORPUS_DIR, "embeddings-cloudflare-v1");
const TEMP_OUTPUT_DIR = join(RAG_CORPUS_DIR, ".embeddings-cloudflare-v1.tmp");
const CHECKPOINT_DIR = join(RAG_CORPUS_DIR, ".embedding-cloudflare-v1-checkpoint");

const EMBEDDING_SCHEMA_VERSION = "4.0.0";
const EMBEDDING_GENERATION = "v4";
const PROVIDER_ARTIFACT_GENERATION = "cloudflare-v1";
const EXPECTED_DOCUMENT_SCHEMA_MAJOR = "2";
const EXPECTED_DOCUMENT_COUNT = 2808;
const EXPECTED_REPOSITORY_TOTAL = 134;

const PROVIDER = "cloudflare-workers-ai";
const MODEL = "@cf/qwen/qwen3-embedding-0.6b";
const MODEL_CONTEXT_WINDOW_TOKENS = 8192;
const EMBEDDING_DIMENSIONS = 1024;
const DOCUMENT_INPUT_MODE = "documents";
const QUERY_INPUT_MODE = "queries";
const QUERY_INSTRUCTION = "Given a web search query, retrieve relevant passages that answer the query";
const DTYPE = "float32";
const SIMILARITY = "cosine";
const POSTPROCESS = "L2 normalize";

// Normal REST requests can accept an array of strings. Keep each request small
// enough for predictable retries/checkpointing while avoiding thousands of API
// calls. Changing this value changes checkpoint identity, not vector semantics.
const LOGICAL_BATCH_SIZE = 16;
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 120_000;
const UNIT_NORM_TOLERANCE = 1e-5;

// Workers AI's embedding response does not expose per-input tokenizer counts.
// Do not add a second local Qwen model/tokenizer just for counting: that would
// recreate the local-model dependency this migration is removing. We submit the
// COMPLETE embedding_text with no client-side truncation and use a generous byte
// sanity guard only to catch accidental giant/corrupt records before API calls.
// This guard is not presented as an exact Qwen token count.
const INPUT_UTF8_BYTES_SANITY_LIMIT = 32 * 1024;

class PipelineError extends Error {}

function utcNow() {
  return new Date().toISOString();
}

function rel(path) {
  const value = relative(RAG_ROOT, path);
  return value && !value.startsWith("..") ? value : path;
}

function sha256Text(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function sha256File(path) {
  const data = await fs.readFile(path);
  return createHash("sha256").update(data).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function writeJson(path, value) {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeJsonl(path, rows) {
  await fs.mkdir(dirname(path), { recursive: true });
  const stream = createWriteStream(path, { encoding: "utf8", flags: "w" });
  let count = 0;
  for (const row of rows) {
    if (!stream.write(`${JSON.stringify(row)}\n`)) {
      await new Promise((resolveDrain) => stream.once("drain", resolveDrain));
    }
    count += 1;
  }
  await new Promise((resolveEnd, rejectEnd) => {
    stream.once("error", rejectEnd);
    stream.end(resolveEnd);
  });
  return count;
}

function loadJsonlSync(path) {
  const text = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  const rows = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let row;
    try {
      row = JSON.parse(line);
    } catch (error) {
      throw new PipelineError(`Invalid JSON at ${rel(path)} line ${index + 1}: ${error.message}`);
    }
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new PipelineError(`Expected JSON object at ${rel(path)} line ${index + 1}.`);
    }
    rows.push(row);
  }
  if (rows.length === 0) throw new PipelineError(`Input is empty: ${rel(path)}`);
  return rows;
}

function countWords(text) {
  return (String(text).match(/\S+/g) || []).length;
}

function median(values) {
  const copy = [...values].sort((a, b) => a - b);
  if (copy.length === 0) return 0;
  return copy[Math.floor(copy.length / 2)];
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
        // fall through
      }
    }
  }
  throw new PipelineError("Wrangler returned output that could not be parsed as JSON.");
}

function runWranglerJson(args) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(executable, ["wrangler", ...args], {
    cwd: PORTFOLIO_ROOT,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
    env: process.env,
  });
  if (result.error) {
    throw new PipelineError(`Could not execute Wrangler: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim().split(/\r?\n/).slice(-3).join(" | ");
    throw new PipelineError(`Wrangler command failed${stderr ? `: ${stderr}` : "."}`);
  }
  return parseJsonFromCommand(result.stdout);
}

function resolveCloudflareAccountId() {
  const envId = String(process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  if (envId) return { accountId: envId, source: "CLOUDFLARE_ACCOUNT_ID" };

  const whoami = runWranglerJson(["whoami", "--json"]);
  if (whoami.loggedIn === false) {
    throw new PipelineError("Wrangler is not authenticated. Run `npx wrangler login` first.");
  }
  const accounts = Array.isArray(whoami.accounts) ? whoami.accounts : [];
  const valid = accounts.filter((account) => account && typeof account.id === "string" && account.id.trim());
  if (valid.length === 1) {
    return { accountId: valid[0].id.trim(), source: "wrangler whoami" };
  }
  if (valid.length === 0) {
    throw new PipelineError("Wrangler authentication is valid, but no Cloudflare account ID was returned.");
  }
  const options = valid.map((account) => `${account.name || "unnamed"} (${account.id})`).join(", ");
  throw new PipelineError(
    `Wrangler returned multiple Cloudflare accounts. Set CLOUDFLARE_ACCOUNT_ID for this run. Accounts: ${options}`,
  );
}

function resolveCloudflareAuth() {
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN || "").trim();
  if (apiToken) {
    return { headers: { Authorization: `Bearer ${apiToken}` }, source: "environment bearer token", type: "bearer" };
  }

  const envKey = String(process.env.CLOUDFLARE_API_KEY || "").trim();
  const envEmail = String(process.env.CLOUDFLARE_EMAIL || "").trim();
  if (envKey && envEmail) {
    return {
      headers: { "X-Auth-Key": envKey, "X-Auth-Email": envEmail },
      source: "environment API key/email",
      type: "api_key",
    };
  }

  const auth = runWranglerJson(["auth", "token", "--json"]);
  if ((auth.type === "api_token" || auth.type === "oauth") && typeof auth.token === "string" && auth.token.trim()) {
    return {
      headers: { Authorization: `Bearer ${auth.token.trim()}` },
      source: `wrangler ${auth.type}`,
      type: auth.type,
    };
  }
  if (auth.type === "api_key" && auth.key && auth.email) {
    return {
      headers: { "X-Auth-Key": String(auth.key), "X-Auth-Email": String(auth.email) },
      source: "wrangler api_key",
      type: "api_key",
    };
  }
  throw new PipelineError("Wrangler did not return a usable Cloudflare authentication credential.");
}

function validateDocuments(documents) {
  if (documents.length !== EXPECTED_DOCUMENT_COUNT) {
    throw new PipelineError(`Expected ${EXPECTED_DOCUMENT_COUNT} retrieval documents; found ${documents.length}.`);
  }

  const ids = new Set();
  const repositories = new Set();
  const wordCounts = [];
  const byteCounts = [];
  const oversized = [];

  documents.forEach((document, index) => {
    const schema = String(document.document_schema_version || "");
    if (schema.split(".", 1)[0] !== EXPECTED_DOCUMENT_SCHEMA_MAJOR) {
      throw new PipelineError(`Document row ${index} has unsupported schema ${JSON.stringify(schema)}.`);
    }
    const id = String(document.document_id || "").trim();
    if (!id) throw new PipelineError(`Document row ${index} is missing document_id.`);
    if (ids.has(id)) throw new PipelineError(`Duplicate document_id: ${id}`);
    ids.add(id);

    const text = String(document.embedding_text || "");
    if (!text.trim()) throw new PipelineError(`Document ${id} has empty embedding_text.`);
    const expectedHash = document.provenance?.embedding_text_sha256;
    if (expectedHash && sha256Text(text) !== expectedHash) {
      throw new PipelineError(`Document ${id} embedding_text SHA-256 does not match Stage 02 provenance.`);
    }
    const declaredWords = Number(document.embedding_word_count);
    const actualWords = countWords(text);
    if (Number.isFinite(declaredWords) && declaredWords !== actualWords) {
      throw new PipelineError(`Document ${id} embedding_word_count mismatch: ${declaredWords} != ${actualWords}.`);
    }

    const bytes = Buffer.byteLength(text, "utf8");
    wordCounts.push(actualWords);
    byteCounts.push(bytes);
    if (bytes > INPUT_UTF8_BYTES_SANITY_LIMIT) {
      oversized.push({ document_id: id, utf8_bytes: bytes, words: actualWords });
    }

    const repo = Number(document.repository_index);
    if (!Number.isInteger(repo) || repo < 1 || repo > EXPECTED_REPOSITORY_TOTAL) {
      throw new PipelineError(`Document ${id} has invalid repository_index ${document.repository_index}.`);
    }
    repositories.add(repo);
    if (Number(document.repository_total) !== EXPECTED_REPOSITORY_TOTAL) {
      throw new PipelineError(`Document ${id} repository_total is not ${EXPECTED_REPOSITORY_TOTAL}.`);
    }
  });

  if (repositories.size !== EXPECTED_REPOSITORY_TOTAL) {
    throw new PipelineError(`Repository coverage is ${repositories.size}/${EXPECTED_REPOSITORY_TOTAL}.`);
  }
  if (oversized.length) {
    const sample = oversized.slice(0, 8).map((row) => `${row.document_id}=${row.utf8_bytes}B`).join(", ");
    throw new PipelineError(
      `${oversized.length} embedding inputs exceed the ${INPUT_UTF8_BYTES_SANITY_LIMIT}-byte input sanity guard. ` +
      `Inspect the Stage 02 corpus before embedding. Sample: ${sample}`,
    );
  }

  return {
    document_count: documents.length,
    repository_count: repositories.size,
    repository_total: EXPECTED_REPOSITORY_TOTAL,
    embedding_words_min: Math.min(...wordCounts),
    embedding_words_median: median(wordCounts),
    embedding_words_max: Math.max(...wordCounts),
    embedding_utf8_bytes_min: Math.min(...byteCounts),
    embedding_utf8_bytes_median: median(byteCounts),
    embedding_utf8_bytes_max: Math.max(...byteCounts),
    input_utf8_bytes_sanity_limit: INPUT_UTF8_BYTES_SANITY_LIMIT,
    client_side_truncation: false,
  };
}

function l2Normalize(vector) {
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new PipelineError(`Unexpected embedding dimension ${Array.isArray(vector) ? vector.length : "non-array"}; expected ${EMBEDDING_DIMENSIONS}.`);
  }
  let sum = 0;
  const normalized = new Array(vector.length);
  for (let i = 0; i < vector.length; i += 1) {
    const value = Number(vector[i]);
    if (!Number.isFinite(value)) throw new PipelineError(`Embedding contains NaN/Inf/non-number at dimension ${i}.`);
    sum += value * value;
    normalized[i] = value;
  }
  const norm = Math.sqrt(sum);
  if (!Number.isFinite(norm) || norm <= 0) throw new PipelineError("Embedding has an invalid or zero L2 norm.");
  for (let i = 0; i < normalized.length; i += 1) normalized[i] /= norm;
  return { vector: normalized, rawNorm: norm };
}

function extractVectors(apiPayload, expectedCount) {
  if (!apiPayload || typeof apiPayload !== "object") throw new PipelineError("Cloudflare returned a non-object response.");
  if (apiPayload.success === false) {
    const messages = [...(apiPayload.errors || []), ...(apiPayload.messages || [])]
      .map((item) => (typeof item === "string" ? item : item?.message || JSON.stringify(item)))
      .join(" | ");
    throw new PipelineError(`Cloudflare API reported failure${messages ? `: ${messages}` : "."}`);
  }
  const result = apiPayload.result ?? apiPayload;
  const data = result?.data;
  const shape = result?.shape;
  if (!Array.isArray(data)) throw new PipelineError("Cloudflare embedding response is missing result.data.");

  let vectors;
  if (data.length === expectedCount && data.every(Array.isArray)) {
    vectors = data;
  } else if (expectedCount === 1 && data.length === EMBEDDING_DIMENSIONS && data.every((value) => typeof value === "number")) {
    vectors = [data];
  } else {
    throw new PipelineError(`Cloudflare returned ${data.length} embedding rows; expected ${expectedCount}.`);
  }

  if (Array.isArray(shape) && shape.length >= 2) {
    const rows = Number(shape[0]);
    const cols = Number(shape[shape.length - 1]);
    if (rows !== expectedCount || cols !== EMBEDDING_DIMENSIONS) {
      throw new PipelineError(`Cloudflare response shape ${JSON.stringify(shape)} does not match [${expectedCount}, ${EMBEDDING_DIMENSIONS}].`);
    }
  }

  const normalized = [];
  const rawNorms = [];
  for (const vector of vectors) {
    const item = l2Normalize(vector);
    normalized.push(item.vector);
    rawNorms.push(item.rawNorm);
  }
  return { vectors: normalized, rawNorms, shape: Array.isArray(shape) ? shape : [expectedCount, EMBEDDING_DIMENSIONS] };
}

function isQuotaError(status, bodyText) {
  const low = String(bodyText || "").toLowerCase();
  return status === 402 || low.includes("neuron") || low.includes("quota") || low.includes("daily limit") || low.includes("usage limit");
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function runCloudflareEmbedding({ accountId, authHeaders, payload, expectedCount, requestLabel, counters }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    let bodyText = "";
    try {
      counters.http_attempts += 1;
      response = await fetch(url, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      bodyText = await response.text();
    } catch (error) {
      clearTimeout(timer);
      if (attempt >= MAX_RETRIES) {
        throw new PipelineError(`${requestLabel}: network request failed after ${attempt} attempt(s): ${error.message}`);
      }
      const waitMs = Math.min(30_000, 1000 * 2 ** (attempt - 1));
      console.log(`      ${requestLabel}: transient network failure; retry ${attempt}/${MAX_RETRIES} after ${waitMs / 1000}s`);
      await sleep(waitMs);
      continue;
    }
    clearTimeout(timer);

    let parsed = null;
    try {
      parsed = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      // handled below with sanitized body excerpt
    }

    if (response.ok && parsed) {
      counters.successful_api_requests += 1;
      return extractVectors(parsed, expectedCount);
    }

    const summary = parsed?.errors?.map((item) => item?.message || String(item)).join(" | ")
      || parsed?.messages?.map((item) => item?.message || String(item)).join(" | ")
      || bodyText.slice(0, 500).replace(/\s+/g, " ");

    if (isQuotaError(response.status, summary)) {
      throw new PipelineError(
        `${requestLabel}: Cloudflare free usage/quota limit appears exhausted (HTTP ${response.status}). ` +
        `Checkpoint files are preserved; rerun after the quota resets. ${summary}`,
      );
    }

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= MAX_RETRIES) {
      throw new PipelineError(`${requestLabel}: Cloudflare API failed with HTTP ${response.status}. ${summary}`);
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(30_000, retryAfter * 1000)
      : Math.min(30_000, 1000 * 2 ** (attempt - 1));
    console.log(`      ${requestLabel}: HTTP ${response.status}; retry ${attempt}/${MAX_RETRIES} after ${waitMs / 1000}s`);
    await sleep(waitMs);
  }
  throw new PipelineError(`${requestLabel}: unexpected retry loop termination.`);
}

function checkpointIdentity(inputSha256, documents) {
  return {
    checkpoint_schema_version: "1.0.0",
    input_sha256: inputSha256,
    document_count: documents.length,
    document_ids_sha256: sha256Text(documents.map((document) => document.document_id).join("\n")),
    embedding_schema_version: EMBEDDING_SCHEMA_VERSION,
    embedding_generation: EMBEDDING_GENERATION,
    provider_artifact_generation: PROVIDER_ARTIFACT_GENERATION,
    provider: PROVIDER,
    model: MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    document_input_mode: DOCUMENT_INPUT_MODE,
    query_input_mode: QUERY_INPUT_MODE,
    query_instruction: QUERY_INSTRUCTION,
    postprocess: POSTPROCESS,
    logical_batch_size: LOGICAL_BATCH_SIZE,
  };
}

async function prepareCheckpoint(identity) {
  const identityPath = join(CHECKPOINT_DIR, "identity.json");
  if (!existsSync(CHECKPOINT_DIR)) {
    await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
    await writeJson(identityPath, identity);
    return;
  }
  if (!existsSync(identityPath)) {
    throw new PipelineError(`Checkpoint directory exists without identity.json: ${rel(CHECKPOINT_DIR)}`);
  }
  const existing = JSON.parse(await fs.readFile(identityPath, "utf8"));
  if (stableStringify(existing) !== stableStringify(identity)) {
    throw new PipelineError(
      `Existing checkpoint identity does not match this embedding build. ` +
      `Do not mix vector spaces; inspect/remove ${rel(CHECKPOINT_DIR)} before rebuilding.`,
    );
  }
}

function batchCheckpointPath(start, endExclusive) {
  return join(CHECKPOINT_DIR, `batch-${String(start).padStart(4, "0")}-${String(endExclusive - 1).padStart(4, "0")}.json`);
}

function validateCheckpointBatch(payload, documents, start, endExclusive) {
  const expectedIds = documents.slice(start, endExclusive).map((document) => document.document_id);
  if (!payload || payload.start !== start || payload.end_exclusive !== endExclusive) {
    throw new PipelineError(`Checkpoint range mismatch for batch ${start}-${endExclusive - 1}.`);
  }
  if (stableStringify(payload.document_ids) !== stableStringify(expectedIds)) {
    throw new PipelineError(`Checkpoint document IDs mismatch for batch ${start}-${endExclusive - 1}.`);
  }
  if (!Array.isArray(payload.vectors) || payload.vectors.length !== expectedIds.length) {
    throw new PipelineError(`Checkpoint vector count mismatch for batch ${start}-${endExclusive - 1}.`);
  }
  for (const vector of payload.vectors) {
    const { vector: normalizedAgain } = l2Normalize(vector);
    let delta = 0;
    for (let i = 0; i < vector.length; i += 1) delta = Math.max(delta, Math.abs(Number(vector[i]) - normalizedAgain[i]));
    if (delta > UNIT_NORM_TOLERANCE) {
      throw new PipelineError(`Checkpoint contains a non-unit vector in batch ${start}-${endExclusive - 1}.`);
    }
  }
  return payload;
}

async function saveCheckpointBatch(path, payload) {
  const tmp = `${path}.tmp`;
  await writeJson(tmp, payload);
  renameSync(tmp, path);
}

async function runSmokeTests(accountId, auth, counters) {
  const documentSmoke = await runCloudflareEmbedding({
    accountId,
    authHeaders: auth.headers,
    payload: { documents: ["Portfolio RAG Cloudflare document embedding smoke test."] },
    expectedCount: 1,
    requestLabel: "document-mode smoke test",
    counters,
  });
  const querySmoke = await runCloudflareEmbedding({
    accountId,
    authHeaders: auth.headers,
    payload: { queries: ["authorization architecture evidence"], instruction: QUERY_INSTRUCTION },
    expectedCount: 1,
    requestLabel: "query-mode smoke test",
    counters,
  });
  return {
    document_mode: "PASS",
    query_mode: "PASS",
    document_shape: documentSmoke.shape,
    query_shape: querySmoke.shape,
  };
}

async function embedWithCheckpoints(documents, accountId, auth, counters) {
  const totalBatches = Math.ceil(documents.length / LOGICAL_BATCH_SIZE);
  let newBatches = 0;
  let resumedBatches = 0;
  let rawNormMin = Number.POSITIVE_INFINITY;
  let rawNormMax = 0;

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const start = batchIndex * LOGICAL_BATCH_SIZE;
    const end = Math.min(documents.length, start + LOGICAL_BATCH_SIZE);
    const checkpointPath = batchCheckpointPath(start, end);
    const label = `batch ${String(batchIndex + 1).padStart(3, "0")}/${String(totalBatches).padStart(3, "0")} [${start}-${end - 1}]`;

    if (existsSync(checkpointPath)) {
      const payload = JSON.parse(await fs.readFile(checkpointPath, "utf8"));
      validateCheckpointBatch(payload, documents, start, end);
      for (const norm of payload.raw_norms || []) {
        if (Number.isFinite(norm)) {
          rawNormMin = Math.min(rawNormMin, norm);
          rawNormMax = Math.max(rawNormMax, norm);
        }
      }
      resumedBatches += 1;
      console.log(`      ${label} ... RESUMED`);
      continue;
    }

    const texts = documents.slice(start, end).map((document) => String(document.embedding_text));
    const response = await runCloudflareEmbedding({
      accountId,
      authHeaders: auth.headers,
      payload: { documents: texts },
      expectedCount: texts.length,
      requestLabel: label,
      counters,
    });
    response.rawNorms.forEach((norm) => {
      rawNormMin = Math.min(rawNormMin, norm);
      rawNormMax = Math.max(rawNormMax, norm);
    });

    await saveCheckpointBatch(checkpointPath, {
      checkpoint_batch_schema_version: "1.0.0",
      created_at_utc: utcNow(),
      start,
      end_exclusive: end,
      document_ids: documents.slice(start, end).map((document) => document.document_id),
      response_shape: response.shape,
      raw_norms: response.rawNorms,
      vectors: response.vectors,
    });
    newBatches += 1;
    console.log(`      ${label} ... SUCCESS`);
  }

  return {
    logical_batch_count: totalBatches,
    new_logical_batches: newBatches,
    resumed_logical_batches: resumedBatches,
    raw_model_l2_norm_min: Number.isFinite(rawNormMin) ? rawNormMin : null,
    raw_model_l2_norm_max: rawNormMax || null,
  };
}

function npyHeader(rows, cols) {
  const dict = `{'descr': '<f4', 'fortran_order': False, 'shape': (${rows}, ${cols}), }`;
  const magicAndPrefixBytes = 10; // magic 6 + version 2 + header length 2
  const padding = (16 - ((magicAndPrefixBytes + Buffer.byteLength(dict, "ascii") + 1) % 16)) % 16;
  const headerText = `${dict}${" ".repeat(padding)}\n`;
  const headerBuffer = Buffer.from(headerText, "ascii");
  if (headerBuffer.length > 65535) throw new PipelineError("NPY header exceeds v1.0 limit.");
  const prefix = Buffer.alloc(magicAndPrefixBytes);
  prefix[0] = 0x93;
  prefix.write("NUMPY", 1, "ascii");
  prefix[6] = 1;
  prefix[7] = 0;
  prefix.writeUInt16LE(headerBuffer.length, 8);
  return Buffer.concat([prefix, headerBuffer]);
}

function vectorToFloat32Buffer(vector) {
  const array = Float32Array.from(vector);
  const buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  if (endianness() === "LE") return buffer;
  const copy = Buffer.from(buffer);
  copy.swap32();
  return copy;
}

async function writeNpyFromCheckpoints(path, documents) {
  const stream = createWriteStream(path, { flags: "w" });
  const header = npyHeader(documents.length, EMBEDDING_DIMENSIONS);
  stream.write(header);
  let rowCount = 0;

  for (let start = 0; start < documents.length; start += LOGICAL_BATCH_SIZE) {
    const end = Math.min(documents.length, start + LOGICAL_BATCH_SIZE);
    const checkpointPath = batchCheckpointPath(start, end);
    if (!existsSync(checkpointPath)) throw new PipelineError(`Missing checkpoint: ${rel(checkpointPath)}`);
    const payload = JSON.parse(await fs.readFile(checkpointPath, "utf8"));
    validateCheckpointBatch(payload, documents, start, end);
    for (const vector of payload.vectors) {
      if (!stream.write(vectorToFloat32Buffer(vector))) {
        await new Promise((resolveDrain) => stream.once("drain", resolveDrain));
      }
      rowCount += 1;
    }
  }

  await new Promise((resolveEnd, rejectEnd) => {
    stream.once("error", rejectEnd);
    stream.end(resolveEnd);
  });
  if (rowCount !== documents.length) throw new PipelineError(`NPY row count ${rowCount} != ${documents.length}.`);
  return { headerBytes: header.length, rowCount };
}

function readNpyHeader(buffer) {
  if (buffer.length < 10 || buffer[0] !== 0x93 || buffer.toString("ascii", 1, 6) !== "NUMPY") {
    throw new PipelineError("embeddings.npy has an invalid NPY magic header.");
  }
  if (buffer[6] !== 1 || buffer[7] !== 0) throw new PipelineError("embeddings.npy is not NPY v1.0.");
  const headerLength = buffer.readUInt16LE(8);
  const headerEnd = 10 + headerLength;
  if (buffer.length < headerEnd) throw new PipelineError("embeddings.npy header is truncated.");
  const text = buffer.toString("ascii", 10, headerEnd);
  const shapeMatch = text.match(/'shape':\s*\((\d+)\s*,\s*(\d+)\s*\)/);
  if (!shapeMatch || !text.includes("'descr': '<f4'") || !text.includes("'fortran_order': False")) {
    throw new PipelineError("embeddings.npy header contract is invalid.");
  }
  return { rows: Number(shapeMatch[1]), cols: Number(shapeMatch[2]), dataOffset: headerEnd };
}

async function validateNpy(path, expectedRows) {
  const buffer = await fs.readFile(path);
  const header = readNpyHeader(buffer);
  if (header.rows !== expectedRows || header.cols !== EMBEDDING_DIMENSIONS) {
    throw new PipelineError(`NPY shape (${header.rows}, ${header.cols}) != (${expectedRows}, ${EMBEDDING_DIMENSIONS}).`);
  }
  const expectedBytes = header.dataOffset + expectedRows * EMBEDDING_DIMENSIONS * 4;
  if (buffer.length !== expectedBytes) {
    throw new PipelineError(`NPY byte length ${buffer.length} != expected ${expectedBytes}.`);
  }

  const norms = [];
  let invalid = 0;
  let zero = 0;
  let offset = header.dataOffset;
  for (let row = 0; row < expectedRows; row += 1) {
    let sum = 0;
    for (let col = 0; col < EMBEDDING_DIMENSIONS; col += 1) {
      const value = buffer.readFloatLE(offset);
      offset += 4;
      if (!Number.isFinite(value)) invalid += 1;
      sum += value * value;
    }
    const norm = Math.sqrt(sum);
    if (norm <= 0) zero += 1;
    norms.push(norm);
  }
  if (invalid) throw new PipelineError(`NPY contains ${invalid} NaN/Inf values.`);
  if (zero) throw new PipelineError(`NPY contains ${zero} zero vectors.`);
  const maxError = Math.max(...norms.map((norm) => Math.abs(norm - 1)));
  if (maxError > 2e-5) {
    throw new PipelineError(`NPY vectors are not L2-normalized; max norm error ${maxError}.`);
  }
  return {
    matrix_shape: [expectedRows, EMBEDDING_DIMENSIONS],
    dtype: DTYPE,
    vector_count: expectedRows,
    dimension: EMBEDDING_DIMENSIONS,
    invalid_vector_count: 0,
    zero_vector_count: 0,
    l2_norm_min: Math.min(...norms),
    l2_norm_median: median(norms),
    l2_norm_max: Math.max(...norms),
    l2_norm_max_error_from_one: maxError,
  };
}

function buildEmbeddingRecords(documents) {
  return documents.map((document, vectorIndex) => {
    const text = String(document.embedding_text);
    return {
      ...document,
      embedding_schema_version: EMBEDDING_SCHEMA_VERSION,
      embedding_generation: EMBEDDING_GENERATION,
      provider_artifact_generation: PROVIDER_ARTIFACT_GENERATION,
      vector_index: vectorIndex,
      embedding_provider: PROVIDER,
      embedding_model: MODEL,
      embedding_dimensions: EMBEDDING_DIMENSIONS,
      embedding_dtype: DTYPE,
      embedding_similarity: SIMILARITY,
      embedding_postprocess: POSTPROCESS,
      embedding_document_input_mode: DOCUMENT_INPUT_MODE,
      embedding_query_input_mode: QUERY_INPUT_MODE,
      embedding_query_instruction: QUERY_INSTRUCTION,
      embedding_context_window_tokens: MODEL_CONTEXT_WINDOW_TOKENS,
      embedding_text_sha256: sha256Text(text),
      model_input_sha256: sha256Text(text),
    };
  });
}

function validateRecords(records, documents) {
  if (records.length !== documents.length) throw new PipelineError("Embedding record count mismatch.");
  const ids = new Set();
  const repositories = new Set();
  records.forEach((record, index) => {
    const document = documents[index];
    if (record.vector_index !== index) throw new PipelineError(`vector_index mismatch at row ${index}.`);
    if (record.document_id !== document.document_id) throw new PipelineError(`document_id mapping mismatch at row ${index}.`);
    if (ids.has(record.document_id)) throw new PipelineError(`Duplicate embedding record ID ${record.document_id}.`);
    ids.add(record.document_id);
    repositories.add(Number(record.repository_index));
    if (record.text !== document.text) throw new PipelineError(`Authoritative text changed for ${record.document_id}.`);
    if (record.embedding_text !== document.embedding_text) throw new PipelineError(`embedding_text changed for ${record.document_id}.`);
    if (stableStringify(record.source_fragments) !== stableStringify(document.source_fragments)) {
      throw new PipelineError(`source_fragments changed for ${record.document_id}.`);
    }
    if (record.embedding_text_sha256 !== sha256Text(document.embedding_text)) {
      throw new PipelineError(`embedding_text hash mismatch for ${record.document_id}.`);
    }
  });
  if (repositories.size !== EXPECTED_REPOSITORY_TOTAL) {
    throw new PipelineError(`Embedding records cover ${repositories.size}/${EXPECTED_REPOSITORY_TOTAL} repositories.`);
  }
  return { duplicate_document_ids: 0, repository_count: repositories.size };
}

async function writeTempOutputs({ documents, inputSha256, inputStats, runStats, smokeStats, authSource, accountSource, counters }) {
  rmSync(TEMP_OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(TEMP_OUTPUT_DIR, { recursive: true });

  const matrixPath = join(TEMP_OUTPUT_DIR, "embeddings.npy");
  const recordsPath = join(TEMP_OUTPUT_DIR, "embedding-records.jsonl");
  const manifestPath = join(TEMP_OUTPUT_DIR, "embedding-manifest.json");
  const reportPath = join(TEMP_OUTPUT_DIR, "embedding-validation-report.txt");

  await writeNpyFromCheckpoints(matrixPath, documents);
  const validatedMatrix = await validateNpy(matrixPath, documents.length);
  const records = buildEmbeddingRecords(documents);
  validateRecords(records, documents);
  const written = await writeJsonl(recordsPath, records);
  if (written !== documents.length) throw new PipelineError(`Wrote ${written} records; expected ${documents.length}.`);

  const reloadedRecords = loadJsonlSync(recordsPath);
  validateRecords(reloadedRecords, documents);

  const matrixSha = await sha256File(matrixPath);
  const recordsSha = await sha256File(recordsPath);

  const manifest = {
    embedding_schema_version: EMBEDDING_SCHEMA_VERSION,
    embedding_generation: EMBEDDING_GENERATION,
    provider_artifact_generation: PROVIDER_ARTIFACT_GENERATION,
    pipeline_step: 3,
    generated_at_utc: utcNow(),
    script: SCRIPT_NAME,
    input: {
      path: rel(INPUT_PATH),
      sha256: inputSha256,
      ...inputStats,
    },
    embedding: {
      provider: PROVIDER,
      model: MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      context_window_tokens: MODEL_CONTEXT_WINDOW_TOKENS,
      document_input_mode: DOCUMENT_INPUT_MODE,
      runtime_query_input_mode: QUERY_INPUT_MODE,
      runtime_query_instruction: QUERY_INSTRUCTION,
      postprocess: POSTPROCESS,
      similarity: SIMILARITY,
      dtype: DTYPE,
      field_embedded: "embedding_text",
      authoritative_evidence_field: "text",
      logical_checkpoint_batch_size: LOGICAL_BATCH_SIZE,
      input_utf8_bytes_sanity_limit: INPUT_UTF8_BYTES_SANITY_LIMIT,
      client_side_truncation: false,
      exact_qwen_token_count_available_from_response: false,
    },
    authentication: {
      account_resolution: accountSource,
      credential_resolution: authSource,
      secret_persisted_to_artifacts: false,
    },
    smoke_validation: smokeStats,
    matrix: validatedMatrix,
    run: {
      ...runStats,
      successful_api_requests: counters.successful_api_requests,
      http_attempts_including_retries: counters.http_attempts,
    },
    artifacts: {
      "embeddings.npy": {
        sha256: matrixSha,
        rows: documents.length,
        columns: EMBEDDING_DIMENSIONS,
        dtype: DTYPE,
      },
      "embedding-records.jsonl": {
        sha256: recordsSha,
        records: records.length,
      },
    },
    integrity: {
      matrix_row_equals_record_vector_index: "PASS",
      document_id_order_preserved: "PASS",
      authoritative_text_preserved: "PASS",
      source_fragments_preserved: "PASS",
      embedding_text_preserved: "PASS",
      client_side_truncation: "DISABLED",
      repository_coverage: "PASS",
      duplicate_document_ids: 0,
      invalid_vectors: 0,
      nan_or_inf_vectors: 0,
      zero_vectors: 0,
      unit_normalized_vectors: "PASS",
    },
    next_pipeline_input: {
      vectors: "rag-corpus/embeddings-cloudflare-v1/embeddings.npy",
      records: "rag-corpus/embeddings-cloudflare-v1/embedding-records.jsonl",
      configuration: "rag-corpus/embeddings-cloudflare-v1/embedding-manifest.json",
    },
  };
  await writeJson(manifestPath, manifest);

  const report = [
    "Portfolio GitHub RAG pipeline — Stage 03 / Cloudflare embedding generation v4",
    "",
    "STATUS: PASS",
    "",
    "INPUT",
    `  ${rel(INPUT_PATH)}`,
    `  SHA-256: ${inputSha256}`,
    `  Documents: ${documents.length}`,
    `  Repositories: ${inputStats.repository_count}/${inputStats.repository_total}`,
    "",
    "CLOUDFLARE EMBEDDING CONTRACT",
    `  Provider: ${PROVIDER}`,
    `  Model: ${MODEL}`,
    `  Dimensions: ${EMBEDDING_DIMENSIONS}`,
    `  Context window: ${MODEL_CONTEXT_WINDOW_TOKENS} tokens`,
    `  Document input mode: ${DOCUMENT_INPUT_MODE}`,
    `  Runtime query input mode: ${QUERY_INPUT_MODE}`,
    `  Runtime query instruction: ${QUERY_INSTRUCTION}`,
    `  Postprocess: ${POSTPROCESS}`,
    `  Similarity: ${SIMILARITY}`,
    `  Matrix dtype: ${DTYPE}`,
    "",
    "INPUT-SIZE / TRUNCATION PREFLIGHT",
    `  Embedding words min/median/max: ${inputStats.embedding_words_min}/${inputStats.embedding_words_median}/${inputStats.embedding_words_max}`,
    `  UTF-8 bytes min/median/max: ${inputStats.embedding_utf8_bytes_min}/${inputStats.embedding_utf8_bytes_median}/${inputStats.embedding_utf8_bytes_max}`,
    `  UTF-8 sanity guard: ${INPUT_UTF8_BYTES_SANITY_LIMIT} bytes`,
    "  Client-side truncation: DISABLED",
    "  Full embedding_text submitted to Workers AI: YES",
    "  Exact Qwen token count returned by API: NO",
    "  Documents rejected by byte sanity guard: 0",
    "",
    "API CONTRACT SMOKE TEST",
    `  Document mode: ${smokeStats.document_mode}`,
    `  Query mode: ${smokeStats.query_mode}`,
    `  Document response shape: ${JSON.stringify(smokeStats.document_shape)}`,
    `  Query response shape: ${JSON.stringify(smokeStats.query_shape)}`,
    "",
    "VECTOR VALIDATION",
    `  Matrix shape: (${validatedMatrix.matrix_shape[0]}, ${validatedMatrix.matrix_shape[1]})`,
    `  Valid vectors: ${validatedMatrix.vector_count}/${documents.length}`,
    "  Missing vectors: 0",
    "  Duplicate document IDs: 0",
    "  NaN/Inf vectors: 0",
    "  Zero vectors: 0",
    `  L2 norm min/median/max: ${validatedMatrix.l2_norm_min.toFixed(6)}/${validatedMatrix.l2_norm_median.toFixed(6)}/${validatedMatrix.l2_norm_max.toFixed(6)}`,
    "",
    "CHECKPOINT / API ACCOUNTING",
    `  Logical batches: ${runStats.logical_batch_count}`,
    `  Newly embedded batches: ${runStats.new_logical_batches}`,
    `  Resumed batches: ${runStats.resumed_logical_batches}`,
    `  Successful Workers AI API requests this run: ${counters.successful_api_requests}`,
    `  HTTP attempts including retries: ${counters.http_attempts}`,
    "  Checkpoints are preserved on failure/quota exhaustion: YES",
    "",
    "OUTPUT",
    "  rag-corpus/embeddings-cloudflare-v1/embeddings.npy",
    "  rag-corpus/embeddings-cloudflare-v1/embedding-records.jsonl",
    "  rag-corpus/embeddings-cloudflare-v1/embedding-manifest.json",
    "  rag-corpus/embeddings-cloudflare-v1/embedding-validation-report.txt",
    "",
    "PRESERVATION",
    "  rag-corpus/embeddings-v2/ modified: NO",
    "  Step 02 retrieval documents modified: NO",
    "",
    "NEXT STAGE",
    "  Create a 1024-D cosine Cloudflare Vectorize index and publish these vectors.",
    "  Runtime query embeddings MUST use the query mode/instruction recorded above.",
    "",
  ].join("\n");
  await fs.writeFile(reportPath, report, "utf8");

  const manifestReloaded = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (manifestReloaded.input?.sha256 !== inputSha256) throw new PipelineError("Manifest re-read input SHA mismatch.");
  if (manifestReloaded.embedding?.model !== MODEL) throw new PipelineError("Manifest re-read model mismatch.");
  if (!String(await fs.readFile(reportPath, "utf8")).includes("STATUS: PASS")) throw new PipelineError("Validation report re-read failed.");
  if ((await sha256File(matrixPath)) !== matrixSha) throw new PipelineError("embeddings.npy changed during validation.");
  if ((await sha256File(recordsPath)) !== recordsSha) throw new PipelineError("embedding-records.jsonl changed during validation.");

  return { matrix: validatedMatrix, matrixSha, recordsSha };
}

function publishTempOutput() {
  const backup = join(RAG_CORPUS_DIR, ".embeddings-cloudflare-v1.previous");
  rmSync(backup, { recursive: true, force: true });
  const hadExisting = existsSync(OUTPUT_DIR);
  if (hadExisting) renameSync(OUTPUT_DIR, backup);
  try {
    renameSync(TEMP_OUTPUT_DIR, OUTPUT_DIR);
  } catch (error) {
    if (hadExisting && existsSync(backup) && !existsSync(OUTPUT_DIR)) renameSync(backup, OUTPUT_DIR);
    throw error;
  }
  rmSync(backup, { recursive: true, force: true });
}

async function verifyPublishedOutput(inputSha256) {
  const required = [
    join(OUTPUT_DIR, "embeddings.npy"),
    join(OUTPUT_DIR, "embedding-records.jsonl"),
    join(OUTPUT_DIR, "embedding-manifest.json"),
    join(OUTPUT_DIR, "embedding-validation-report.txt"),
  ];
  required.forEach((path) => {
    if (!existsSync(path)) throw new PipelineError(`Published artifact missing: ${rel(path)}`);
  });
  const manifest = JSON.parse(await fs.readFile(join(OUTPUT_DIR, "embedding-manifest.json"), "utf8"));
  if (manifest.input?.sha256 !== inputSha256) throw new PipelineError("Published manifest input SHA mismatch.");
  if (manifest.embedding?.dimensions !== EMBEDDING_DIMENSIONS) throw new PipelineError("Published dimension mismatch.");
  if (manifest.embedding?.model !== MODEL) throw new PipelineError("Published model mismatch.");
  await validateNpy(join(OUTPUT_DIR, "embeddings.npy"), EXPECTED_DOCUMENT_COUNT);
}

function printHeader() {
  console.log("Portfolio GitHub RAG pipeline — Stage 03 / Cloudflare embedding generation v4");
  console.log(`RAG root: ${RAG_ROOT}`);
  console.log();
  console.log("MODEL");
  console.log(`  ${MODEL}`);
  console.log(`  ${EMBEDDING_DIMENSIONS} dimensions | cosine | explicit L2 normalization`);
  console.log(`  documents -> corpus, queries + explicit instruction -> runtime query`);
  console.log();
  console.log("PRESERVATION");
  console.log("  Existing rag-corpus/embeddings-v2/ remains untouched.");
  console.log("  New output: rag-corpus/embeddings-cloudflare-v1/");
  console.log();
}

async function main() {
  printHeader();
  if (process.argv.length !== 2) {
    throw new PipelineError(`This generator accepts zero arguments. Run: node ${SCRIPT_NAME}`);
  }

  console.log("[1/10] Locate and validate finalized Stage 02 documents ... ", "");
  if (!existsSync(INPUT_PATH)) throw new PipelineError(`Missing input: ${rel(INPUT_PATH)}`);
  const documents = loadJsonlSync(INPUT_PATH);
  const inputStats = validateDocuments(documents);
  const inputSha256 = await sha256File(INPUT_PATH);
  console.log(`      SUCCESS (${documents.length} documents; ${inputStats.repository_count}/${inputStats.repository_total} repositories)`);

  console.log("[2/10] Resolve existing Cloudflare/Wrangler authentication ... ", "");
  const account = resolveCloudflareAccountId();
  const auth = resolveCloudflareAuth();
  console.log(`      SUCCESS (account via ${account.source}; credential via ${auth.source}; secret hidden)`);

  console.log("[3/10] Validate Workers AI document/query embedding contract ... ", "");
  const counters = { successful_api_requests: 0, http_attempts: 0 };
  const smokeStats = await runSmokeTests(account.accountId, auth, counters);
  console.log(`      SUCCESS (${DOCUMENT_INPUT_MODE} + ${QUERY_INPUT_MODE}; ${EMBEDDING_DIMENSIONS}D)`);

  console.log("[4/10] Validate input-size sanity and no client-side truncation ... ", "");
  console.log(`      SUCCESS (max ${inputStats.embedding_utf8_bytes_max} UTF-8 bytes < sanity limit ${INPUT_UTF8_BYTES_SANITY_LIMIT}; no client-side truncation)`);

  console.log("[5/10] Prepare resumable embedding checkpoint identity ... ", "");
  const identity = checkpointIdentity(inputSha256, documents);
  await prepareCheckpoint(identity);
  console.log("      SUCCESS");

  console.log("[6/10] Generate/resume Cloudflare Workers AI document embeddings ...");
  const runStats = await embedWithCheckpoints(documents, account.accountId, auth, counters);
  console.log(`      SUCCESS (${runStats.new_logical_batches} new; ${runStats.resumed_logical_batches} resumed)`);

  console.log("[7/10] Assemble 2808 x 1024 float32 NPY and evidence records ... ", "");
  const outputStats = await writeTempOutputs({
    documents,
    inputSha256,
    inputStats,
    runStats,
    smokeStats,
    authSource: auth.source,
    accountSource: account.source,
    counters,
  });
  console.log(`      SUCCESS (${outputStats.matrix.matrix_shape[0]} x ${outputStats.matrix.matrix_shape[1]})`);

  console.log("[8/10] Re-read and validate generated artifacts ... ", "");
  await validateNpy(join(TEMP_OUTPUT_DIR, "embeddings.npy"), documents.length);
  const rereadRecords = loadJsonlSync(join(TEMP_OUTPUT_DIR, "embedding-records.jsonl"));
  validateRecords(rereadRecords, documents);
  console.log("      SUCCESS");

  console.log("[9/10] Atomically publish Cloudflare embedding generation ... ", "");
  publishTempOutput();
  console.log("      SUCCESS");

  console.log("[10/10] Verify published output and remove completed checkpoints ... ", "");
  await verifyPublishedOutput(inputSha256);
  rmSync(CHECKPOINT_DIR, { recursive: true, force: true });
  console.log("      SUCCESS");

  console.log();
  console.log("STAGE 03 CLOUDFLARE EMBEDDING GENERATION: SUCCESS");
  console.log(`Documents/vectors: ${documents.length}`);
  console.log(`Dimensions:        ${EMBEDDING_DIMENSIONS}`);
  console.log(`Model:             ${MODEL}`);
  console.log(`New API batches:   ${runStats.new_logical_batches}`);
  console.log(`Resumed batches:   ${runStats.resumed_logical_batches}`);
  console.log(`API requests:      ${counters.successful_api_requests} successful`);
  console.log("Existing Nomic:    untouched");
  console.log();
  console.log("OUTPUT");
  console.log("  rag-corpus/embeddings-cloudflare-v1/embeddings.npy");
  console.log("  rag-corpus/embeddings-cloudflare-v1/embedding-records.jsonl");
  console.log("  rag-corpus/embeddings-cloudflare-v1/embedding-manifest.json");
  console.log("  rag-corpus/embeddings-cloudflare-v1/embedding-validation-report.txt");
  console.log();
  console.log("NEXT STAGE");
  console.log("  Create the 1024-D cosine Vectorize index and publish this validated generation.");
}

main().catch((error) => {
  console.error();
  console.error("STAGE 03 CLOUDFLARE EMBEDDING GENERATION: FAILED");
  console.error(`Reason: ${error instanceof Error ? error.message : String(error)}`);
  if (existsSync(CHECKPOINT_DIR)) {
    console.error(`Checkpoint preserved: ${rel(CHECKPOINT_DIR)}`);
    console.error("Rerun the same zero-argument command to resume after fixing the issue/quota reset.");
  }
  rmSync(TEMP_OUTPUT_DIR, { recursive: true, force: true });
  process.exitCode = 1;
});
