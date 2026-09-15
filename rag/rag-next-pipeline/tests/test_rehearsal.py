import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '01-corpus/scripts'))
from retrieval_clean import clean_markdown
from manifest_contract import validate_stage1


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module

S1 = load('stage1', ROOT / '01-corpus/scripts/prepare-rag-corpus.py')


class SourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.patch = patch.object(S1, 'PROJECT_ROOT', self.root)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        self.manifest(1)

    def manifest(self, count, **kwargs):
        (self.root/'corpus-manifest.json').write_text(json.dumps({'processedRepositories':count, **kwargs}), encoding='utf-8')

    def source(self, text='# Repository 001 — Demo\n\n## Evidence\nNo production tests.\n', folder='repo-001-Demo'):
        path=self.root/'repositories'/folder/'README.md'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(text.encode('utf-8'))
        return S1.InputFile(path, 10)

    def test_new_h1_raw_and_provenance(self):
        text='# Repository 001 — Demo\r\n\r\n## Evidence\r\nNo tests.  \r\n'
        block, = S1.parse_repository_blocks(self.source(text))
        self.assertEqual(block.index,1)
        self.assertEqual(block.raw,text)
        self.assertEqual(block.source_file,'repositories/repo-001-Demo/README.md')
        self.assertEqual(block.source_line_end,4)

    def test_title_identity_and_tags(self):
        block,=S1.parse_repository_blocks(self.source('# Demo\n\n## Repository Identity\n\n- Repository: 001 / 138\n\n# Project Tags\n- `demo`\n'))
        self.assertEqual(block.total,1)

    def test_missing_malformed_and_legacy_indexes_rejected(self):
        for h in ('# Demo', '# Repository bad — Demo', '# Repository 000 — Demo', '# Repository 001 / 134 — Demo'):
            with self.subTest(h=h), self.assertRaises(RuntimeError):
                S1.parse_repository_blocks(self.source(h+'\n'))

    def test_multiple_analyses_rejected(self):
        with self.assertRaises(RuntimeError):
            S1.parse_repository_blocks(self.source('# Repository 001 — Demo\n# Repository 002 — Other\n'))

    def test_duplicate_index(self):
        a=self.source(); b=self.source('# Repository 001 — Other\n', 'repo-001-Other')
        with self.assertRaisesRegex(RuntimeError,'Duplicate repository index'):
            S1.select_repository_blocks([a,b])

    def test_duplicate_path(self):
        a=self.source()
        with self.assertRaisesRegex(RuntimeError,'Duplicate repository paths'):
            S1.select_repository_blocks([a,a])

    def test_path_index_mismatch(self):
        with self.assertRaises(RuntimeError):
            S1.parse_repository_blocks(self.source('# Repository 002 — Demo\n'))

    def test_processed_count_mismatch(self):
        self.source(); self.manifest(2)
        with self.assertRaisesRegex(RuntimeError,'processed-count mismatch'):
            S1.discover_input_files()

    def test_inventory_gap(self):
        self.manifest(1, repositoryLineCounts={'2':10})
        with self.assertRaisesRegex(RuntimeError,'inventory'):
            S1.discover_input_files()

    def test_unrelated_readme_excluded(self):
        self.source(); (self.root/'README.md').write_text('unrelated')
        (self.root/'repositories/repo-001-Demo/nested').mkdir()
        (self.root/'repositories/repo-001-Demo/nested/README.md').write_text('unrelated')
        self.assertEqual(len(S1.discover_input_files()),1)


