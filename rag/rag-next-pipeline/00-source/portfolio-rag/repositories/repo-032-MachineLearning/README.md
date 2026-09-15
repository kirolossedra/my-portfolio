# MachineLearning

## Repository Identity

- Repository: 032 / 134
- Name: `MachineLearning`
- Repository Start Date: 2024-05-31
- Latest Meaningful Update Date: 2024-05-31
- Primary Artifact: `FirstMLProject.ipynb`
- Primary Language: Python
- Technical Field: Supervised machine learning, regression
- Domain: Molecular solubility prediction
- Collaboration Type: Individual Project

## Collaboration and Authorship Context

The repository contains one owner-uploaded notebook.

The notebook’s Colab execution metadata identifies `Kirolos Sedra` as the executing user for the preserved cells.

That gives direct evidence of hands-on execution and experimentation.

## What This Project Is

`MachineLearning` contains a single Jupyter notebook explicitly named:

`FirstMLProject.ipynb`

The notebook builds a regression workflow for predicting molecular aqueous solubility.

The target variable is:

`logS`

The feature set contains molecular descriptors such as:

- `MolLogP`,
- `MolWt`,
- `NumRotatableBonds`,
- `AromaticProportion`.

The preserved dataframe contains 1,144 rows and five columns including the target.

## Data Source and Preparation

The notebook loads a CSV dataset with pandas.

It uses:

```text
pd.read_csv(...)
```

against a publicly hosted molecular-solubility dataset.

The target column `logS` is separated from the explanatory variables.

Conceptually:

```text
molecular descriptor dataset
          ↓
pandas DataFrame
          ↓
X = descriptor columns
y = logS
```

## Dataset Shape

The preserved notebook output shows:

- 1,144 observations,
- four input descriptors,
- one `logS` target.

This provides direct data-scale evidence.

## Train/Test Split

The notebook uses scikit-learn’s `train_test_split`.

The split is configured with:

- `test_size=0.2`,
- `random_state=2`.

That produces an 80/20 training/evaluation partition with reproducible randomization.

## Model Building

The model is scikit-learn `LinearRegression`.

The workflow is explicit:

```text
lr = LinearRegression()
lr.fit(X_train, y_train)
```

Predictions are then produced for both:

- training data,
- test data.

This makes the notebook a complete supervised-regression workflow rather than only a dataset visualization.

## Evaluation Metrics

The notebook evaluates the regression model with:

- mean squared error,
- R² score.

It calculates both metrics independently for training and test partitions.

Preserved outputs include:

### Training

- MSE: approximately `0.97397`
- R²: approximately `0.77658`

### Test

- MSE: approximately `1.16132`
- R²: approximately `0.74186`

These values provide concrete model-evaluation evidence.

## Generalization Comparison

Because the notebook records both train and test metrics, it supports basic generalization reasoning.

The test MSE is higher than training MSE.

The test R² is lower than training R².

The repository therefore demonstrates the practice of evaluating a model on unseen held-out data rather than judging it only on the training set.

## Technical Stack

### Python

The notebook implementation language.

### pandas

Used to load and manipulate the tabular dataset.

### scikit-learn

Used for:

- train/test splitting,
- linear regression,
- mean squared error,
- R² evaluation.

### Jupyter / Google Colab

Used for iterative execution and preserved outputs.

## Engineering and Data Practices

### Reproducible Data Split

`random_state=2` makes the partition repeatable.

### Feature/Target Separation

The target is explicitly removed from the model-input dataframe.

### Held-Out Evaluation

The model is measured on both train and test subsets.

### Metric-Based Assessment

Performance is quantified with numerical regression metrics.

## Implementation Scale

The repository contains only one notebook, but it spans a complete elementary ML pipeline:

```text
load data
   ↓
inspect dataframe
   ↓
separate X / y
   ↓
split train / test
   ↓
fit regression model
   ↓
predict
   ↓
evaluate MSE and R²
```

That makes it a coherent end-to-end learning artifact.

## Skills Demonstrated

### Data Science

- dataframe inspection,
- feature/target separation,
- tabular data handling,
- regression metrics.

### Machine Learning

- supervised learning,
- linear regression,
- train/test splitting,
- model fitting,
- prediction,
- held-out evaluation.

### Python Ecosystem

- pandas,
- scikit-learn,
- Jupyter Notebook,
- Colab execution.

## Capability Developed

This repository is a useful bridge between the earlier neural-network coursework and conventional applied machine learning.

The neural-network repository demonstrated model implementation and gradient-based learning.

`MachineLearning` demonstrates a compact scikit-learn workflow around a real tabular regression problem.

That broadens the portfolio from neural networks into general supervised-learning tooling.

## Historical Portfolio Significance

This is the earliest processed repository centered on scikit-learn linear regression.

It is also the earliest processed repository with directly evidenced pandas data loading and held-out R²/MSE regression evaluation.

The notebook title itself—`FirstMLProject`—records the owner’s framing of this as an early machine-learning project.

## Overall Project Narrative

`MachineLearning` is a concise first applied regression project.

It takes a real molecular-descriptor dataset, separates explanatory variables from a continuous target, creates a deterministic train/test split, trains a linear model and compares performance on seen and unseen data.

Its strongest portfolio value is that it captures the entire basic supervised-learning lifecycle in one executable notebook with preserved outputs.

# Project Tags

- `python`
- `jupyter-notebook`
- `individual-project`
- `machine-learning`
- `supervised-learning`
- `regression`
- `linear-regression`
- `pandas`
- `scikit-learn`
- `tabular-data`
- `train-test-split`
- `reproducible-split`
- `model-training`
- `model-prediction`
- `mean-squared-error`
- `r2-score`
- `held-out-evaluation`
- `molecular-solubility`
- `molecular-descriptors`
- `dataframe`
- `earliest-observed-pandas`
- `earliest-observed-scikit-learn-regression`
- `earliest-observed-r2-evaluation`
