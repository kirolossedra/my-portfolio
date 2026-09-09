#!/usr/bin/env python3
"""Step 4 v3: evidence-aware FREE LOCAL retrieval reference implementation.

Run from any working directory:

    python rag/scripts/04-retrieval-reference/build-rag-retrieval-v3-evidence-aware-local.py

The script resolves the enclosing ``rag/`` root from its own location. The
retrieval design remains the established v3 reference: exact dense recall,
BM25, metadata recall, RRF, primary-concept/evidence gates, pinned local
CrossEncoder reranking, polarity handling, semantic dedupe and repository
diversity.
"""
from __future__ import annotations

import hashlib, importlib.metadata, json, math, os, re, shutil, sys, time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

SCRIPT_NAME = Path(__file__).name
SCRIPT_DIR = Path(__file__).resolve().parent

def find_rag_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if candidate.name == "rag" and (candidate / "scripts").is_dir() and (candidate / "rag-corpus").is_dir():
            return candidate
    raise RuntimeError("Could not locate the enclosing rag/ root. Expected this script to live under rag/scripts/.")

RAG_ROOT = find_rag_root(SCRIPT_DIR)
BASE_DIR = RAG_ROOT
RAG_DIR = RAG_ROOT / "rag-corpus"
EMBEDDINGS_DIR = RAG_DIR / "embeddings-v2"
MATRIX_PATH = EMBEDDINGS_DIR / "embeddings.npy"
RECORDS_PATH = EMBEDDINGS_DIR / "embedding-records.jsonl"
MANIFEST_PATH = EMBEDDINGS_DIR / "embedding-manifest.json"
OUTPUT_DIR = RAG_DIR / "retrieval-v3"
TEMP_OUTPUT_DIR = RAG_DIR / ".retrieval-v3.tmp"
TEST_RESULTS_DIR = OUTPUT_DIR / "test-results"
CONFIG_PATH = OUTPUT_DIR / "retrieval-config.json"
REPORT_PATH = OUTPUT_DIR / "retrieval-validation-report.txt"
LATEST_RESULTS_PATH = TEST_RESULTS_DIR / "latest-results.json"

RETRIEVAL_SCHEMA_VERSION = "3.0.0"
EXPECTED_EMBEDDING_SCHEMA_MAJOR = "3"
EXPECTED_DOCUMENT_SCHEMA_MAJOR = "2"
EXPECTED_PIPELINE_STEP = 3
PROVIDER = "local-sentence-transformers"
EMBEDDING_MODEL = "nomic-ai/nomic-embed-text-v1.5"
EMBEDDING_MODEL_REVISION = "e9b6763023c676ca8431644204f50c2b100d9aab"
NATIVE_DIMENSIONS, EMBEDDING_DIMENSIONS, MAX_SEQUENCE_LENGTH = 768, 512, 8192
QUERY_PREFIX, DOCUMENT_PREFIX, DTYPE_NAME = "search_query: ", "search_document: ", "float32"
RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L6-v2"
RERANKER_MODEL_REVISION = "4bebbd56fc380a66525f95b03d4ec1a4b41a4f1e"
RERANKER_CPU_BATCH, RERANKER_GPU_BATCH = 16, 64
DENSE_CANDIDATES, BM25_CANDIDATES, METADATA_CANDIDATES = 500, 500, 400
PRE_GATE_LIMIT, RERANK_CANDIDATES, TOP_K = 800, 120, 10
MAX_RESULTS_PER_REPOSITORY, RRF_K, SEMANTIC_DUPLICATE_THRESHOLD = 2, 60.0, 0.955
WEIGHT_CROSS, WEIGHT_DENSE, WEIGHT_BM25, WEIGHT_METADATA, WEIGHT_RRF, WEIGHT_EVIDENCE = 0.64, 0.10, 0.07, 0.06, 0.04, 0.09
UNIT_NORM_TOLERANCE, SELF_TEST_SAMPLE_COUNT, DISPLAY_TEXT_CHARS = 1e-4, 32, 1200
np = torch = F = SentenceTransformer = CrossEncoder = None

class PipelineError(RuntimeError): pass

def utc_now(): return datetime.now(timezone.utc).isoformat()
def local_stamp(): return datetime.now().strftime("%Y%m%d-%H%M%S")
def rel(path: Path):
    try: return str(path.relative_to(BASE_DIR))
    except ValueError: return str(path)
def sha256_file(path: Path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(1024*1024),b""): h.update(block)
    return h.hexdigest()
def sha256_text(text: str): return hashlib.sha256(text.encode("utf-8")).hexdigest()
def load_json(path: Path):
    try: obj=json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc: raise PipelineError(f"Could not read JSON {rel(path)}: {exc}") from exc
    if not isinstance(obj,dict): raise PipelineError(f"Expected a JSON object in {rel(path)}")
    return obj
def load_jsonl(path: Path):
    rows=[]
    try:
        with path.open("r",encoding="utf-8-sig") as f:
            for line_no,line in enumerate(f,1):
                if not line.strip(): continue
                obj=json.loads(line)
                if not isinstance(obj,dict): raise PipelineError(f"Line {line_no} of {rel(path)} is not a JSON object")
                rows.append(obj)
    except PipelineError: raise
    except Exception as exc: raise PipelineError(f"Could not read JSONL {rel(path)}: {exc}") from exc
    if not rows: raise PipelineError(f"Input is empty: {rel(path)}")
    return rows
def write_json(path: Path,obj:Any):
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open("w",encoding="utf-8",newline="\n") as f: json.dump(obj,f,ensure_ascii=False,indent=2,sort_keys=True); f.write("\n")
def append_jsonl(path: Path,obj:dict[str,Any]):
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open("a",encoding="utf-8",newline="\n") as f:
        f.write(json.dumps(obj,ensure_ascii=False,separators=(",",":"))+"\n"); f.flush()
        try: os.fsync(f.fileno())
        except OSError: pass
