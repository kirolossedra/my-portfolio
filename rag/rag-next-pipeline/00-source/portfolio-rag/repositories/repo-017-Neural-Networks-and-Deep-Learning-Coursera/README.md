# Neural-Networks-and-Deep-Learning-Coursera

## Repository Identity

- Repository: 017 / 134
- Name: `Neural-Networks-and-Deep-Learning-Coursera`
- Repository start date: 2023-03-02
- Latest meaningful update date: 2023-03-11
- Primary type: Online-course assignment repository
- Technical field: Machine learning and neural networks
- Application domain: Binary classification and introductory deep learning
- Project context: Coursera programming coursework
- Collaboration type: `individual-project`
- Primary implementation language: Python
- Notebook environment: Jupyter / exported Python assignments

## Collaboration and Authorship Context

This repository contains a mixture of personally completed coursework and course-supplied infrastructure.

Course-provided material includes:

- assignment prose;
- datasets;
- images;
- helper modules;
- public test files;
- test-case utilities;
- notebook scaffolding;
- grader-oriented function signatures.

The strongest personally attributable implementation evidence appears inside the graded assignment solution regions marked:

```text
YOUR CODE STARTS HERE
...
YOUR CODE ENDS HERE
```

The corpus therefore treats the repository as evidence of **hands-on completion of structured machine-learning exercises**, rather than authorship of the surrounding Coursera course framework.

## Evidence Basis

The repository is organized by course week.

Visible content includes:

### Week 1

- conceptual quiz material.

### Week 2

- Python Basics with NumPy assignment;
- Logistic Regression with a Neural Network Mindset assignment;
- cat/non-cat HDF5 datasets;
- helper and public-test files;
- notebook and exported Python forms.

### Week 3

- Planar Data Classification with One Hidden Layer;
- helper utilities;
- public tests;
- test cases;
- assignment imagery.

Commit history shows the repository being populated through March 11, 2023.

## What This Project Is

`Neural-Networks-and-Deep-Learning-Coursera` is a learning repository for early coursework from the Deep Learning Specialization's Neural Networks and Deep Learning material.

The programming assignments move through a deliberate progression:

```text
NumPy/vectorization fundamentals
        ↓
logistic regression from first principles
        ↓
gradient-based optimization
        ↓
image classification
        ↓
one-hidden-layer neural network
        ↓
forward propagation
        ↓
cross-entropy cost
        ↓
backpropagation
        ↓
parameter updates
```

This is the earliest processed repository in the portfolio devoted directly to machine learning.

## Repository Structure

```text
Neural-Networks-and-Deep-Learning-Coursera/
├── Week1/
│   └── quiz material
├── Week2 /
│   ├── Python Basics Assignment/
│   └── Programming Assignment/
│       ├── Logistic_Regression_with_a_Neural_Network_mindset.ipynb
│       ├── Logistic_Regression_with_a_Neural_Network_mindset.py
│       ├── datasets/
│       ├── images/
│       ├── lr_utils.py
│       └── public_tests.py
└── Week3/
    └── Programming Assignment/
        ├── Planar_data_classification_with_one_hidden_layer.py
        ├── planar_utils.py
        ├── public_tests.py
        ├── testCases_v2.py
        └── test_utils.py
```

## Technical Stack

### Python

Python is the primary language used for graded exercises and exported notebook code.

### NumPy

NumPy is central to:

- shape inspection;
- vector/matrix reshaping;
- transposition;
- vectorized arithmetic;
- dot products;
- activation functions;
- gradient calculations;
- parameter updates.

### Jupyter Notebook

Assignments exist as notebook artifacts, with at least one exported `.py` representation also committed.

This provides direct evidence of notebook-based scientific-computing workflow.

### Matplotlib

Matplotlib is used to visualize:

- image examples;
- planar datasets;
- decision boundaries;
- training behavior.

### h5py

The Week 2 classifier uses HDF5-backed cat/non-cat training and testing datasets loaded through course utility code.

### scikit-learn

Week 3 uses `sklearn.linear_model.LogisticRegressionCV` as a baseline before building the custom one-hidden-layer neural network.

### PIL / SciPy

The Week 2 assignment imports image-processing helpers that support optional custom-image experiments.

## Python and NumPy Foundations

The Week 2 Python Basics assignment exercises scientific-computing fundamentals before the learning algorithms.

The repository therefore provides hands-on exposure to:

- NumPy arrays;
- shapes;
- vectorization;
- broadcasting-style operations;
- normalization;
- mathematical helper functions.

This is a meaningful shift from the earlier Python preprocessing repository, which used Python primarily for string/data transformation.

## Image Dataset Preprocessing

The logistic-regression assignment starts from image tensors shaped like:

```text
(number of examples, width, height, RGB channels)
```

The completed code extracts:

- training example count;
- test example count;
- image size.

It then reshapes training and test images into flattened feature matrices using:

```python
X.reshape(X.shape[0], -1).T
```

The flattened values are divided by 255 to normalize pixel intensity values.

This establishes direct experience with transforming raw image tensors into a machine-learning feature matrix.

