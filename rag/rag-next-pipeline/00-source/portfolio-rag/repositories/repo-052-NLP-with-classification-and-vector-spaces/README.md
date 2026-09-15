# Repository 052 — NLP-with-classification-and-vector-spaces

## Repository Identity

- **Repository:** `kirolossedra/NLP-with-classification-and-vector-spaces`
- **Repository start date:** 2024-10-08
- **Last meaningful update date:** 2024-10-08
- **Primary implementation environment:** Jupyter Notebook / Python
- **Primary domain:** NLP sentiment classification
- **Algorithms:** logistic regression and Naive Bayes
- **Core libraries:** NumPy, Pandas, NLTK
- **Repository type:** structured NLP coursework
- **Collaboration classification:** individual learning repository
- **Authorship boundary:** notebooks contain graded-function markers and instructional scaffolding

## What This Project Is

`NLP-with-classification-and-vector-spaces` contains two sentiment-analysis notebooks:

- `Logistic_Regression_Simple_NLP.ipynb`,
- `Sentiment_Analysis_with_Naive_Bayes.ipynb`.

The repository explores classical NLP classification using explicit feature/count models rather than deep neural networks.

## Dataset

The logistic-regression notebook loads NLTK's `twitter_samples` corpus.

It separates:

- positive tweets,
- negative tweets.

The visible split produces:

- 8,000 training labels,
- 2,000 test labels.

This is a balanced binary sentiment-classification exercise.

## Text Preprocessing Infrastructure

The notebook imports helper functions including:

- `process_tweet`,
- `build_freqs`.

The workflow includes stopword resources and tweet preprocessing.

Those utilities are part of the assignment environment.

The corpus does not claim they were independently authored unless the repository provides such evidence.

## Frequency Dictionary

The logistic-regression workflow builds a frequency dictionary from labeled training tweets.

This creates class-aware word-frequency features.

A tweet can then be represented through counts associated with positive and negative classes.

This is a manually interpretable feature-engineering approach.

## Logistic Regression

The notebook contains a graded `gradientDescent` function.

The function optimizes logistic-regression parameters iteratively.

The visible code path applies gradient descent over a feature matrix and labels.

This provides lower-level implementation evidence beyond calling a prebuilt classifier.

## Cost Optimization

The exercise returns both:

- cost,
- learned parameters.

This reinforces the connection between objective function minimization and model training.

## Prediction

The notebook includes a logistic-regression prediction path.

Tweet features are converted into a numeric feature vector and scored with learned parameters.

The result is thresholded into sentiment class.

## Evaluation

The notebook contains an accuracy computation:

correct predictions / total test examples.

This provides explicit evaluation logic.

The repository therefore covers:

training
→ prediction
→ held-out evaluation.

## Naive Bayes Notebook

`Sentiment_Analysis_with_Naive_Bayes.ipynb` implements a second classical classifier over the same general sentiment domain.

The notebook includes a graded:

`naive_bayes_predict(tweet, logprior, loglikelihood)`.

## Probabilistic Classification

The Naive Bayes approach models sentiment through:

- prior probability,
- per-word likelihood evidence,
- log-domain accumulation.

Using log probabilities avoids multiplying many small probabilities directly.

## Log Prior

The model estimates the relative prior probability of positive vs negative sentiment.

For a balanced training set this term is correspondingly constrained.

The exercise makes that probabilistic component explicit.

## Log Likelihood

The classifier builds word-level likelihood information.

For each processed token, the prediction score accumulates evidence from the learned log-likelihood dictionary.

This creates an interpretable token contribution model.

## Naive Bayes Prediction

The visible `naive_bayes_predict` function accepts:

- raw tweet,
- log prior,
- log-likelihood dictionary.

It preprocesses/evaluates the tweet and returns its sentiment score.

## Evaluation

The Naive Bayes notebook also defines accuracy as:

correctly classified tweets / total tweets.

This allows comparison of two classical NLP approaches within the same repository.

## Classical NLP vs Deep Learning

Chronologically this repository appears after deep-learning sequence exercises.

Its value is different.

It revisits NLP with simpler statistical models where:

- features are inspectable,
- counts are explicit,
- probabilities can be reasoned about directly.

This broadens rather than merely advances model complexity.

## Instructional Markers

The notebooks contain labels such as:

- `UNQ_C...`,
- `UNIQUE CELL IDENTIFIER`,
- graded-function comments.

These are clear evidence of assignment scaffolding.

Learner capability is attributed to completed function regions and executed exercises.

Instructional prose/framework is not attributed as original repository design.

## Testing and Verification

Verification is notebook/assignment based.

The notebooks contain:

- explicit training/test splits,
- accuracy functions,
- expected-output checks.

There is no repository-level CI pipeline.

There is no external model-serving layer.

## Skills Demonstrated

### NLP

- sentiment analysis
- tweet preprocessing
- token frequency features
- supervised text classification

### Logistic Regression

- sigmoid-based classification
- gradient descent
- cost optimization
- prediction
- accuracy measurement

### Naive Bayes

- class priors
- likelihood estimation
- log probability
- probabilistic prediction

### Python

- NumPy
- Pandas
- NLTK
- Jupyter

## Capability Developed

The repository develops the ability to construct NLP classifiers from interpretable statistical primitives.

Rather than hiding feature extraction behind an end-to-end neural network, the exercises expose:

- frequency tables,
- feature vectors,
- optimization,
- probability ratios.

This is valuable for understanding why a text classifier makes a decision.

## Portfolio Evolution

The preceding sequence-model repository focused on RNNs, embeddings, and attention.

This repository moves sideways into classical NLP.

That gives the portfolio both:

- neural sequence modeling,
- classical statistical text classification.

## Historical Significance

Within the processed corpus, this is the earliest observed repository centered specifically on NLP sentiment classification.

It is also the earliest observed Naive Bayes text-classification implementation in the corpus.

## Scope Boundaries

The repository does not implement a production sentiment API.

It does not contain model deployment.

It does not contain online inference infrastructure.

It does not contain a custom dataset collection pipeline.

## Limitations

The work is instructional.

The root README is effectively empty.

Preprocessing helpers are referenced from assignment utilities.

No dependency lockfile is present.

No CI workflow exists.

No production monitoring or persistence is present.

## Overall Narrative

`NLP-with-classification-and-vector-spaces` is a compact but conceptually useful classical NLP repository.

It implements and evaluates two transparent sentiment models—logistic regression and Naive Bayes—over tweet data.

Its strongest evidence lies in learner-completed optimization/prediction functions and explicit evaluation, while the corpus carefully preserves the surrounding assignment-scaffold provenance.

# Project Tags

- `educational-project`
- `individual-coursework`
- `instructional-scaffold`
- `python`
- `jupyter-notebook`
- `natural-language-processing`
- `sentiment-analysis`
- `nltk`
- `twitter-samples`
- `text-preprocessing`
- `feature-engineering`
- `frequency-dictionary`
- `logistic-regression`
- `gradient-descent`
- `naive-bayes`
- `log-probability`
- `binary-classification`
- `supervised-learning`
- `train-test-split`
- `accuracy-evaluation`