def package_version(name:str):
    try:return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:return "unknown"
def minmax(values:dict[int,float]):
    if not values:return {}
    lo,hi=min(values.values()),max(values.values())
    if hi-lo<=1e-12:return {k:1.0 for k in values}
    return {k:(v-lo)/(hi-lo) for k,v in values.items()}
def clamp01(x):return max(0.0,min(1.0,float(x)))

def load_dependencies():
    global np,torch,F,SentenceTransformer,CrossEncoder
    try:
        import numpy as _np, torch as _torch
        import torch.nn.functional as _F
        from sentence_transformers import SentenceTransformer as _ST, CrossEncoder as _CE
    except Exception as exc: raise PipelineError("Required packages missing. Install: python -m pip install -U numpy sentence-transformers torch\n"+str(exc)) from exc
    np,torch,F,SentenceTransformer,CrossEncoder=_np,_torch,_F,_ST,_CE
    return {"numpy":package_version("numpy"),"torch":package_version("torch"),"sentence-transformers":package_version("sentence-transformers"),"transformers":package_version("transformers")}
def select_device():
    if torch.cuda.is_available():
        try:return "cuda",torch.cuda.get_device_name(0)
        except Exception:return "cuda","CUDA GPU"
    mps=getattr(torch.backends,"mps",None)
    if mps is not None and mps.is_available():return "mps","Apple Metal Performance Shaders"
    return "cpu","CPU"
def load_embedding_model(device):
    try:
        model=SentenceTransformer(EMBEDDING_MODEL,revision=EMBEDDING_MODEL_REVISION,device=device,trust_remote_code=False); model.eval()
    except Exception as exc: raise PipelineError(f"Could not load pinned local Nomic model: {exc}") from exc
    dim=int(model.get_sentence_embedding_dimension())
    if dim!=NATIVE_DIMENSIONS: raise PipelineError(f"Nomic native dimension {dim}; expected {NATIVE_DIMENSIONS}")
    max_seq=int(getattr(model,"max_seq_length",0) or 0)
    if max_seq!=MAX_SEQUENCE_LENGTH: raise PipelineError(f"Nomic max sequence {max_seq}; expected {MAX_SEQUENCE_LENGTH}")
    return model
def load_reranker(device):
    try:return CrossEncoder(RERANKER_MODEL,revision=RERANKER_MODEL_REVISION,device=device,trust_remote_code=False)
    except Exception as exc: raise PipelineError(f"Could not load pinned local CrossEncoder: {exc}") from exc
def embed_query(model,query):
    model_input=QUERY_PREFIX+query.strip(); ids=model.tokenizer(model_input,add_special_tokens=True,truncation=False).get("input_ids",[]); token_count=len(ids)
    if token_count>MAX_SEQUENCE_LENGTH: raise PipelineError(f"Query is {token_count} tokens; maximum is {MAX_SEQUENCE_LENGTH}.")
    with torch.inference_mode():
        full=model.encode([model_input],batch_size=1,show_progress_bar=False,convert_to_tensor=True,normalize_embeddings=False)
        if full.ndim!=2 or int(full.shape[1])!=NATIVE_DIMENSIONS: raise PipelineError(f"Unexpected query embedding shape: {tuple(full.shape)}")
        x=F.layer_norm(full,normalized_shape=(full.shape[1],)); x=F.normalize(x[:,:EMBEDDING_DIMENSIONS],p=2,dim=1); vec=x[0].detach().cpu().to(torch.float32).numpy()
    if vec.shape!=(EMBEDDING_DIMENSIONS,) or not np.isfinite(vec).all(): raise PipelineError("Invalid runtime query vector")
    return np.asarray(vec,dtype=np.float32),token_count

def validate_manifest(manifest):
    if int(manifest.get("pipeline_step",-1))!=EXPECTED_PIPELINE_STEP: raise PipelineError("Embedding manifest pipeline_step is not 3")
    schema=str(manifest.get("embedding_schema_version",""))
    if schema and schema.split(".",1)[0]!=EXPECTED_EMBEDDING_SCHEMA_MAJOR: raise PipelineError(f"Embedding schema {schema!r} does not match expected major {EXPECTED_EMBEDDING_SCHEMA_MAJOR}")
    emb=manifest.get("embedding") or {}
    checks={"model":(emb.get("model"),EMBEDDING_MODEL),"model_revision":(emb.get("model_revision"),EMBEDDING_MODEL_REVISION),"native_dimensions":(int(emb.get("native_dimensions",-1)),NATIVE_DIMENSIONS),"stored_dimensions":(int(emb.get("stored_dimensions",-1)),EMBEDDING_DIMENSIONS),"runtime_query_prefix":(emb.get("runtime_query_prefix"),QUERY_PREFIX)}
    bad=[f"{k}: {a!r} != {b!r}" for k,(a,b) in checks.items() if a!=b]
    if bad:raise PipelineError("Vector-space identity mismatch: "+"; ".join(bad))
def verify_artifact_hashes(manifest):
    artifacts=manifest.get("artifacts") or {}; em=(artifacts.get("embeddings.npy") or {}).get("sha256"); er=(artifacts.get("embedding-records.jsonl") or {}).get("sha256")
    if em and sha256_file(MATRIX_PATH)!=em:raise PipelineError("embeddings.npy SHA-256 does not match manifest")
    if er and sha256_file(RECORDS_PATH)!=er:raise PipelineError("embedding-records.jsonl SHA-256 does not match manifest")
