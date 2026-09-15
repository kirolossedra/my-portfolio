# Tag Ontology Extensions — Repositories 115–119

This file extends the portfolio corpus vocabulary with factual concepts positively evidenced in repositories 115–119. It complements `TAG-ONTOLOGY-EXTENSIONS-113-119.md`, whose existing definitions through repository 114 remain authoritative.

## Developer Economy and Ledger Modeling

- `developer-economy` — Application materially models transactional exchanges between software developers or project contributors.
- `brain-coins` — Brain Coins are materially used as the application's internal closed-loop accounting unit.
- `double-entry-ledger` — Each transfer materially creates equal-and-opposite signed postings under one ledger transaction.
- `derived-balance` — Account balance is materially computed from ledger postings rather than maintained as an independently mutable balance field.
- `ledger-postings` — Signed per-account postings materially represent the accounting impact of a ledger transaction.
- `ledger-transactions` — Transaction records materially group posting pairs and domain-reference metadata.
- `system-account` — Ledger materially distinguishes system-owned accounts from user-owned accounts.
- `account-locking` — Money movement materially acquires database-backed account locks before validating and writing a transfer.
- `deterministic-lock-order` — Participating accounts are materially locked in a stable identifier order to reduce opposing lock-order risk.
- `transactional-money-movement` — Financial-style state movement materially executes inside transactional backend services.
- `direct-transfer` — Application materially supports direct value transfer between developer accounts.

## Project Deal and Reliability Workflows

- `project-deal-workflow` — Application materially models proposed work agreements between a requester and developer.
- `project-payment` — Confirmed project completion materially releases payment through the central ledger.
- `deal-state-machine` — Project deals materially use guarded proposed, accepted, completed, disputed, and cancelled transitions.
- `dispute-workflow` — A party to accepted work can materially move the deal into an explicit dispute state.
- `t-score` — Application materially computes a named T-score from observed platform reliability evidence.
- `transactional-reliability` — Reliability materially derives from project commitments, repayments, disputes, overdue work, and defaults.
- `explainable-scoring` — Score output materially retains named components, point impacts, and explanations.
- `bounded-score` — Reliability score is materially clamped to an explicit bounded numeric interval.

## Lending and Decision-Support Boundaries

- `loan-application-workflow` — Application materially supports submission, review, human decision, disbursement, repayment, and default lifecycle.
- `payment-history-evidence` — Loan review materially consumes structured evidence derived from recorded transaction history.
- `qualification-review` — Applicant qualification/context text is materially reviewed separately from payment-history evidence.
- `review-provider-abstraction` — Review logic materially sits behind a replaceable service contract.
- `deterministic-heuristic-review` — Checked-in review provider materially uses deterministic rule logic and explicitly identifies itself as a heuristic placeholder.
- `human-in-the-loop-review` — Consequential loan acceptance/rejection materially remains under human administrator authority after automated review output.
- `mandatory-review-window` — Loan decision materially cannot occur until an explicit review duration has elapsed.
- `administrator-loan-review` — Administrator role materially owns the final loan approval/rejection operation.
- `loan-disbursement` — Human-approved loans materially transfer internal value from the treasury through the ledger.
- `loan-repayment` — Borrower repayment materially transfers value back to the treasury and updates outstanding principal.
- `loan-default-detection` — Scheduled backend logic materially marks overdue approved loans with remaining principal as defaulted.

## Recurring Payments and Auditability

- `salary-agreement` — Application materially models recurring payer-to-developer direct-deposit agreements.
- `scheduled-payments` — Spring scheduled processing materially discovers and executes due recurring agreements.
- `audit-events` — Consequential business transitions materially create separately persisted audit records.
- `audit-log` — Application materially maintains actor/action/entity/detail history for important state transitions.

## English Writing Practice

- `ielts-writing` — Repository materially stores IELTS-style writing practice.
- `ielts-task-1` — Repository materially contains Task 1-style quantitative/visual-data summarization exercises.
- `ielts-task-2` — Repository materially contains Task 2-style argumentative essay exercises.
- `analytical-writing` — Authored practice materially summarizes and compares structured quantitative information.
- `argumentative-writing` — Authored practice materially develops and concludes positions on discursive prompts.
- `writing-revision` — Repository materially preserves revised or repeated writing attempts.
- `rubric-based-feedback` — Writing is materially reviewed against named criterion dimensions.
- `criterion-based-evaluation` — Evaluation materially separates dimensions such as task achievement, coherence, vocabulary, and grammar.
- `band-score-tracking` — Repository materially records writing band estimates alongside attempts.
- `cefr-reference` — Repository materially records CEFR mappings alongside writing evaluation.
- `multiple-writing-trials` — The same exercise is materially attempted more than once in a retained learning record.
- `ai-assisted-writing-feedback` — Conversational AI feedback is materially preserved as external input to a writing-learning workflow.
- `bing-feedback` — Repository materially identifies Bing conversation output as a source of writing feedback.
- `markdown-learning-journal` — Markdown files materially combine prompts, learner work, evaluations, revisions, and learning notes.
- `version-controlled-learning` — Git history materially preserves incremental learning artifacts and revisions.
- `personal-learning-repository` — Repository is materially organized as a personal learning workspace rather than a deployable product.

## Language-Learning Workspace

- `french-learning` — Repository identity materially establishes French-language learning as its subject.
- `learning-workspace` — Repository materially acts as a dedicated version-controlled workspace for a named learning subject.

## Deterministic Hash-Derived String Experiment

- `security-experiment` — Repository materially contains a security-themed programming experiment.
- `hashlib` — Python `hashlib` materially supplies the SHA-256 operation.
- `sha256` — SHA-256 materially derives digest state from input text.
- `deterministic-string-derivation` — Identical inputs materially reproduce the same generated character sequence.
- `seeded-prng` — A digest-derived integer materially seeds pseudo-random character selection.
- `python-random` — Python's `random` module materially generates the derived character sequence.
- `character-set-generation` — Output materially draws from an explicit letters/digits/special-character alphabet.
- `configurable-output-length` — Function materially accepts output length as a parameter.

## MATLAB Image-Processing Learning

- `matlab-live-script` — Repository materially contains a MATLAB `.mlx` Live Script artifact.
- `matlab-live-editor` — MATLAB Live Editor is materially represented by the packaged Live Script format.
- `spatial-filtering` — Repository materially identifies spatial filtering as its image-processing focus.
- `interactive-computing` — Technical work is materially stored in an interactive computational-document format.
- `computational-document` — Executable technical work and document/output state are materially packaged together.
- `notebook-style-workflow` — Repository materially uses a notebook-like executable document rather than only plain source files.

## Earliest-Observed Retrieval Tags

- `earliest-observed-double-entry-developer-economy-ledger` — repository 115.
- `earliest-observed-human-gated-loan-review-window` — repository 115.
- `earliest-observed-transactional-reliability-t-score` — repository 115.
- `earliest-observed-review-provider-abstraction-with-deterministic-placeholder` — repository 115.
- `earliest-observed-version-controlled-ielts-writing-practice` — repository 116.
- `earliest-observed-ai-assisted-writing-feedback-corpus` — repository 116.
- `earliest-observed-french-learning-workspace` — repository 117.
- `earliest-observed-sha256-derived-deterministic-string-generation` — repository 118.
- `earliest-observed-matlab-live-script-spatial-filtering` — repository 119.
