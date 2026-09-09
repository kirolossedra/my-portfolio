# Tag Ontology Extensions — Repositories 048–054

These canonical factual tags were introduced by repositories 048–054 and follow the same positive-evidence rules as `TAG-ONTOLOGY.md`.

## Coursework and Provenance

- `individual-coursework` — Repository evidence supports individually completed coursework or structured learning exercises rather than a collaborative project.
- `skills-network` — Notebook or repository material explicitly identifies IBM Skills Network instructional provenance.

## Data Handling and Web Acquisition

- `series` — pandas Series objects materially participate in tabular/data-manipulation work.
- `data-selection` — Repository materially selects rows, columns, slices, or indexed subsets from structured data.
- `loc-iloc` — pandas `loc` and/or `iloc` materially implement label- or position-based data selection.
- `http-requests` — Application/notebook materially performs HTTP requests to acquire remote data or resources.
- `web-scraping` — Repository materially extracts structured information from web pages.
- `beautifulsoup` — BeautifulSoup materially parses or traverses HTML content.
- `html-parsing` — HTML is materially parsed into a structure used for extraction or processing.
- `data-extraction` — Repository materially extracts required records or fields from an external/source representation.
- `csv` — CSV materially serves as an input, output, or persisted tabular format.
- `pickle` — Python pickle serialization materially persists or restores runtime data.
- `data-serialization` — Structured runtime data is materially serialized to or restored from a persisted format.
- `data-engineering-foundations` — Repository materially exercises foundational data-acquisition, transformation, and persistence workflows.

## SQL and Relational Querying

- `mysql` — MySQL-style SQL syntax or execution context is materially used by solved queries.
- `relational-databases` — Repository materially reasons over relational tables, keys, joins, grouping, or relational query semantics.
- `sql-joins` — SQL joins materially combine rows across relations.
- `sql-aggregation` — SQL aggregate functions materially compute grouped or whole-relation summaries.
- `group-by` — SQL `GROUP BY` materially partitions rows for aggregation.
- `nested-subqueries` — SQL materially contains subqueries nested inside another query expression.
- `derived-tables` — SQL materially uses a subquery result as a table-like relation in a surrounding query.
- `union-all` — SQL `UNION ALL` materially combines result sets without duplicate elimination.
- `null-handling` — SQL logic materially reasons about or filters NULL-valued data.
- `self-referential-data` — Relational query logic materially reasons over rows whose relationships refer back to the same entity/table domain.
- `relational-query-reasoning` — Repository materially solves nontrivial relational-query transformations across filtering, joining, aggregation, or nesting.
- `leethub` — LeetHub materially synchronizes solved coding-problem artifacts or metadata into the repository.

## Deep Learning and Sequence Models

- `deep-learning` — Repository materially implements or exercises multi-layer neural-network/deep-learning methods.
- `sequence-models` — Repository materially models ordered temporal or token sequences.
- `recurrent-neural-network` — Recurrent neural-network state transitions materially implement sequence processing.
- `rnn-from-scratch` — Core RNN cell/sequence operations are materially implemented at low numerical-library level rather than only invoked through a high-level layer API.
- `hidden-state` — Recurrent hidden-state vectors materially carry sequence context between time steps.
- `character-language-model` — Language modeling materially operates at character-token granularity.
- `autoregressive-generation` — Generation materially feeds prior state/output context forward to sample subsequent sequence elements.
- `gradient-clipping` — Training code materially bounds gradients to control exploding-gradient behavior.
- `word-embeddings` — Dense vector representations of words materially support semantic computation.
- `cosine-similarity` — Cosine similarity materially measures vector/embedding similarity.
- `word-analogies` — Word-vector arithmetic/material similarity search is used to solve analogy relationships.
- `sentence-embeddings` — Sentence-level representations are materially derived from word/vector representations.
- `lstm` — Long Short-Term Memory recurrent architecture materially participates in sequence modeling.
- `natural-language-processing` — Repository materially implements or evaluates algorithms over human-language text.
- `neural-machine-translation` — Neural sequence modeling materially maps text/sequences between language representations.
- `sequence-to-sequence` — Encoder/decoder or equivalent sequence-to-sequence modeling materially maps one sequence to another.
- `attention-mechanism` — Learned attention weights materially select or combine sequence context for prediction.