def validate_matrix_records(matrix,records):
    if matrix.dtype!=np.float32:raise PipelineError(f"Matrix dtype {matrix.dtype}; expected float32")
    if matrix.shape!=(len(records),EMBEDDING_DIMENSIONS):raise PipelineError(f"Matrix shape {matrix.shape}; expected ({len(records)}, {EMBEDDING_DIMENSIONS})")
    if not np.isfinite(matrix).all():raise PipelineError("Matrix contains NaN/Inf")
    norms=np.linalg.norm(matrix.astype(np.float64),axis=1)
    if np.any(norms<=0) or float(np.max(np.abs(norms-1.0)))>UNIT_NORM_TOLERANCE:raise PipelineError("Matrix vector normalization invalid")
    ids=set(); repos=set(); classes=Counter(); areas=Counter(); levels=Counter(); polarities=Counter()
    for i,r in enumerate(records):
        if int(r.get("vector_index",-1))!=i:raise PipelineError(f"vector_index mismatch at row {i}")
        did=str(r.get("document_id") or "").strip()
        if not did or did in ids:raise PipelineError(f"Missing/duplicate document_id at row {i}: {did}")
        ids.add(did); schema=str(r.get("document_schema_version",""))
        if schema.split(".",1)[0]!=EXPECTED_DOCUMENT_SCHEMA_MAJOR:raise PipelineError(f"Unexpected document schema for {did}: {schema}")
        text=str(r.get("text") or "")
        if not text.strip():raise PipelineError(f"Empty authoritative text in {did}")
        expected_hash=(r.get("provenance") or {}).get("document_text_sha256")
        if expected_hash and sha256_text(text)!=expected_hash:raise PipelineError(f"Authoritative text SHA-256 mismatch in {did}")
        repos.add(int(r.get("repository_index",0))); classes[str(r.get("retrieval_class") or "unknown")]+=1; areas[str(r.get("semantic_area") or "unknown")]+=1; levels[str(r.get("evidence_level") or "unknown")]+=1; polarities[str(r.get("evidence_polarity") or "unknown")]+=1
    declared={int(r.get("repository_total",0)) for r in records}; repo_total=next(iter(declared)) if len(declared)==1 else 0
    if len(declared)!=1 or repos!=set(range(1,repo_total+1)):raise PipelineError("Repository coverage mismatch")
    return {"documents":len(records),"repositories":len(repos),"repository_total":repo_total,"retrieval_classes":dict(classes),"semantic_areas":dict(areas),"evidence_levels":dict(levels),"polarities":dict(polarities),"norm_min":float(norms.min()),"norm_median":float(np.median(norms)),"norm_max":float(norms.max())}
def exact_search_self_test(matrix):
    count=min(SELF_TEST_SAMPLE_COUNT,matrix.shape[0]); positions=np.linspace(0,matrix.shape[0]-1,count,dtype=int); failures=0; min_self=1.0
    for idx in positions:
        sims=matrix@matrix[idx]; min_self=min(min_self,float(sims[idx]))
        if int(np.argmax(sims))!=int(idx) and abs(float(sims[idx])-float(np.max(sims)))>1e-6:failures+=1
    if failures:raise PipelineError(f"Exact cosine self-test failures: {failures}")
    return {"samples":count,"failures":failures,"min_self_similarity":min_self}

TOKEN_RE=re.compile(r"[A-Za-z0-9][A-Za-z0-9+#._/-]*")
STOPWORDS={"a","an","and","are","as","at","be","been","being","by","can","could","did","do","does","for","from","had","has","have","he","her","his","how","i","in","into","is","it","its","me","of","on","or","our","show","shows","that","the","their","them","there","these","they","this","to","was","we","were","what","when","where","which","who","why","will","with","would","candidate","evidence","experience","experiences","project","projects","repository","repositories"}
def normalize_token(token):
    t=token.casefold().strip("._/-")
    if len(t)>5 and t.endswith("ies"):t=t[:-3]+"y"
    elif len(t)>5 and t.endswith("ing"):t=t[:-3]
    elif len(t)>4 and t.endswith("ed"):t=t[:-2]
    elif len(t)>4 and t.endswith("s") and not t.endswith("ss"):t=t[:-1]
    return t
def tokens(text):return [t for raw in TOKEN_RE.findall(text or "") if len((t:=normalize_token(raw)))>=2 and t not in STOPWORDS]
def skill_names(record):
    return [str(row.get("skill") or row.get("name") or "").strip() for row in record.get("related_skill_ratings") or [] if isinstance(row,dict) and str(row.get("skill") or row.get("name") or "").strip()]
def metadata_text(record):
    cls=record.get("classification_summary") or {}; tech=str(cls.get("technical_realm") or "") if isinstance(cls,dict) else ""
    return "\n".join([str(record.get("repository_name") or ""),str(record.get("semantic_area") or "").replace("_"," "),str(record.get("retrieval_class") or "").replace("_"," "),str(record.get("evidence_level") or "").replace("_"," "),tech," ".join(map(str,record.get("topics") or []))," ".join(map(str,record.get("evidence_areas") or []))," ".join(skill_names(record))])
@dataclass
class LexicalIndex:
    doc_tf:list[Counter[str]]; doc_len:list[float]; doc_freq:Counter[str]; avg_len:float; meta_tf:list[Counter[str]]; meta_freq:Counter[str]; repeated_source_penalty:list[float]
