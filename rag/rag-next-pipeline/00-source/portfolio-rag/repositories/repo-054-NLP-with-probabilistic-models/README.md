# Repository 054 — NLP-with-probabilistic-models

## Repository Identity

- **Repository:** `kirolossedra/NLP-with-probabilistic-models`
- **Repository start date:** 2024-10-12
- **Last meaningful update date:** 2024-10-14
- **Primary implementation environment:** Jupyter Notebook / Python plus Markdown study documents
- **Primary domain:** probabilistic NLP
- **Implemented exercise:** hidden-Markov-model part-of-speech tagging
- **Documented study area:** n-gram language modeling / autocomplete
- **Collaboration classification:** individual learning repository
- **Authorship boundary:** HMM notebook contains graded assignment markers and supplied helper/test references

## What This Project Is

`NLP-with-probabilistic-models` combines two related NLP study tracks:

1. part-of-speech tagging with a Hidden Markov Model,
2. language-model/autocomplete theory using n-gram probabilities.

The HMM track contains executable notebook code.

The autocomplete track in the current repository is documentation/quiz material rather than an implemented autocomplete engine.

That distinction is preserved throughout this corpus entry.

## Repository Structure

Visible sections include:

- `Part of speech tagging and hidden Markov`,
- `Autocomplete`.

The POS section contains:

- `POS_Tagging.ipynb`,
- `README.md`,
- `Algoirhtm.md`,
- `Quiz.md`.

The Autocomplete section contains:

- `README.md`,
- `Quiz.md`.

## POS Dataset

The POS notebook loads a tagged training corpus:

`WSJ_02-21.pos`.

It also loads:

- a vocabulary,
- a held-out tagged test corpus,
- a preprocessed word-only test corpus.

Visible notebook output reports preprocessing of tens of thousands of test tokens.

The training loop reports processing counts up to hundreds of thousands of corpus entries.

This is a nontrivial corpus-scale instructional exercise.

## Vocabulary Handling

The notebook constructs a word-to-index vocabulary dictionary.

It contains explicit unknown-token classes such as:

- generic unknown,
- adjective-like unknown,
- adverb-like unknown,
- digit unknown,
- noun unknown,
- punctuation unknown,
- uppercase unknown,
- verb unknown.

This demonstrates practical NLP unknown-word handling.

## HMM Count Construction

The notebook contains a graded function:

`create_dictionaries`.

It constructs:

- `emission_counts`,
- `transition_counts`,
- `tag_counts`.

For every tagged training item it:

1. extracts the word/tag pair,
2. increments the previous-tag→current-tag transition,
3. increments the tag→word emission count,
4. increments tag frequency,
5. updates the previous tag.

This is direct implementation of HMM sufficient statistics.

## Transition Model

The repository's explanatory README demonstrates transition probabilities between POS tags.

It builds a conceptual transition matrix `A`.

The probability of a tag depends on the previous tag.

That is the Markov-state component of the model.

## Smoothing

The README explicitly explains adding a small smoothing term to avoid zero-probability transitions.

The transition formula adds epsilon to observed counts and normalizes across possible tags.

This shows understanding of sparse-count probability estimation.

## Emission Model

The POS README also explains an emission matrix `B`.

Emission probability represents the likelihood of a word conditioned on a POS tag.

The examples include ambiguous words whose grammatical role changes across contexts.

This connects observed tokens to latent grammatical states.

## Viterbi Dynamic Programming

The notebook contains a graded:

`viterbi_forward`.

It uses transition and emission matrices to propagate the best state probabilities through the token sequence.

The notebook then runs the function over roughly 30,000 preprocessed words.

## Backpointer Reconstruction

The notebook also contains:

`viterbi_backward`.

This reconstructs the best POS-tag sequence from the backpointer matrix.

Together:

- forward dynamic programming,
- backpointer reconstruction

form the complete Viterbi decoding pattern.

## Dynamic-Programming Significance

This is not only an NLP topic.

Viterbi is a dynamic-programming algorithm over latent state sequences.

The exercise reinforces:

- optimal substructure,
- state transition scoring,
- path memoization,
- backward reconstruction.

## Saved Test Failure

A notebook cell attempts to run:

`w2_unittest.test_viterbi_forward(...)`.

The saved output contains:

`NameError: name 'w2_unittest' is not defined`.

This is important evidence.

The corpus does not claim that every supplied unit test passed.

The failure appears to be missing test-module setup in the notebook state rather than direct proof that the Viterbi algorithm is numerically wrong.

But the checked-in state remains a failed test invocation.

## Notebook Execution State

Many POS notebook cells have stored outputs.

Some execution counts are null while outputs remain embedded, consistent with notebook editing/export history.

The corpus therefore treats the notebook as exercised but does not infer a clean-from-scratch execution run.

## POS Documentation

The repository contains substantial personally maintained explanatory Markdown around:

- transition counts,
- conditional probability,
- smoothing,
- emissions,
- initialization,
- backpointers.