class CleaningTests(unittest.TestCase):
    def test_headings_lists_emphasis_and_separators(self):
        self.assertEqual(clean_markdown('# Heading\n\n- **Not deployed**\n1. _No tests_\n---\n***'), 'Heading\n\nNot deployed\nNo tests')

    def test_table_negative_and_measurements(self):
        self.assertEqual(clean_markdown('| Claim | Evidence |\n| --- | :---: |\n| **No TLS** | Not implemented; 5 ms on 2026-09-09 |'), 'Claim; Evidence\nNo TLS; Not implemented; 5 ms on 2026-09-09')

    def test_links_inline_code_and_identifiers(self):
        self.assertEqual(clean_markdown('[evidence](https://host/a(b)) `worker/__tests__/a.py` and `2**n` and `**/*.tex`'), 'evidence worker/__tests__/a.py and 2**n and **/*.tex')

    def test_fenced_program_preserves_code(self):
        self.assertEqual(clean_markdown('```python\n# comment\nx = 2**n\nfile_name = "a.py"\n```'), '# comment\nx = 2**n\nfile_name = "a.py"')

    def test_markdown_and_text_fences(self):
        self.assertEqual(clean_markdown('```markdown\n# Demo\n```\n```text\n`main.py`\n```'),'Demo\nmain.py')

    def test_reference_links(self):
        self.assertEqual(clean_markdown('[No tests][ref]\n\n[ref]: https://host/path'),'No tests')

    def test_limitation_list_never_deleted(self):
        self.assertEqual(clean_markdown('- No deployment evidence\n- No production measurements'), 'No deployment evidence\nNo production measurements')


class IntegrationTests(unittest.TestCase):
    def test_manifest_propagation_and_tampering(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'rag-next-pipeline'
            
            for stage in ('01-corpus', '02-retrieval-documents', '03-embeddings'):
                shutil.copytree(ROOT/stage/'scripts', root/stage/'scripts')
            source=root/'00-source/portfolio-rag'; source.mkdir(parents=True)
            (source/'corpus-manifest.json').write_text(json.dumps({'processedRepositories':2,'totalRepositories':5}),encoding='utf-8')
            for i in (1,2):
                p=source/f'repositories/repo-{i:03d}-Demo{i}/README.md'; p.parent.mkdir(parents=True)
                p.write_text(f'# Repository {i:03d} — Demo{i}\n\n## Limitations\n\n- **No production deployment evidence.**\n- No TLS.\n\n## Architecture\n\nPython data processing reads `data_file.csv` and computes latency measurements in 5 ms windows. The output is an offline report, not a deployed service.\n',encoding='utf-8')
            def run(*args, ok=True):
                result=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace')
                if ok: self.assertEqual(result.returncode,0,result.stdout+result.stderr)
                else: self.assertNotEqual(result.returncode,0,result.stdout+result.stderr)
                return result
            run(sys.executable,str(root/'01-corpus/scripts/prepare-rag-corpus.py'))
            validate_stage1(root)
            stage2=root/'02-retrieval-documents/scripts/build-rag-retrieval-documents-v2.py'
            run(sys.executable,str(stage2))
            manifest_path=root/'02-retrieval-documents/output/document-manifest.json'
            manifest=json.loads(manifest_path.read_text())
            self.assertEqual(manifest['statistics']['repository_total'],2)
            docs_path=manifest_path.parent/'documents.jsonl'
            docs=[json.loads(x) for x in docs_path.read_text().splitlines()]
            self.assertEqual(manifest['statistics']['documents'],len(docs))
            self.assertTrue(all('No TLS.' in '\n'.join(d['text'] for d in docs if d['repository_index']==i) for i in (1,2)))
            stage3=root/'03-embeddings/scripts/cloudflare/generate-rag-embeddings-v4-cloudflare.mjs'
            run('node',str(stage3),'--validate-only')
            result=json.loads((root/'03-embeddings/validation/local-validation.json').read_text())
            self.assertEqual(result['input']['document_count'],len(docs))
            self.assertEqual(result['remote_calls'],0)
            run('node',str(stage3),ok=False)
            original=docs_path.read_bytes(); docs_path.write_bytes(original+b'\n')
            run('node',str(stage3),'--validate-only',ok=False)
            docs_path.write_bytes(original)
            original_manifest=manifest_path.read_bytes()
            manifest['statistics']['documents']+=1
            manifest_path.write_text(json.dumps(manifest))
            run('node',str(stage3),'--validate-only',ok=False)
            manifest_path.write_bytes(original_manifest)
            stage1_manifest=root/'01-corpus/output/manifest.json'
            stage1_manifest.write_bytes(stage1_manifest.read_bytes()+b'\n')
            run('node',str(stage3),'--validate-only',ok=False)
            input_path=root/'01-corpus/output/repositories.jsonl'
            input_path.write_bytes(input_path.read_bytes()+b'\n')
            run(sys.executable,str(stage2),ok=False)


if __name__ == '__main__':
    unittest.main()