## Classical and Probabilistic NLP

- `sentiment-analysis` — Text is materially classified or scored for sentiment polarity.
- `nltk` — NLTK materially supplies corpora or NLP utilities used by implementation.
- `twitter-samples` — NLTK Twitter Samples corpus materially supplies labeled text examples.
- `text-preprocessing` — Text is materially normalized, tokenized, filtered, or transformed before modeling.
- `feature-engineering` — Repository materially constructs model-ready features from raw/source observations.
- `frequency-dictionary` — Token/class frequency counts are materially represented in a dictionary for downstream modeling.
- `naive-bayes` — Naive Bayes materially implements probabilistic classification.
- `log-probability` — Log-domain probabilities materially support classification or probabilistic computation.
- `accuracy-evaluation` — Classification correctness is materially summarized as an accuracy metric.
- `probabilistic-models` — Probability distributions or conditional probabilities materially define model behavior.
- `hidden-markov-model` — Hidden Markov Model transition/emission structure materially implements sequence inference.
- `part-of-speech-tagging` — Repository materially predicts or reasons over part-of-speech labels for text tokens.
- `transition-probabilities` — Probabilities between latent/sequence states materially define model transitions.
- `emission-probabilities` — Probabilities of observations conditioned on latent states materially define model emissions.
- `smoothing` — Probability estimation materially adjusts observed counts to avoid brittle or zero-probability behavior.
- `unknown-word-handling` — NLP preprocessing/modeling materially maps or reasons about out-of-vocabulary/unknown tokens.
- `viterbi-algorithm` — Viterbi dynamic programming materially computes a most-probable latent-state sequence.
- `backpointer-reconstruction` — Dynamic-programming backpointers materially reconstruct the selected optimal sequence/path.
- `ngram-language-model` — N-gram conditional probabilities materially model token-sequence likelihood.
- `bigram` — Two-token n-gram context materially contributes to language-model probability calculations.
- `trigram` — Three-token n-gram context materially contributes to language-model probability calculations.
- `start-tokens` — Explicit sequence-start tokens materially supply missing initial context for n-gram modeling.
- `add-k-smoothing` — Add-k/Lidstone-style smoothing materially adjusts n-gram probability estimates.

## API and Model Serving

- `ml-serving` — Repository materially exposes machine-learning inference through a callable service interface.
- `model-serving-experiment` — Repository materially experiments with packaging or exposing a trained/model inference path as a service.
- `fastapi` — FastAPI materially implements HTTP API routes or service behavior.
- `asgi` — ASGI-compatible application/runtime semantics materially support the implemented Python web service.
- `uvicorn` — Uvicorn materially runs or is configured to run the ASGI application.
- `rest-api` — HTTP resource/endpoint semantics materially expose application or inference behavior.
- `http-post` — HTTP POST routes materially accept client input or invoke service behavior.
- `file-upload` — HTTP/API logic materially accepts uploaded files.
- `multipart-form-data` — Multipart form-data materially carries uploaded file/request payloads.
- `openapi` — OpenAPI-generated or described interface metadata materially documents/exposes API operations.
- `swagger-ui` — Swagger UI materially provides an interactive interface for exercising API endpoints.
- `http-exception-handling` — HTTP-layer exceptions materially convert application failures into explicit API responses.
- `json-response` — API routes materially return JSON-formatted HTTP responses.
- `streaming-response` — API routes materially use streaming HTTP responses for returned content.
- `yolov3` — YOLOv3 object-detection model selection/inference materially participates in the service workflow.
- `yolov3-tiny` — YOLOv3-Tiny model selection/inference materially participates in the service workflow.
- `inference-api` — An HTTP/API interface materially invokes model inference for client-provided input.
- `dependency-troubleshooting` — Repository execution materially exposes and works through dependency/version/environment problems.

## Verification Extensions

- `documented-test-failure` — Saved repository/notebook evidence explicitly preserves a failed verification/test invocation and its concrete cause/error.