This creates retrieval value beyond the notebook implementation itself.

## Autocomplete Study Track

The `Autocomplete/README.md` is a long probabilistic-language-model note.

It explains:

- sentence probability,
- Naive Bayes independence contrast,
- conditional word probability,
- bigrams,
- trigrams,
- Markov assumptions,
- start tokens,
- smoothing.

## N-Gram Probability

The document generalizes sentence probability from independent words to conditional n-gram history.

For a bigram model, each word probability is conditioned on its immediate predecessor.

For a trigram model, it is conditioned on the previous two tokens.

## Start Tokens

The notes explain why an n-gram model needs synthetic start tokens.

For a trigram model, two start tokens provide a full context window for the first actual word.

This preserves a consistent model order at sentence boundaries.

## Add-k Smoothing

The autocomplete notes discuss:

- add-one smoothing,
- add-k smoothing.

They explain why add-one can overallocate probability mass to unseen n-grams and how a smaller `k` offers finer control.

This is useful probabilistic-language-model theory.

## Autocomplete Implementation Boundary

No executable autocomplete notebook or Python implementation is present in the current tree.

Therefore the repository demonstrates:

- autocomplete/n-gram theory documentation,
- quiz/study material,

but not a checked-in autocomplete service or inference implementation.

## Instructional Provenance

The POS notebook contains markers such as:

- `UNQ_C...`,
- `GRADED FUNCTION`.

It imports helper functionality such as:

- `get_word_tag`,
- `preprocess`.

It also references a supplied `w2_unittest` module.

This is structured coursework.

Learner-completed functions are separated from supplied framework code in the corpus claims.

## Testing and Verification

Verification evidence is mixed.

Positive evidence:

- large corpus-processing outputs,
- Viterbi execution call,
- generated intermediate structures.

Negative evidence:

- the stored `w2_unittest` invocation fails with a `NameError`.

There is no repository-level CI.

## Skills Demonstrated

### Probabilistic NLP

- conditional probability
- count-based estimation
- transition probabilities
- emission probabilities
- smoothing
- n-gram language models

### Hidden Markov Models

- HMM state modeling
- POS tagging
- transition matrix
- emission matrix
- unknown-word preprocessing

### Algorithms

- Viterbi forward pass
- backpointer matrix
- dynamic programming
- optimal-path reconstruction

### Language Modeling

- bigrams
- trigrams
- start tokens
- add-one smoothing
- add-k smoothing

### Python

- dictionaries/defaultdict
- NumPy
- Pandas
- Jupyter

## Capability Developed

This repository deepens the statistical side of NLP.

Instead of neural hidden states, language structure is represented through explicit probability tables and state transitions.

That creates a useful contrast between:

- neural sequence models,
- classical probabilistic sequence models.

The learner sees how both approaches solve sequence dependence with very different machinery.

## Portfolio Evolution

The preceding NLP classification repository focuses on logistic regression and Naive Bayes sentiment models.

This repository advances into structured sequences:

- tags depend on previous tags,
- words are emitted from hidden grammatical states,
- sentence probabilities depend on n-gram history.

That broadens classical NLP from independent classification into sequence inference.

## Historical Significance

Within the processed corpus, this is the earliest observed repository containing:

- Hidden Markov Model NLP,
- POS tagging,
- Viterbi decoding,
- explicit n-gram language-model study.

## Scale and Complexity

The HMM notebook processes a large tagged corpus and a test sequence of tens of thousands of words.

The implementation is still instructional, but the data volume and dynamic-programming path make it algorithmically richer than a toy three-sentence example.

## Limitations

The repository is coursework-oriented.

The POS notebook depends on helper/data files that are referenced but not all visible in the repository tree.

The stored unit-test invocation has a missing-module `NameError`.

The autocomplete section contains theory/quiz documents without executable autocomplete code.

No dependency lockfile is present.

No deployment exists.

No CI pipeline exists.

## Overall Narrative

`NLP-with-probabilistic-models` captures a strong classical sequence-modeling phase.

Its concrete implementation is an HMM POS tagger built from transition/emission counts and decoded with Viterbi dynamic programming.

Alongside that implementation, the repository builds detailed notes on n-gram sentence probability and smoothing.

The corpus deliberately keeps implementation and study material distinct, and it also preserves the saved failed unit-test invocation instead of presenting the notebook as universally passing.

# Project Tags

- `educational-project`
- `individual-coursework`
- `instructional-scaffold`
- `python`
- `jupyter-notebook`
- `natural-language-processing`
- `probabilistic-models`
- `hidden-markov-model`
- `part-of-speech-tagging`
- `transition-probabilities`
- `emission-probabilities`
- `smoothing`
- `unknown-word-handling`
- `viterbi-algorithm`
- `dynamic-programming`
- `backpointer-reconstruction`
- `ngram-language-model`
- `bigram`
- `trigram`
- `start-tokens`
- `add-k-smoothing`
- `documented-test-failure`
- `executed-notebook-output`