def build_lexical_index(records):
    doc_tf=[]; meta_tf=[]; doc_len=[]; df=Counter(); mdf=Counter(); penalties=[]
    for r in records:
        tf=Counter(tokens(str(r.get("text") or "")))
        for values,mult in [(r.get("topics") or [],3),(r.get("evidence_areas") or [],2),(skill_names(r),4),([str(r.get("semantic_area") or "").replace("_"," ")],3)]:
            for value in values:
                for t in tokens(str(value)):tf[t]+=mult
        doc_tf.append(tf); dl=max(1.0,float(sum(tf.values()))); doc_len.append(dl)
        for t in tf:df[t]+=1
        mtf=Counter(tokens(metadata_text(r)));meta_tf.append(mtf)
        for t in mtf:mdf[t]+=1
        freqs=[]
        for sf in r.get("source_fragments") or []:
            if isinstance(sf,dict):
                try:freqs.append(int(sf.get("template_repository_frequency") or 0))
                except Exception:pass
        high=max(freqs) if freqs else 0;penalties.append(min(0.18,max(0,high-4)*0.012))
    return LexicalIndex(doc_tf,doc_len,df,sum(doc_len)/max(1,len(doc_len)),meta_tf,mdf,penalties)
def bm25_scores(index,query_terms,n_docs):
    scores=defaultdict(float);qtf=Counter(query_terms);k1,b=1.5,0.72
    for term,qcount in qtf.items():
        df=index.doc_freq.get(term,0)
        if df<=0:continue
        idf=math.log(1.0+(n_docs-df+0.5)/(df+0.5))
        for i,tf in enumerate(index.doc_tf):
            f=float(tf.get(term,0))
            if f<=0:continue
            denom=f+k1*(1-b+b*index.doc_len[i]/index.avg_len);scores[i]+=idf*((f*(k1+1))/denom)*(1+0.08*min(qcount-1,2))
    return dict(scores)
def metadata_scores(index,query_terms,n_docs):
    scores=defaultdict(float)
    for term in set(query_terms):
        df=index.meta_freq.get(term,0)
        if not df:continue
        idf=math.log(1.0+n_docs/(1.0+df))
        for i,tf in enumerate(index.meta_tf):
            f=tf.get(term,0)
            if f:scores[i]+=idf*min(float(f),4.0)
    return dict(scores)
def top_indices_from_array(values,k):
    n=int(values.shape[0]); idx=np.argsort(-values,kind="stable") if k>=n else (lambda part:part[np.argsort(-values[part],kind="stable")])(np.argpartition(values,n-k)[n-k:]);return [int(x) for x in idx[:k]]
def top_indices_from_dict(values,k):return [i for i,_ in sorted(values.items(),key=lambda x:(-x[1],x[0]))[:k]]
def reciprocal_rank_fusion(rankings):
    out=defaultdict(float)
    for ranking in rankings:
        for rank,idx in enumerate(ranking,1):out[int(idx)]+=1.0/(RRF_K+rank)
    return dict(out)

@dataclass(frozen=True)
class FacetSpec:name:str;semantic_area:str;phrases:tuple[str,...];concept_terms:tuple[str,...]
FACETS=(
FacetSpec("authorization_access","identity_access_security",("authorization","access control","iam","rbac","permissions","permission","role based","roles","session","signed session","admin route","identity","authentication"),("authorization","authorize","access","control","iam","rbac","permission","role","session","identity","authentication","authenticate","jwt","admin")),
FacetSpec("security_privacy","identity_access_security",("security","privacy","trust boundary","secure","threat"),("security","privacy","secure","threat","trust","credential","secret","encryption","hash")),
FacetSpec("testing_quality","testing_quality",("testing","test","unit test","integration test","end to end","e2e","coverage","quality assurance","verification"),("test","testing","unit","integration","e2e","coverage","verification","quality","vitest","playwright","pytest")),
FacetSpec("backend_api","architecture_system_design",("backend","api","server","service","database","distributed system","system design","architecture"),("backend","api","server","service","database","distributed","architecture","endpoint","rest","worker","hono","spring")),
FacetSpec("deployment_operations","deployment_operations",("deployment","deploy","ci/cd","ci cd","devops","cloud","hosting","observability","operations"),("deployment","deploy","ci","cd","devops","cloud","hosting","observability","docker","workflow","pipeline")),
FacetSpec("product_ownership","product_responsibility",("product ownership","product owner","stakeholder","requirements","ownership","users","business"),("product","owner","ownership","stakeholder","requirement","user","business","roadmap","scope","decision")),
FacetSpec("performance_scale","performance_scale",("performance","scale","scalability","latency","throughput","optimization","load"),("performance","scale","scalability","latency","throughput","optimization","load","benchmark","million")),
FacetSpec("engineering_judgment","engineering_judgment",("tradeoff","trade-off","engineering judgment","decision","maintainability","modularity"),("tradeoff","decision","judgment","maintainability","modularity","design","refactor")),
FacetSpec("authorship_provenance","authorship_provenance",("authorship","authored","contribution","contributed","provenance","built himself","implemented himself"),("authorship","authored","contribution","contributed","provenance","implemented","built")),)
LIMITATION_TERMS=("weakest","weakness","weaknesses","limitation","limitations","gap","gaps","missing","lack","lacks","does not prove","doesn't prove","not prove","risk","risks","concern","concerns","problem","problems","debt","failure","failures")
CHRONOLOGY_TERMS=("over time","evolved","evolution","history","historical","trajectory","progressed","progression","first","earliest","latest","recent","recently","timeline","chronology")
STRONGEST_TERMS=("strongest","best","most convincing","most sophisticated","top evidence")
@dataclass
class QueryIntent:
    raw:str;base_tokens:list[str];expanded_tokens:list[str];limitation_query:bool;chronology_query:bool;positive_evidence_query:bool;strongest_query:bool;facets:list[FacetSpec]=field(default_factory=list);requested_repository_indexes:set[int]=field(default_factory=set);requested_repository_names:set[str]=field(default_factory=set)
def phrase_present(low,phrase):
    p=phrase.casefold();return p in low if " " in p or "/" in p or "-" in p else re.search(rf"(?<![a-z0-9]){re.escape(p)}(?![a-z0-9])",low) is not None
