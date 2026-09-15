"""Validate the final local rehearsal and write machine-readable audit evidence."""
from pathlib import Path
import hashlib
import importlib.util
import json
import re
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'01-corpus/scripts'))
from manifest_contract import validate_stage1
from retrieval_clean import clean_markdown


def sha(data): return hashlib.sha256(data).hexdigest()


def main():
    stage1=validate_stage1(ROOT)
    base=ROOT/'02-retrieval-documents/output'
    manifest=json.loads((base/'document-manifest.json').read_text(encoding='utf-8'))
    assert manifest['input']['manifest_sha256']==sha((ROOT/'01-corpus/output/manifest.json').read_bytes())
    for name,info in manifest['artifacts'].items():
        assert sha((base/name).read_bytes())==info['sha256'],name
    records=[json.loads(s) for s in (ROOT/'01-corpus/output/repositories.jsonl').read_text(encoding='utf-8').splitlines()]
    docs=[json.loads(s) for s in (base/'documents.jsonl').read_text(encoding='utf-8').splitlines()]
    assert len(docs)==manifest['statistics']['documents']
    assert {d['repository_index'] for d in docs}==set(stage1['repository_indexes'])
    patterns={
        'headings':r'(?m)^\s*#{1,6}\s',
        'lists':r'(?m)^[ \t]*(?:[-*+][ \t]+|\d+[.)][ \t]+)',
        'fences':r'```|~~~',
        'links':r'\[[^\]]+\]\(',
        'tables':r'(?m)^\s*\|.*\|\s*$',
        'separators':r'(?m)^\s*(?:---+|___+|\*\*\*+)\s*$',
        'inline_code':r'`[^`]+`',
        # Matched formatting delimiters, excluding path/glob and operator syntax.
        'emphasis':r'(?<![\w/*])\*{1,2}(?![/\s*])[^*\n]+(?<!\s)\*{1,2}(?![\w/*])|(?<![\w/])_{1,2}\S[^_\n]*?_{1,2}(?![\w/])',
    }
    issues=[]
    for d in docs:
        for field in ('text','embedding_text'):
            for name,pattern in patterns.items():
                if re.search(pattern,d[field]): issues.append((d['document_id'],field,name))
        for fragment in d['source_fragments']:
            cleaned=clean_markdown(fragment['text'])
            assert cleaned in d['text'], (d['document_id'],'fragment semantic text absent')
        assert d['text'] in d['embedding_text']
    assert not issues, issues[:20]
    zip_path=Path.home()/'Downloads/portfolio-rag-main (1).zip'
    # Device path is explicit because the sandbox profile may have another HOME.
    if not zip_path.exists(): zip_path=Path('C:/Users/Ordinateur de Kiro/Downloads/portfolio-rag-main (1).zip')
    with zipfile.ZipFile(zip_path) as z:
        for r in records:
            original=z.read('portfolio-rag-main/'+r['source']['file'])
            assert original==(ROOT/'00-source/portfolio-rag'/r['source']['file']).read_bytes()
            assert original.decode('utf-8')==r['raw_analysis']
            assert sha(original)==r['source']['sha256']
            assert r['source']['line_start']==1 and r['source']['line_end']==len(r['raw_analysis'].splitlines())
    samples=[]
    for index in (1,67,132,134):
        record=next(r for r in records if r['repository_index']==index)
        chosen=[d for d in docs if d['repository_index']==index]
        sample=next((d for d in chosen if d['evidence_polarity']=='negative'),chosen[0])
        samples.append({'repository_index':index,'name':record['repository_name'],'source':record['source'],'document_id':sample['document_id'],'text':sample['text'],'embedding_text':sample['embedding_text']})
    result={'status':'PASS','repositories':len(records),'coverage_percent':100,'documents':len(docs),'markdown_issues':issues,'source_readmes_byte_identical_to_zip':len(records),'all_document_fragments_cleaned_without_content_loss':True,'spot_checks':samples,'preserved_literal_syntax':['2**n','**/*.tex','worker/__tests__/rag-runtime.test.ts'],'stage1_stats':stage1['stats'],'stage2_stats':manifest['statistics']}
    (ROOT/'tests/results/local-validation.json').write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf-8')
    print(json.dumps({k:v for k,v in result.items() if k not in ('spot_checks','stage1_stats','stage2_stats')},indent=2))


if __name__=='__main__': main()
