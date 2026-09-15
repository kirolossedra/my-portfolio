"""Local manifest contracts; verify bytes before accepting counts."""
import hashlib
import json
from pathlib import Path


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_stage1(root):
    corpus = root / '01-corpus/output'
    manifest = json.loads((corpus / 'manifest.json').read_text(encoding='utf-8'))
    source = root / '00-source/portfolio-rag'
    source_manifest = source / 'corpus-manifest.json'
    if sha(source_manifest) != manifest['source_manifest']['sha256']:
        raise ValueError('Stage 01 source manifest SHA-256 mismatch')
    expected = json.loads(source_manifest.read_text(encoding='utf-8'))['processedRepositories']
    if type(expected) is not int or expected < 1:
        raise ValueError('Invalid processed repository count')
    stats = manifest['stats']
    if any(stats[k] != expected for k in ('repository_count', 'expected_repository_count', 'source_file_count')):
        raise ValueError('Stage 01 manifest count mismatch')
    if manifest['repository_indexes'] != list(range(1, expected + 1)):
        raise ValueError('Stage 01 index inventory mismatch')
    paths = [item['file'] for item in manifest['inputs']]
    discovered = {p.relative_to(source).as_posix() for p in source.glob('repositories/repo-*/README.md')}
    if len(paths) != expected or len(set(paths)) != expected or set(paths) != discovered:
        raise ValueError('Stage 01 source path inventory mismatch')
    for item in manifest['inputs']:
        path = source / item['file']
        if not path.resolve().is_relative_to(source.resolve()) or sha(path) != item['sha256']:
            raise ValueError('Source README SHA-256 mismatch')
    for name, info in manifest['artifacts'].items():
        path = corpus / name
        if not path.resolve().is_relative_to(corpus.resolve()) or sha(path) != info['sha256']:
            raise ValueError('Stage 01 artifact SHA-256 mismatch')
    if 'repositories.jsonl' not in manifest['artifacts']:
        raise ValueError('Missing Stage 01 input artifact hash')
    return manifest