def analyze_query(query,records):
    low=query.casefold().strip();base=tokens(query);limitation=any(t in low for t in LIMITATION_TERMS);chronology=any(t in low for t in CHRONOLOGY_TERMS);strongest=any(t in low for t in STRONGEST_TERMS)
    scored=[]
    for facet in FACETS:
        matches=[p for p in facet.phrases if phrase_present(low,p)];score=sum(3 if " " in p or len(p)>=8 else 2 for p in matches)
        if score:scored.append((score,facet,matches))
    scored.sort(key=lambda x:(-x[0],x[1].name));facets=[]
    if scored:
        max_score=scored[0][0];specific={f.name for _,f,_ in scored if f.name not in {"backend_api","security_privacy"}}
        for score,facet,matches in scored:
            if score<max(2,max_score-2):continue
            if facet.name=="backend_api" and specific and set(matches).issubset({"architecture","system design","server","service"}):continue
            if facet.name=="security_privacy" and ("authorization_access" in specific or any(f.name=="authorization_access" for f in facets)):continue
            facets.append(facet)
            if len(facets)>=2:break
    expanded=list(base)
    for facet in facets:expanded.extend(normalize_token(x) for x in facet.concept_terms)
    if limitation:expanded.extend(["limitation","missing","weakness","risk","not","absent"])
    if chronology:expanded.extend(["timeline","evolution","chronology","progression","earliest","latest"])
    expanded=list(dict.fromkeys(t for t in expanded if t and len(t)>=2))[:48]
    requested_idx={int(x) for x in re.findall(r"\brepo(?:sitory)?\s*#?\s*(\d{1,3})\b",low)};requested_names=set()
    for r in records:
        name=str(r.get("repository_name") or "").casefold()
        if len(name)>=4 and name in low:requested_names.add(name)
    return QueryIntent(query,base,expanded,limitation,chronology,not limitation,strongest,facets,requested_idx,requested_names)
def record_searchable_text(r):return (str(r.get("text") or "")+"\n"+metadata_text(r)).casefold()
def concept_gate(record,intent):
    if not intent.facets:return True,1.0,{"reason":"no-specific-facet","matched_facets":[]}
    searchable=record_searchable_text(record);meta=metadata_text(record).casefold();area=str(record.get("semantic_area") or "");matched=[];best=0.0
    for facet in intent.facets:
        hits=[t for t in facet.concept_terms if phrase_present(searchable,t)];meta_hits=[t for t in facet.concept_terms if phrase_present(meta,t)];area_match=area==facet.semantic_area
        if hits:
            score=min(1.0,0.44+0.10*min(len(set(hits)),4)+(0.18 if area_match else 0)+(0.06 if meta_hits else 0));matched.append({"facet":facet.name,"semantic_area_match":area_match,"concept_hits":sorted(set(hits))[:12],"metadata_hits":sorted(set(meta_hits))[:12],"score":round(score,4)});best=max(best,score)
    return best>=0.54,best,{"reason":"matched" if best>=0.54 else "primary-concept-missing","matched_facets":matched}
LEVEL_BASE={"implemented_or_concrete":1.0,"repository_specific":0.86,"repository_limitation":0.66,"interpretive":0.58,"methodology_or_interpretive":0.38,"conceptual_exposure":0.32,"methodology_template":0.10}
def evidence_quality(record,intent,repeated_penalty):
    level=str(record.get("evidence_level") or "");rclass=str(record.get("retrieval_class") or "");polarity=str(record.get("evidence_polarity") or "neutral");base=LEVEL_BASE.get(level,0.48)
    try:specificity=clamp01(float(record.get("specificity_score") or 0))
    except Exception:specificity=0
    try:concrete=max(0,int(record.get("concrete_signal_count") or 0))
    except Exception:concrete=0
    score=0.58*base+0.22*specificity+0.20*min(1.0,concrete/6);adj={}
    if intent.limitation_query:
        if rclass=="limitation":adj["limitation_class_bonus"]=0.16
        if polarity in {"negative","mixed"}:adj["negative_evidence_bonus"]=0.12
    else:
        if rclass=="direct_evidence":adj["direct_evidence_bonus"]=0.12
        elif rclass=="limitation":adj["limitation_penalty"]=-0.24
        elif rclass=="metadata":adj["metadata_penalty"]=-0.12
        if polarity=="positive":adj["positive_polarity_bonus"]=0.08
        elif polarity=="negative":adj["negative_polarity_penalty"]=-0.22
        elif polarity=="mixed":adj["mixed_polarity_penalty"]=-0.05
        if level in {"conceptual_exposure","methodology_or_interpretive","methodology_template"}:adj["weak_evidence_penalty"]=-0.16
    if intent.chronology_query and rclass=="chronology":adj["chronology_bonus"]=0.14
    elif not intent.chronology_query and rclass=="chronology":adj["chronology_off_intent_penalty"]=-0.05
    adj["repeated_source_penalty"]=-repeated_penalty;score=clamp01(score+sum(adj.values()))
    return score,{"evidence_level":level,"retrieval_class":rclass,"evidence_polarity":polarity,"specificity_score":specificity,"concrete_signal_count":concrete,"base_level_score":base,"adjustments":adj,"final_evidence_quality":score}
def positive_evidence_eligible(record,cross,intent):
    if intent.limitation_query:return True
    polarity=str(record.get("evidence_polarity") or "neutral");rclass=str(record.get("retrieval_class") or "");level=str(record.get("evidence_level") or "")
    if polarity=="negative" or rclass=="limitation":return cross>=0.92
    if level=="methodology_template":return cross>=0.95
    return True
def source_section_labels(record):
    out=[]
    for sf in record.get("source_fragments") or []:
        if not isinstance(sf,dict):continue
        path=sf.get("section_path");label=" > ".join(map(str,path)) if isinstance(path,list) and path else str(sf.get("section_title") or "")
        if label and label not in out:out.append(label)
    return out
