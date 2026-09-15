# Repository 046 — Matlab-Datascience

## Repository Identity

- **Repository:** `kirolossedra/Matlab-Datascience`
- **Repository start date:** 2024-09-20
- **Last meaningful update date:** 2024-09-21
- **Primary implementation language:** MATLAB
- **Primary domain:** deep-learning architecture experiments
- **Core APIs:** MATLAB Deep Learning Toolbox-style layers, `dlnetwork`, `trainnet`
- **Collaboration classification:** individual repository
- **Repository shape:** two compact architecture/training scripts

## What This Project Is

`Matlab-Datascience` is a very small MATLAB repository containing two neural-network architecture experiments:

- `ResNet.m`,
- `CNN-LSTM`.

Despite the repository's tiny file count, the scripts contain substantive model-graph construction and training logic.

The work explores:

- residual-style convolutional branches,
- multi-input network composition,
- CNN feature extraction,
- LSTM sequence modeling,
- training/validation splitting,
- Adam optimization.

## `ResNet.m`

`ResNet.m` constructs a custom network graph using MATLAB deep-learning layers.

A repeated branch includes:

- image input,
- convolution,
- batch normalization,
- ReLU,
- addition layers,
- max pooling.

Channel depth increases through:

- 8 filters,
- 16 filters,
- 32 filters,
- 64 filters.

This is a staged convolutional feature extractor.

## Residual Connections

The script uses `additionLayer` nodes and explicit `connectLayers` calls.

Earlier convolution outputs are routed into later addition layers.

That is residual/skip-connection structure rather than a plain sequential CNN.

The implementation manually controls graph connectivity through a `dlnetwork`.

## Multiple Input Branches

The script adds the repeated branch three times.

It then connects the three branch outputs into a three-input `additionLayer`.

The merged graph feeds:

- a fully connected layer with 12 outputs,
- softmax.

This is a multi-input CNN graph.

## Physics of Network Shape

The script uses explicit input dimensions:

`[90 189 1]`.

Repeated pooling progressively reduces spatial dimensions before branch combination.

The implementation therefore depends on compatible tensor geometry across the repeated branches.

## `CNN-LSTM`

The second file explores sequence-aware classification.

It contains both commented experimental code and an active CNN-LSTM architecture.

The active path loads:

`allData.mat`.

It then performs randomized label-based splitting into:

- training,
- validation,
- test partitions.

## Data Preparation

The script uses `splitlabels`.

It randomizes index order with `randperm`.

Training and validation rows are converted to `arrayDatastore`.

This is a concrete supervised-learning data pipeline.

## CNN Feature Branches

The active architecture defines a repeated CNN branch with:

- image input,
- convolution,
- batch normalization,
- ReLU,
- max pooling.

Filter counts increase from 8 through 64.

The branch is instantiated three times.

Their outputs feed one multi-input addition layer.

## CNN-to-LSTM Bridge

After branch merging, the network uses:

- `flattenLayer`,
- `lstmLayer(100, 'OutputMode','last')`,
- `fullyConnectedLayer(12)`,
- `softmaxLayer`.

This combines spatial feature extraction with recurrent sequence modeling.

## Training Configuration

The script configures Adam training with:

- initial learning rate `5e-4`,
- 3 epochs,
- mini-batch size 32,
- validation data,
- validation frequency 40,
- accuracy metric,
- training-progress plots.

The network is trained with:

`trainnet(..., "crossentropy", options)`.

This is full framework-level training code.

## Network Inspection

The script calls:

- `plot(misoCNN)`,
- `analyzeNetwork(misoCNN)`.

These provide visual/structural inspection of the composed network graph.

## Source-Recorded Accuracy

A source comment states:

`this one works and has accuracy 97.22`.

The corpus records that as a repository-authored result note.

It is not treated as an independently reproduced benchmark.

The file does not provide enough contextual metadata in the visible source to fully characterize:

- exact dataset version,
- class balance,
- test protocol,
- whether 97.22 refers to validation or test accuracy.

## Earlier LSTM Experiment

A commented section contains an alternative direct sequence-input LSTM experiment.

It uses:

- `sequenceInputLayer`,
- batch normalization,
- ReLU,
- LSTM,
- fully connected output,
- softmax.

This preserves experimentation history.

Because it is commented out in the current file, the corpus distinguishes it from the active CNN-LSTM path.

## Engineering Work Evidenced

The repository positively demonstrates:

- MATLAB deep-learning graph construction,
- `dlnetwork`,
- convolutional models,
- residual/skip connections,
- multi-input networks,
- CNN-LSTM composition,
- LSTM layers,
- randomized data splitting,
- datastore construction,
- Adam optimization,
- cross-entropy training,
- validation monitoring,
- network visualization/analysis.

## Verification Evidence

Verification is experiment-oriented.

The repository includes:

- network plotting,
- network analysis,
- validation configuration,
- accuracy metric configuration,
- a recorded accuracy comment.

There is no automated software test suite.

No saved model artifact is checked in.

## Skills Demonstrated

### MATLAB

- matrix/data manipulation
- Deep Learning Toolbox-style APIs
- datastores
- network graph APIs

### Deep Learning

- CNNs
- residual connections
- LSTMs
- multi-input networks
- classification
- train/validation/test splitting

### Experimentation

- architecture iteration
- network visualization
- validation metrics
- hyperparameter configuration

## Capability Developed

This repository develops the ability to design non-trivial neural architectures as explicit graphs rather than only sequential stacks.

The key capabilities are:

- branch reuse,
- skip connections,
- branch fusion,
- spatial-to-sequence transition,
- supervised training configuration.

## Portfolio Evolution

Historically, this repository follows `Tensor-Flow-Basics` by roughly three weeks.

The framework changes from TensorFlow/Keras notebooks to MATLAB network-graph construction.

The model concepts also become more compositional:

- residual paths,
- repeated input branches,
- CNN-LSTM fusion.

## Historical Significance

Within the processed corpus, this is the earliest observed repository using MATLAB `dlnetwork` graph composition.

It is also the earliest observed checked-in CNN-LSTM architecture.

## Limitations

Only two files are present.

No README documents dataset provenance or experimental context.

The recorded 97.22 accuracy is not accompanied by a reproducible evaluation report.

No dependency/environment specification is present.

No model checkpoint is committed.

No automated software tests are present.

## Overall Narrative

`Matlab-Datascience` is a compact but technically dense neural-network experimentation repository.

It moves beyond introductory sequential classifiers into manually connected network graphs with repeated CNN branches, residual additions, multi-input fusion, LSTM sequence modeling, and explicit training configuration.

Its strongest portfolio value is architectural experimentation, not product integration.

# Project Tags

- `individual-project`
- `matlab`
- `machine-learning`
- `deep-learning`
- `convolutional-neural-network`
- `lstm`
- `cnn-lstm`
- `residual-network`
- `skip-connections`
- `multi-input-network`
- `dlnetwork`
- `trainnet`
- `batch-normalization`
- `max-pooling`
- `adam`
- `cross-entropy`
- `train-validation-test-split`
- `validation-data`
- `network-visualization`
- `model-training`
- `experimental-result-documentation`