## Logistic Regression from First Principles

The Week 2 programming assignment builds a binary cat/non-cat classifier without delegating the learning algorithm to a high-level model API.

The assignment decomposes the model into reusable functions.

## Sigmoid Activation

A `sigmoid(z)` function computes the logistic activation using NumPy exponentiation.

This connects a mathematical activation expression directly to vectorized code.

## Parameter Initialization

Weights and bias are initialized before optimization.

The assignment emphasizes preserving expected matrix/vector dimensions.

## Forward Propagation

The model computes:

```text
z = wᵀx + b
        ↓
sigmoid(z)
        ↓
predicted probability
```

The vectorized implementation evaluates all examples together through NumPy operations.

## Cost Function

The assignment uses binary cross-entropy/log-loss over the predictions and labels.

The cost becomes the scalar objective optimized during training.

## Backward Propagation

The implementation derives gradients for:

- weights;
- bias.

This is the earliest processed repository with explicit gradient-based learning and backward-propagation mathematics implemented in code.

## Gradient Descent

The optimizer repeatedly:

1. performs propagation;
2. computes gradients;
3. updates weights;
4. updates bias;
5. records costs at selected intervals.

This gives the repository direct evidence of iterative optimization rather than only using a prebuilt classifier.

## Prediction

The trained parameters are used to generate probabilities and convert them into binary predictions.

## Model Integration

The assignment ultimately integrates:

- parameter initialization;
- optimization;
- prediction;
- training accuracy;
- test accuracy;

into one model workflow.

## One-Hidden-Layer Neural Network

Week 3 extends the same first-principles approach into a non-linear neural network.

The implemented architecture is:

```text
Input layer
    ↓
Linear transform W1X + b1
    ↓
tanh hidden activation
    ↓
Linear transform W2A1 + b2
    ↓
sigmoid output
    ↓
binary prediction
```

## Network Shape Definition

The completed `layer_sizes()` code derives:

- input-layer size from `X`;
- output-layer size from `Y`;
- a four-unit hidden layer for the exercise.

This gives direct practice reasoning about tensor dimensions at model boundaries.

## Parameter Initialization

`initialize_parameters()` constructs:

- `W1`;
- `b1`;
- `W2`;
- `b2`.

Weights are randomly initialized at small magnitude and biases are initialized to zero.

## Forward Propagation

The assignment implements the two-layer forward path using:

- matrix multiplication;
- hidden `tanh` activation;
- output sigmoid activation.

Intermediate values are cached for the backward pass.

## Cross-Entropy Cost

The predicted output and labels are used to calculate the classification cost across the dataset.

## Backpropagation

The Week 3 assignment calculates gradients through both network layers.

The code must propagate error from the output layer through the non-linear hidden layer and into the first set of parameters.

This materially expands the gradient reasoning introduced in logistic regression.

## Parameter Updates

Weights and biases for both layers are updated through gradient descent.

## Neural Network Training Loop

The assignment combines:

- parameter initialization;
- repeated forward propagation;
- cost calculation;
- backward propagation;
- parameter updates.

The result is a complete one-hidden-layer training loop built from lower-level operations.

## Prediction

A prediction function applies the learned network parameters and thresholds the output probability for two-class classification.

## Baseline Comparison

Before the custom neural network, Week 3 fits a scikit-learn logistic-regression classifier on the planar dataset.

This creates a baseline for comparing a linear classifier with the later non-linear hidden-layer model.

The workflow therefore introduces an important experimental habit: compare a more expressive model against a simpler baseline.

## Verification

### Course-Supplied Public Tests

The assignments import `public_tests.py` and call named test helpers against completed functions.

The repository therefore contains an automated correctness-checking layer, although the test infrastructure itself is supplied by the course.

### Python Assertions

The preprocessing assignment includes assertions that verify flattened image values against expected arrays.

### Expected Outputs

Assignments include expected values for shapes, parameters, costs, and other intermediate results so completed code can be checked against known outputs.

### AutoGrader Contract

The assignment text documents constraints required by the Coursera grader, including preserving function signatures and graded-cell structure.

This provides experience implementing code within an external automated-evaluation contract.

## Engineering Practices

### Functional Decomposition

The learning algorithms are split into functions for:

- activation;
- initialization;
- propagation;
- optimization;
- prediction;
- model integration.

### Vectorization

The assignments explicitly emphasize NumPy vectorization rather than Python loops for core matrix operations.

### Shape Awareness

Matrix and vector dimensions are repeatedly inspected and validated.

This is especially important in the neural-network assignments, where parameter and activation shapes must align across layers.

### Reproducible Parameter Initialization

The assignments use NumPy random seeds around test cases and initialization examples.

### Baseline Comparison

A scikit-learn logistic regression model is used as a baseline before the custom hidden-layer network.

### Automated Exercise Verification

Public tests and expected-output checks provide immediate feedback on graded functions.

## Scale and Complexity

### Repository Scale

The repository spans multiple course weeks, notebooks, exported Python code, datasets, images, helpers, tests, and quizzes.

### Data Scale

The Week 2 image task uses training and testing HDF5 datasets.