def build_rerank_passage(r):return f"Repository: {r.get('repository_name')} (#{int(r.get('repository_index',0)):03d})\nEvidence class: {r.get('retrieval_class')}\nEvidence polarity: {r.get('evidence_polarity')}\nEvidence level: {r.get('evidence_level')}\nSemantic area: {r.get('semantic_area')}\nTopics: {', '.join(map(str,r.get('topics') or []))}\nRelated skills: {', '.join(skill_names(r))}\nSource sections: {'; '.join(source_section_labels(r)[:6])}\nRepository evidence:\n{r.get('text','')}"
def cross_encoder_scores(reranker,query,candidates,records,device):
    if not candidates:return {}
    pairs=[(query,build_rerank_passage(records[i])) for i in candidates];batch=RERANKER_GPU_BATCH if device=="cuda" else RERANKER_CPU_BATCH
    with torch.inference_mode():
        try:values=reranker.predict(pairs,batch_size=batch,show_progress_bar=False,convert_to_numpy=True)
        except TypeError:values=reranker.predict(pairs,batch_size=batch,show_progress_bar=False)
    arr=np.asarray(values,dtype=np.float32).reshape(-1)
    if arr.shape[0]!=len(candidates) or not np.isfinite(arr).all():raise PipelineError("CrossEncoder returned invalid scores")
    out={}
    for pos,idx in enumerate(candidates):
        raw=float(arr[pos]);out[idx]=clamp01(raw if 0<=raw<=1 else 1/(1+math.exp(-max(-40,min(40,raw)))))
    return out
def requested_repo_match(r,intent):
    if not intent.requested_repository_indexes and not intent.requested_repository_names:return True
    return int(r.get("repository_index",0)) in intent.requested_repository_indexes or str(r.get("repository_name") or "").casefold() in intent.requested_repository_names
def provenance_label(record):
    frags=[sf for sf in record.get("source_fragments") or [] if isinstance(sf,dict)]
    if not frags:
        p=record.get("provenance") or {};f=p.get("analysis_source_file") or "unknown";line=p.get("earliest_source_line");return f+ (f" around line {line}" if line else "")
    by_file=defaultdict(list)
    for sf in frags:
        try:by_file[str(sf.get("source_file") or "unknown")].append((int(sf.get("source_line_start")),int(sf.get("source_line_end"))))
        except Exception:pass
    return "; ".join(f"{f} lines {min(a for a,_ in ranges)}-{max(b for _,b in ranges)}" if ranges else f for f,ranges in by_file.items())

