import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

// Fail closed: no test can send an actual HTTP request.
globalThis.fetch = () => { throw new Error('REAL NETWORK FORBIDDEN'); };
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const relativeScript = '03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs';
const sha = value => createHash('sha256').update(value).digest('hex');
const unit = text => { const vector = Array(1024).fill(0); vector[parseInt(sha(text).slice(0, 4), 16) % 1024] = 1; return vector; };
const read = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const write = async (path, value) => { await fs.mkdir(dirname(path), { recursive: true }); await fs.writeFile(path, JSON.stringify(value)); };

async function fixture(t, count = 3) {
  const temporary = await fs.mkdtemp(join(tmpdir(), 'stage03-offline-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const root = join(temporary, 'rag-next-pipeline');
  await fs.mkdir(join(root, '01-corpus/scripts'), { recursive: true });
  await fs.mkdir(join(root, '01-corpus/output'), { recursive: true });
  await fs.mkdir(join(root, '03-embeddings/output'), { recursive: true });
  await fs.mkdir(dirname(join(root, relativeScript)), { recursive: true });
  await fs.copyFile(join(ROOT, relativeScript), join(root, relativeScript));
  const template = JSON.parse((await fs.readFile(join(ROOT, '02-retrieval-documents/output/documents.jsonl'), 'utf8')).split('\n')[0]);
  let documents = Array.from({ length: count }, (_, index) => {
    const document = structuredClone(template);
    document.document_id = `test-${index}`;
    document.repository_index = 1; document.repository_total = 1;
    document.embedding_text += `\nUnique fixture evidence ${index}`;
    document.embedding_word_count = document.embedding_text.match(/\S+/g).length;
    document.provenance.embedding_text_sha256 = sha(document.embedding_text);
    return document;
  });
  const documentsPath = join(root, '02-retrieval-documents/output/documents.jsonl');
  const manifestPath = join(root, '02-retrieval-documents/output/document-manifest.json');
  const releasePath = join(root, '02-retrieval-documents/output/release.json');
  const checkpoint = join(root, '03-embeddings/.embedding-cloudflare-v1-checkpoint');
  const output = join(root, '03-embeddings/output/embeddings-cloudflare-v1');
  await fs.writeFile(join(root, '01-corpus/output/repositories.jsonl'), '[]\n');
  await write(join(root, '01-corpus/output/manifest.json'), { stats: { repository_count: 1 } });
  async function update(next = documents) {
    documents = next;
    for (const document of documents) {
      document.embedding_word_count = document.embedding_text.match(/\S+/g).length;
      document.provenance.embedding_text_sha256 = sha(document.embedding_text);
    }
    const content = documents.map(x => JSON.stringify(x)).join('\n') + '\n';
    await fs.mkdir(dirname(documentsPath), { recursive: true }); await fs.writeFile(documentsPath, content);
    const documentsSha256 = sha(content);
    await write(manifestPath, { schema_version: '2.0.0',
      statistics: { documents: documents.length, repository_total: 1, repositories_covered: 1 },
      input: { repository_count: 1, manifest_sha256: sha(await fs.readFile(join(root, '01-corpus/output/manifest.json'))),
        sha256: sha(await fs.readFile(join(root, '01-corpus/output/repositories.jsonl'))) },
      artifacts: { 'documents.jsonl': { sha256: documentsSha256 } } });
    await write(releasePath, {
      schema_version: 'rag-release-v1',
      release_id: `rag-${sha(`fixture-source\n${documentsSha256}`).slice(0, 24)}`,
      source_commit: '0000000000000000000000000000000000000000',
      retrieval_documents_sha256: documentsSha256,
      document_count: documents.length,
      repository_count: 1
    });
  }
  await update();
  const { main } = await import(pathToFileURL(join(root, relativeScript)).href);
  const calls = [], authentication = [];
  function dependencies({ failBatch = null } = {}) {
    let batches = 0;
    return {
      resolveAccount: () => { authentication.push('account'); return { accountId: 'offline-account', source: 'mock' }; },
      resolveAuth: () => { authentication.push('auth'); return { headers: { Authorization: 'mock-only' }, source: 'mock' }; },
      fetch: async (url, options) => {
        assert.match(url, /ai\/run\/@cf\/qwen\/qwen3-embedding-0\.6b$/);
        const payload = JSON.parse(options.body); calls.push(payload);
        const smoke = payload.queries || payload.documents?.[0]?.includes('smoke test.');
        if (!smoke && ++batches === failBatch) return { ok: false, status: 400, headers: new Headers(), text: async () => JSON.stringify({ errors: [{ message: 'mock interruption' }] }) };
        const length = (payload.documents || payload.queries).length;
        return { ok: true, status: 200, headers: new Headers(), text: async () => JSON.stringify({ success: true, result: { data: (payload.documents || payload.queries).map(unit), shape: [length, 1024] } }) };
      }
    };
  }
  const forbidden = {
    resolveAccount: () => { throw new Error('AUTHENTICATION FORBIDDEN'); },
    resolveAuth: () => { throw new Error('AUTHENTICATION FORBIDDEN'); },
    fetch: () => { throw new Error('NETWORK FORBIDDEN'); }
  };
  const run = (argv = ['--generate'], deps = dependencies()) => main({ argv, dependencies: deps });
  return { root, run, update, get documents() { return documents; }, documentsPath, manifestPath, checkpoint, output, calls, authentication, dependencies, forbidden };
}
function embeddingCalls(f) { return f.calls.filter(x => x.documents && !x.documents[0].includes('smoke test.')); }
async function firstCache(root) {
  const base = join(root, '03-embeddings/cache/cloudflare-v1');
  const contract = (await fs.readdir(base))[0];
  return join(base, contract, (await fs.readdir(join(base, contract))).find(x => x.endsWith('.json')));
}

test('validation exits before authentication and network and writes report', async t => {
  const f = await fixture(t);
  const result = await f.run(['--validate-only'], f.forbidden);
  assert.equal(result.remote_calls, 0);
  const report = await read(join(f.root, '03-embeddings/validation/local-validation.json'));
  assert.equal(report.input.document_count, 3);
  assert.equal(report.remote_calls, 0);
  await assert.rejects(fs.access(f.checkpoint));
});
test('explicit modes only; invalid invocation cannot authenticate', async t => {
  const f = await fixture(t);
  for (const args of [[], ['--unknown'], ['--validate-only', '--generate']]) await assert.rejects(f.run(args, f.forbidden), /Usage/);
});
test('both modes reject tampered upstream input before authentication', async t => {
  const f = await fixture(t);
  await fs.appendFile(join(f.root, '01-corpus/output/repositories.jsonl'), ' ');
  for (const mode of ['--generate', '--validate-only']) await assert.rejects(f.run([mode], f.forbidden), /SHA-256 mismatch/);
});
test('mocked generation reaches REST path and publishes correct matrix/records', async t => {
  const f = await fixture(t);
  const result = await f.run();
  assert.deepEqual(f.authentication, ['account', 'auth']);
  assert.equal(result.remote_calls, 3); assert.equal(result.new_document_embeddings, 3);
  const manifest = await read(join(f.output, 'embedding-manifest.json'));
  assert.deepEqual(manifest.matrix.matrix_shape, [3, 1024]);
  assert.equal(manifest.embedding.dtype, 'float32');
  assert.equal(embeddingCalls(f)[0].documents.length, 3);
  await assert.rejects(fs.access(f.checkpoint));
  await fs.access(await firstCache(f.root));
});
test('matching completed build exits with zero authentication or requests', async t => {
  const f = await fixture(t); await f.run();
  const before = await fs.readFile(join(f.output, 'embeddings.npy'));
  const result = await f.run(['--generate'], f.forbidden);
  assert.equal(result.mode, 'completed-build-reuse'); assert.equal(result.remote_calls, 0);
  assert.deepEqual(await fs.readFile(join(f.output, 'embeddings.npy')), before);
});
test('compatible interruption resumes saved batch; requests only missing documents', async t => {
  const f = await fixture(t, 17);
  await assert.rejects(f.run(['--generate'], f.dependencies({ failBatch: 2 })), /mock interruption/);
  await fs.access(join(f.checkpoint, 'batch-0000-0015.json'));
  f.calls.length = 0;
  const result = await f.run();
  assert.equal(result.resumed_logical_batches, 1);
  assert.equal(result.new_document_embeddings, 1);
  assert.deepEqual(embeddingCalls(f).flatMap(x => x.documents), [f.documents[16].embedding_text]);
});
test('changed corpus reuses cached text despite changed document IDs; no requests', async t => {
  const f = await fixture(t); await f.run();
  await f.update(f.documents.map((d, i) => ({ ...d, document_id: `new-id-${i}` })));
  const result = await f.run(['--generate'], f.forbidden);
  assert.equal(result.remote_calls, 0); assert.equal(result.cached_document_count, 3);
  assert.equal(result.new_document_embeddings, 0);
});
test('changed corpus embeds only changed text, including mixed cached/new batch', async t => {
  const f = await fixture(t); await f.run();
  const documents = structuredClone(f.documents);
  documents[1].embedding_text += '\nNew evidence';
  await f.update(documents); f.calls.length = 0;
  const result = await f.run();
  assert.equal(result.cached_document_count, 2); assert.equal(result.new_document_embeddings, 1);
  assert.deepEqual(embeddingCalls(f).flatMap(x => x.documents), [documents[1].embedding_text]);
  const matrix = await fs.readFile(join(f.output, 'embeddings.npy'));
  const offset = 10 + matrix.readUInt16LE(8);
  for (let row = 0; row < documents.length; row++) {
    const expected = unit(documents[row].embedding_text);
    for (let col = 0; col < 1024; col++) assert.equal(matrix.readFloatLE(offset + (row * 1024 + col) * 4), expected[col]);
  }
});
test('changed input rejects checkpoint before authentication or smoke', async t => {
  const f = await fixture(t, 17);
  await assert.rejects(f.run(['--generate'], f.dependencies({ failBatch: 2 })));
  const documents = structuredClone(f.documents); documents[0].embedding_text += '\nChanged'; await f.update(documents);
  await assert.rejects(f.run(['--generate'], f.forbidden), /checkpoint identity/);
});
test('incompatible checkpoint contract is rejected before authentication', async t => {
  const f = await fixture(t, 17);
  await assert.rejects(f.run(['--generate'], f.dependencies({ failBatch: 2 })));
  const path = join(f.checkpoint, 'identity.json'); const identity = await read(path);
  identity.model = 'different-model'; await write(path, identity);
  await assert.rejects(f.run(['--generate'], f.forbidden), /checkpoint identity/);
});
test('invalid checkpoint batch IDs are rejected before authentication', async t => {
  const f = await fixture(t, 17);
  await assert.rejects(f.run(['--generate'], f.dependencies({ failBatch: 2 })));
  const path = join(f.checkpoint, 'batch-0000-0015.json'); const batch = await read(path);
  batch.document_ids[0] = 'wrong-id'; await write(path, batch);
  await assert.rejects(f.run(['--generate'], f.forbidden), /document IDs mismatch/);
});
test('completed build contract mismatch cannot silently reuse or overwrite', async t => {
  const f = await fixture(t); await f.run();
  const path = join(f.output, 'embedding-manifest.json'); const manifest = await read(path);
  manifest.embedding.runtime_query_input_mode = 'documents'; await write(path, manifest);
  await assert.rejects(f.run(['--generate'], f.forbidden), /contract mismatch/);
});
test('completed matrix corruption is rejected before authentication', async t => {
  const f = await fixture(t); await f.run();
  await fs.appendFile(join(f.output, 'embeddings.npy'), 'corrupt');
  await assert.rejects(f.run(['--generate'], f.forbidden), /artifact hash mismatch/);
});
test('incompatible text cache is rejected before authentication', async t => {
  const f = await fixture(t); await f.run();
  const path = await firstCache(f.root); const entry = await read(path);
  entry.embedding_text_sha256 = 'wrong-hash'; await write(path, entry);
  await f.update(f.documents.map((d, i) => ({ ...d, document_id: `new-${i}` })));
  await assert.rejects(f.run(['--generate'], f.forbidden), /vector cache/);
});
test('incompatible cache contract is rejected before authentication', async t => {
  const f = await fixture(t); await f.run();
  const path = await firstCache(f.root); const entry = await read(path);
  entry.contract.dimensions = 512; await write(path, entry);
  await f.update(f.documents.map((d, i) => ({ ...d, document_id: `new-${i}` })));
  await assert.rejects(f.run(['--generate'], f.forbidden), /vector cache/);
});
test('cache vector corruption is rejected before authentication', async t => {
  const f = await fixture(t); await f.run();
  const path = await firstCache(f.root); const entry = await read(path);
  entry.vector[0] = 2; await write(path, entry);
  await f.update(f.documents.map((d, i) => ({ ...d, document_id: `new-${i}` })));
  await assert.rejects(f.run(['--generate'], f.forbidden), /vector cache/);
});

test('fully saved checkpoints assemble output without authentication or smoke', async t => {
  const f = await fixture(t, 17);
  await assert.rejects(f.run(['--generate'], f.dependencies({ failBatch: 2 })));
  await write(join(f.checkpoint, 'batch-0016-0016.json'), { checkpoint_batch_schema_version: '1.0.0',
    start: 16, end_exclusive: 17, document_ids: [f.documents[16].document_id],
    vectors: [unit(f.documents[16].embedding_text)], raw_norms: [1] });
  const result = await f.run(['--generate'], f.forbidden);
  assert.equal(result.remote_calls, 0); assert.equal(result.resumed_logical_batches, 2);
  await fs.access(join(f.output, 'embeddings.npy'));
});
test('identical embedding text is requested once even with different IDs', async t => {
  const f = await fixture(t);
  const documents = structuredClone(f.documents); documents[1].embedding_text = documents[0].embedding_text;
  await f.update(documents);
  const result = await f.run();
  assert.equal(result.new_document_embeddings, 2);
  assert.equal(embeddingCalls(f)[0].documents.length, 2);
});