### Algorithmic Scale

The progression spans:

- vectorized preprocessing;
- logistic regression;
- optimization;
- forward/backward propagation;
- a one-hidden-layer neural network.

### Authorship Scale

A large portion of repository bytes comes from course-provided material.

The personally relevant evidence is concentrated in completed graded exercise regions and the experience of integrating those functions inside the supplied assignment framework.

## Skills Demonstrated

### Python and Scientific Computing

- **Python — strong coursework evidence.**
- **NumPy — strong evidence.**
- **Jupyter Notebook — strong evidence.**
- **Vectorized computation — strong evidence.**
- **Matrix/array reshaping — strong evidence.**
- **Matplotlib visualization — moderate evidence.**
- **HDF5 dataset workflow — moderate evidence.**

### Machine Learning

- **Binary classification — strong evidence.**
- **Logistic regression — strong hands-on evidence.**
- **Sigmoid activation — strong evidence.**
- **Binary cross-entropy — strong evidence.**
- **Gradient descent — strong evidence.**
- **Parameter initialization — strong evidence.**
- **Model prediction — strong evidence.**
- **Train/test preprocessing — strong evidence.**

### Neural Networks

- **One-hidden-layer neural network — strong evidence.**
- **Tanh hidden activation — strong evidence.**
- **Forward propagation — strong evidence.**
- **Backpropagation — strong evidence.**
- **Gradient-based parameter updates — strong evidence.**
- **Decision-boundary reasoning — moderate evidence.**

### Verification

- **Course-supplied automated tests — strong repository evidence.**
- **Python assertions — strong evidence.**
- **Expected-output verification — strong evidence.**
- **AutoGrader-oriented implementation discipline — strong evidence.**

## Capability Developed

This repository introduces machine learning as a new technical domain in the processed portfolio.

The progression is especially important because the algorithms are not encountered only through high-level APIs.

The assignments require the learner to work through:

- shapes;
- activations;
- costs;
- gradients;
- optimization;
- parameter updates.

The portfolio therefore gains direct educational evidence of the mathematical mechanics underlying basic neural networks.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- machine learning;
- neural networks;
- NumPy;
- Jupyter notebooks;
- supervised binary classification;
- logistic regression as a learning algorithm;
- gradient descent;
- forward propagation;
- backpropagation;
- binary cross-entropy;
- a one-hidden-layer neural network;
- scikit-learn model baseline comparison;
- HDF5 machine-learning datasets.

Python also returns in a very different role from repository 002:

```text
2021 Python
→ text/data preprocessing utilities

2023 Python
→ numerical computing + machine-learning coursework
```

## Historical Significance

`Neural-Networks-and-Deep-Learning-Coursera` marks the first explicit AI/ML-learning phase in the processed chronology.

It establishes a foundation that later machine-learning, computer-vision, or research repositories can be compared against.

The attribution boundary is equally important historically: course scaffolding and tests are external infrastructure, while the completed graded functions provide evidence of hands-on implementation within that framework.

## Overall Repository Narrative

`Neural-Networks-and-Deep-Learning-Coursera` is a structured machine-learning coursework repository covering the first steps from NumPy fundamentals to a manually implemented shallow neural network.

The assignments preprocess image and planar datasets, flatten and normalize numerical features, build logistic regression from sigmoid/cost/gradient components, optimize parameters with gradient descent, and then extend the same reasoning into a one-hidden-layer network with tanh activation, forward propagation, cross-entropy loss, backpropagation, and parameter updates.

Course-supplied datasets, helper utilities, prose, and tests are kept separate from the personally completed graded regions. The result is strong evidence of practical introductory ML training without inflating course infrastructure into original engineering authorship.

# Project Tags

## Project Type

- `course-assignment-repository`
- `machine-learning-coursework`
- `educational-project`

## Collaboration and Authorship

- `individual-project`
- `course-supplied-infrastructure`

## Languages

- `python`

## Machine Learning

- `machine-learning`
- `neural-networks`
- `numpy`
- `jupyter-notebook`
- `binary-classification`
- `logistic-regression`
- `gradient-descent`
- `forward-propagation`
- `backpropagation`
- `binary-cross-entropy`
- `sigmoid`
- `tanh-activation`
- `one-hidden-layer-network`
- `parameter-initialization`
- `model-training`
- `model-prediction`
- `decision-boundary`
- `scikit-learn`
- `vectorization`

## Database and Data

- `image-preprocessing`
- `array-reshaping`
- `hdf5-dataset`
- `train-test-data`
- `data-normalization`

## Testing and Verification

- `course-supplied-tests`
- `python-assertions`
- `autograder-contract`
- `expected-output-verification`

## Software Engineering Practices

- `functional-decomposition`
- `shape-validation`
- `vectorized-computation`

## Portfolio Significance

- `earliest-observed-machine-learning`
- `earliest-observed-neural-networks`
- `earliest-observed-numpy`
- `earliest-observed-jupyter-notebook`
- `earliest-observed-gradient-descent`
- `earliest-observed-backpropagation`
- `earliest-observed-logistic-regression`