def retrieve(query,matrix,records,lexical,embedding_model,reranker,device):
    intent=analyze_query(query,records);qvec,token_count=embed_query(embedding_model,query);dense_all=matrix@qvec
    dense_rank=top_indices_from_array(dense_all,min(DENSE_CANDIDATES,len(records)));bm_all=bm25_scores(lexical,intent.expanded_tokens,len(records));bm_rank=top_indices_from_dict(bm_all,min(BM25_CANDIDATES,len(records)));meta_all=metadata_scores(lexical,intent.expanded_tokens,len(records));meta_rank=top_indices_from_dict(meta_all,min(METADATA_CANDIDATES,len(records)));rrf_all=reciprocal_rank_fusion([dense_rank,bm_rank,meta_rank]);union=set(dense_rank)|set(bm_rank)|set(meta_rank)
    filt=[i for i in union if requested_repo_match(records[i],intent)]
    if (intent.requested_repository_indexes or intent.requested_repository_names) and filt:union=set(filt)
    gate_info={};quality_info={};gated=[]
    for i in union:
        passed,facet_score,details=concept_gate(records[i],intent);gate_info[i]={"passed":passed,"facet_score":facet_score,**details};quality_info[i]=evidence_quality(records[i],intent,lexical.repeated_source_penalty[i]);
        if passed:gated.append(i)
    gate_fallback=False
    if len(gated)<min(20,max(5,len(union)//20)) and intent.facets:
        gate_fallback=True;gated=sorted(union,key=lambda i:(-gate_info[i]["facet_score"],-float(dense_all[i]),i))[:min(PRE_GATE_LIMIT,max(40,len(gated)))]
    else:gated=sorted(gated,key=lambda i:(-rrf_all.get(i,0),-float(dense_all[i]),i))[:PRE_GATE_LIMIT]
    d=minmax({i:float(dense_all[i]) for i in gated});b=minmax({i:float(bm_all.get(i,0)) for i in gated});m=minmax({i:float(meta_all.get(i,0)) for i in gated});r=minmax({i:float(rrf_all.get(i,0)) for i in gated})
    pre=[]
    for i in gated:pre.append((i,0.31*d.get(i,0)+0.22*b.get(i,0)+0.16*m.get(i,0)+0.16*r.get(i,0)+0.10*quality_info[i][0]+0.05*gate_info[i]["facet_score"]))
    pre.sort(key=lambda x:(-x[1],x[0]));pool=[i for i,_ in pre[:min(RERANK_CANDIDATES,len(pre))]];pre_map=dict(pre);cross=cross_encoder_scores(reranker,query,pool,records,device)
    dn=minmax({i:float(dense_all[i]) for i in pool});bn=minmax({i:float(bm_all.get(i,0)) for i in pool});mn=minmax({i:float(meta_all.get(i,0)) for i in pool});rn=minmax({i:float(rrf_all.get(i,0)) for i in pool});ranked=[]
    for i in pool:
        c=cross[i];score=WEIGHT_CROSS*c+WEIGHT_DENSE*dn.get(i,0)+WEIGHT_BM25*bn.get(i,0)+WEIGHT_METADATA*mn.get(i,0)+WEIGHT_RRF*rn.get(i,0)+WEIGHT_EVIDENCE*quality_info[i][0]+0.025*gate_info[i]["facet_score"]
        comp={"cross_encoder":c,"dense_cosine_raw":float(dense_all[i]),"bm25_raw":float(bm_all.get(i,0)),"metadata_raw":float(meta_all.get(i,0)),"concept_gate":gate_info[i],"evidence_quality":quality_info[i][1],"pre_rerank_score":pre_map[i]};ranked.append((i,score,comp))
    ranked.sort(key=lambda x:(-x[1],-x[2]["cross_encoder"],x[0]));eligible=[x for x in ranked if positive_evidence_eligible(records[x[0]],x[2]["cross_encoder"],intent)]
    if len(eligible)<TOP_K:
        used={x[0] for x in eligible};eligible.extend(x for x in ranked if x[0] not in used)
    selected=[];per_repo=Counter();limit=1 if intent.chronology_query else MAX_RESULTS_PER_REPOSITORY
    for item in eligible:
        i=item[0];repo=int(records[i].get("repository_index",0))
        if per_repo[repo]>=limit:continue
        if any(float(matrix[i]@matrix[a])>=SEMANTIC_DUPLICATE_THRESHOLD for a,_,_ in selected):continue
        selected.append(item);per_repo[repo]+=1
        if len(selected)>=TOP_K:break
    if len(selected)<TOP_K:
        used={x[0] for x in selected}
        for item in eligible:
            if item[0] not in used:selected.append(item)
            if len(selected)>=TOP_K:break
    results=[]
    for rank,(i,score,comp) in enumerate(selected,1):
        rr=records[i];results.append({"rank":rank,"final_score":float(score),"vector_index":i,"document_id":rr.get("document_id"),"repository_index":int(rr.get("repository_index",0)),"repository_name":rr.get("repository_name"),"repository_url":rr.get("repository_url"),"retrieval_class":rr.get("retrieval_class"),"semantic_area":rr.get("semantic_area"),"evidence_polarity":rr.get("evidence_polarity"),"evidence_level":rr.get("evidence_level"),"specificity_score":rr.get("specificity_score"),"concrete_signal_count":rr.get("concrete_signal_count"),"topics":rr.get("topics") or [],"related_skill_ratings":rr.get("related_skill_ratings") or [],"evidence_areas":rr.get("evidence_areas") or [],"text":rr.get("text") or "","source_fragments":rr.get("source_fragments") or [],"provenance":rr.get("provenance") or {},"provenance_label":provenance_label(rr),"score_components":comp})
    diagnostics={"query":query,"query_tokens":token_count,"intent":{"base_tokens":intent.base_tokens,"expanded_tokens":intent.expanded_tokens,"limitation_query":intent.limitation_query,"chronology_query":intent.chronology_query,"strongest_query":intent.strongest_query,"facets":[{"name":f.name,"semantic_area":f.semantic_area} for f in intent.facets]},"candidate_counts":{"dense":len(dense_rank),"bm25":len(bm_rank),"metadata":len(meta_rank),"union":len(union),"passed_primary_concept_gate":sum(1 for x in gate_info.values() if x["passed"]),"gate_fallback_used":gate_fallback,"cross_encoder":len(pool),"final":len(results)}}
    return results,diagnostics

def run_query_logic_self_tests():
    fake=[{"repository_index":1,"repository_name":"AuthApp","semantic_area":"identity_access_security","retrieval_class":"direct_evidence","evidence_polarity":"positive","evidence_level":"implemented_or_concrete","text":"Admin endpoints require a valid signed session and role permission. Authorization is enforced server-side.","topics":["authorization"],"evidence_areas":[],"related_skill_ratings":[]},{"repository_index":2,"repository_name":"GAN","semantic_area":"architecture_system_design","retrieval_class":"interpretation","evidence_polarity":"negative","evidence_level":"repository_limitation","text":"No executable architecture exists. Architecture skill remains unscored.","topics":["architecture"],"evidence_areas":[],"related_skill_ratings":[]}]
    q=analyze_query("What evidence shows experience with authorization architecture?",fake);p1=concept_gate(fake[0],q)[0];p2=concept_gate(fake[1],q)[0];q2=analyze_query("What are the candidate's weakest engineering areas?",fake);tests=[("authorization concrete passes",p1),("generic architecture fails authorization gate",not p2),("weakness query detected",q2.limitation_query),("generic weakness query has no forced technical facet",len(q2.facets)==0)];fail=[n for n,p in tests if not p]
    if fail:raise PipelineError("Query/evidence gate self-test failed: "+", ".join(fail))
    return {"tests":len(tests),"failures":0,"passed":[n for n,_ in tests]}
def make_config(corpus,deps,device,device_name):return {"retrieval_schema_version":RETRIEVAL_SCHEMA_VERSION,"pipeline_step":4,"generated_at_utc":utc_now(),"script":SCRIPT_NAME,"cost":{"paid_api_used":False,"api_key_required":False,"retrieval_cost_usd":0,"model_training":False},"input":{"vectors":rel(MATRIX_PATH),"records":rel(RECORDS_PATH),"manifest":rel(MANIFEST_PATH),"matrix_sha256":sha256_file(MATRIX_PATH),"records_sha256":sha256_file(RECORDS_PATH),"documents":corpus["documents"],"repositories":corpus["repositories"]},"embedding":{"model":EMBEDDING_MODEL,"revision":EMBEDDING_MODEL_REVISION,"native_dimensions":NATIVE_DIMENSIONS,"stored_dimensions":EMBEDDING_DIMENSIONS,"query_prefix":QUERY_PREFIX,"transform":"layer_norm -> first 512 -> L2 normalize","dense_similarity":"exact cosine"},"retrieval":{"architecture":"dense + BM25 + metadata -> RRF -> primary-concept gate -> evidence-quality -> CrossEncoder -> polarity gate -> diversity","dense_candidates":DENSE_CANDIDATES,"bm25_candidates":BM25_CANDIDATES,"metadata_candidates":METADATA_CANDIDATES,"cross_encoder_candidates":RERANK_CANDIDATES,"top_k":TOP_K,"rrf_k":RRF_K,"max_results_per_repository":MAX_RESULTS_PER_REPOSITORY,"semantic_duplicate_threshold":SEMANTIC_DUPLICATE_THRESHOLD,"final_weights":{"cross_encoder":WEIGHT_CROSS,"dense":WEIGHT_DENSE,"bm25":WEIGHT_BM25,"metadata":WEIGHT_METADATA,"rrf":WEIGHT_RRF,"evidence_quality":WEIGHT_EVIDENCE},"primary_concept_gate":True,"query_aware_polarity_gate":True,"negative_evidence_deleted":False},"reranker":{"model":RERANKER_MODEL,"revision":RERANKER_MODEL_REVISION,"device":device,"device_name":device_name},"dependencies":deps,"corpus_profile":corpus}
def publish_initialization(config,selftest,qtest):
    if TEMP_OUTPUT_DIR.exists():shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True);text=f"Portfolio GitHub RAG — Step 4 v3 retrieval validation report\nSTATUS: STEP 4 v3 INITIALIZATION: SUCCESS\nDocuments: {config['corpus_profile']['documents']}\nRepositories: {config['corpus_profile']['repositories']}/{config['corpus_profile']['repository_total']}\nExact-search self-test: PASS ({selftest['samples']})\nQuery/evidence tests: PASS ({qtest['tests']})\n"
    write_json(TEMP_OUTPUT_DIR/"retrieval-config.json",config);(TEMP_OUTPUT_DIR/"retrieval-validation-report.txt").write_text(text,encoding="utf-8")
    OUTPUT_DIR.mkdir(parents=True,exist_ok=True);TEST_RESULTS_DIR.mkdir(parents=True,exist_ok=True);os.replace(TEMP_OUTPUT_DIR/"retrieval-config.json",CONFIG_PATH);os.replace(TEMP_OUTPUT_DIR/"retrieval-validation-report.txt",REPORT_PATH);shutil.rmtree(TEMP_OUTPUT_DIR,ignore_errors=True)
def print_result(result):
    print("-"*108);print(f"#{result['rank']:02d} final={result['final_score']:.6f} repo={result['repository_index']:03d} {result['repository_name']}");print(f"     Class={result['retrieval_class']} | area={result['semantic_area']} | polarity={result['evidence_polarity']} | level={result['evidence_level']}");print(f"     Source: {result['provenance_label']}");text=str(result.get("text") or "").strip();text=text[:DISPLAY_TEXT_CHARS]+(" ..." if len(text)>DISPLAY_TEXT_CHARS else "");print("     Evidence:\n       "+text.replace("\n","\n       "))

def main():
    print("Portfolio GitHub RAG pipeline — Step 4 v3: FREE LOCAL evidence-aware retrieval");print(f"RAG root: {RAG_ROOT}")
    try:
        if len(sys.argv)!=1:raise PipelineError("This script accepts zero arguments")
        deps=load_dependencies();missing=[p for p in (MATRIX_PATH,RECORDS_PATH,MANIFEST_PATH) if not p.is_file()]
        if missing:raise PipelineError("Missing input artifact(s): "+", ".join(rel(p) for p in missing))
        manifest=load_json(MANIFEST_PATH);validate_manifest(manifest);verify_artifact_hashes(manifest);matrix=np.load(MATRIX_PATH,allow_pickle=False);records=load_jsonl(RECORDS_PATH);corpus=validate_matrix_records(matrix,records);lexical=build_lexical_index(records);selftest=exact_search_self_test(matrix);qtest=run_query_logic_self_tests();device,device_name=select_device();embedding_model=load_embedding_model(device);reranker=load_reranker(device);smoke=cross_encoder_scores(reranker,"technical evidence",list(range(min(3,len(records)))),records,device)
        if not smoke:raise PipelineError("CrossEncoder smoke test failed")
        publish_initialization(make_config(corpus,deps,device,device_name),selftest,qtest)
    except Exception as exc:
        print(f"STEP 4 v3 INITIALIZATION COMPLETE: FAILED\nReason: {exc}");return 1
    print(f"STEP 4 v3 INITIALIZATION COMPLETE: SUCCESS\nEvidence-aware documents: {len(records):,}\nRepositories covered: {corpus['repositories']}/{corpus['repository_total']}")
    session_path=TEST_RESULTS_DIR/f"retrieval-session-{local_stamp()}.jsonl";print("Interactive reference retrieval ready. Commands: :help :quit :exit")
    qn=0
    while True:
        try:q=input("Employer question> ").strip()
        except (EOFError,KeyboardInterrupt):break
        if not q:continue
        if q.casefold() in {":quit",":exit","quit","exit"}:break
        if q.casefold()==":help":print("Ask an employer-style technical, chronology, weakness, product, or ownership question.");continue
        qn+=1
        try:
            t0=time.perf_counter();results,diag=retrieve(q,matrix,records,lexical,embedding_model,reranker,device);payload={"retrieval_schema_version":RETRIEVAL_SCHEMA_VERSION,"timestamp_utc":utc_now(),"query_number":qn,"query":q,"elapsed_seconds":time.perf_counter()-t0,"diagnostics":diag,"results":results};append_jsonl(session_path,payload);write_json(LATEST_RESULTS_PATH,payload);[print_result(r) for r in results]
        except Exception as exc:print(f"FAILED: {exc}")
    return 0

if __name__=="__main__":raise SystemExit(main())
