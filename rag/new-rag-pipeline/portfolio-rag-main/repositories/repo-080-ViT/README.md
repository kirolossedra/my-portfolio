# Repository 080 — ViT

## Repository Identity

- **Repository:** `kirolossedra/ViT`
- **Repository start date:** 2025-03-19
- **Last meaningful update date:** 2025-03-19
- **Latest meaningful commit:** `a7f19a875bdf95432007bd7558aebebcfe9c89b9`
- **Primary technical field:** computer-vision model evaluation
- **Application domain:** pretrained image-classification architecture comparison
- **Primary technologies:** Python, Jupyter Notebook, PyTorch, torchvision, timm
- **Project context:** personal ML experiment
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains:

- a minimal root README,
- one executed Jupyter notebook: `VisionTransformers.ipynb`.

The notebook is the substantive artifact.

Its stored outputs show that it was executed.

The analysis below is limited to behavior and outputs present in that notebook.

## What the Project Is

The notebook evaluates several pretrained image-classification architectures on an ImageNet-style validation subset.

The compared model families are:

- Vision Transformer,
- ResNet-50,
- BEiT-V2.

The experiment does not train these networks from scratch.

It loads pretrained models using `timm`, runs inference, and compares:

- Top-1 accuracy,
- Top-5 accuracy,
- inference time.

This is a model-evaluation exercise.

## Dataset Loading

The notebook uses `torchvision.datasets.ImageFolder`.

The stored execution output reports:

```text
Total samples: 50,000
Number of classes: 1,000
Subset samples: 5,000
```

The experiment selects a 10% subset.

A fixed NumPy seed is used before choosing the subset indices.

That improves repeatability of the selected sample set.

## Preprocessing

The preprocessing pipeline matches common ImageNet inference preprocessing.

It includes:

- resize to 256,
- center crop to 224,
- tensor conversion,
- ImageNet normalization.

The normalization means are:

```text
[0.485, 0.456, 0.406]
```

and the standard deviations are:

```text
[0.229, 0.224, 0.225]
```

The subset is loaded through a PyTorch `DataLoader`.

## Hardware Selection

The notebook chooses:

```python
cuda if available else cpu
```

The stored output reports that CUDA was used for the recorded run.

This is direct evidence of GPU-backed inference in that execution.

## Model Loading

The notebook uses `timm.create_model(..., pretrained=True)`.

Visible model constructors include:

- `vit_base_patch16_224`,
- `resnet50`,
- `beitv2_large_patch16_224`.

Each model is:

1. created with pretrained weights,
2. moved to the selected device,
3. placed in evaluation mode.

This is inference/evaluation, not fine-tuning.

## Evaluation Metrics

The notebook computes classification accuracy and timing.

Stored output reports the following values for that run:

| Model label in notebook output | Top-1 | Top-5 | Inference time |
|---|---:|---:|---:|
| ViT-Base | 80.30% | 95.60% | 48.76 s |
| ResNet-50 | 78.76% | 94.18% | 24.29 s |
| BEiT label | 87.70% | 98.42% | 121.97 s |

These numbers are retained as results from the checked-in notebook execution.

They should not be generalized into universal model-performance claims.

## Model-Label Inconsistency

There is a naming inconsistency inside the notebook evidence.

The model creation code uses:

```text
beitv2_large_patch16_224
```

while the printed result labels refer to a BEiT base label in some output text.

The corpus therefore records the constructor exactly and avoids treating the printed label as a definitive architecture identifier.

This is an important evidence-quality boundary.

## Vision Transformer Evidence

The project directly uses a pretrained Vision Transformer.

The constructor:

```text
vit_base_patch16_224
```

indicates:

- base-size ViT family,
- patch size 16,
- 224-pixel input.

The notebook does not implement the transformer architecture manually.

The demonstrated skill is loading, preprocessing for, and evaluating a pretrained ViT.

## CNN Baseline

ResNet-50 is included as a convolutional baseline.

This allows the experiment to compare a transformer-based architecture against a mature CNN architecture under a shared inference pipeline.

The design is more informative than evaluating ViT alone.

## BEiT-V2 Comparison

The third model adds another transformer-family architecture.

Using multiple model families enables comparison along at least two axes:

- predictive accuracy,
- execution cost.

The stored timings show that the models differ substantially in inference duration for this run.

Again, these are run-specific observations.

## Evaluation Pipeline

The core workflow is:

```text
ImageFolder dataset
→ deterministic 10% subset
→ standardized transform
→ DataLoader
→ pretrained model load
→ GPU inference
→ Top-1 / Top-5 calculation
→ elapsed-time measurement
```

This is a compact end-to-end evaluation pipeline.

## Testing and Verification

The notebook's verification evidence is the persisted execution output.

It demonstrates that:

- the dataset loaded,
- 1,000 classes were recognized,
- the 5,000-sample subset was created,
- CUDA execution was available,
- the models loaded,
- inference completed,
- metrics were printed.

Notebook outputs provide execution provenance but are not a substitute for a multi-run benchmark protocol.

## Reproducibility

The notebook provides several reproducibility ingredients:

- fixed subset fraction,
- fixed random seed,
- explicit preprocessing,
- explicit model identifiers,
- explicit batch size,
- stored output.

The dataset itself is referenced by a local path and is not contained in the repository.

Reproduction therefore requires a matching ImageNet-style directory.

## Engineering Discipline

The notebook isolates a clear question:

> how do several pretrained image classifiers compare on the same validation subset?

It uses the same:

- dataset,
- preprocessing,
- loader,
- device selection,
- evaluation logic

for each model.

That is an appropriate comparative-experiment structure.

## Scale and Complexity

The repository is small in source size but computationally nontrivial.

The stored execution uses:

- 5,000 validation images,
- 1,000 classes,
- three large pretrained models,
- GPU inference.

This is model-evaluation scale rather than software-system scale.

## Skills Demonstrated

Directly supported skills include:

- PyTorch,
- torchvision,
- timm,
- Jupyter Notebook,
- image classification,
- ImageNet preprocessing,
- Vision Transformers,
- ResNet,
- BEiT-V2,
- pretrained-model inference,
- CUDA inference,
- DataLoader construction,
- dataset subsampling,
- Top-1 accuracy,
- Top-5 accuracy,
- inference-time measurement,
- comparative model evaluation.

## Capability Developed

The repository demonstrates the ability to set up a controlled model-comparison workflow.

That includes:

- preparing data consistently,
- choosing an evaluation subset,
- loading different architectures,
- moving them to an accelerator,
- switching to evaluation mode,
- computing classification metrics,
- measuring execution time,
- interpreting accuracy/latency tradeoffs.

## Portfolio Evolution Context

Earlier corpus projects establish:

- neural-network fundamentals,
- TensorFlow/Keras,
- sequence models,
- browser ML deployment.

This project broadens the ML portfolio into modern pretrained computer-vision architectures in PyTorch.

It also introduces a direct transformer-vs-CNN image-classification comparison.

## Historical Significance

Within the processed corpus, this is the earliest direct evidence of:

- Vision Transformer evaluation,
- `timm`,
- BEiT-V2,
- PyTorch-based pretrained image-classification comparison,
- Top-1/Top-5 multi-model evaluation.

## Evidence Boundaries

The notebook evaluates pretrained models.

It does not establish training or fine-tuning of ViT/BEiT from scratch.

The stored accuracy/timing values are observations from one saved notebook execution.

The BEiT printed label is internally inconsistent with the constructor, so the constructor is treated as the stronger architecture evidence.

## Overall Narrative

`ViT` is a focused computer-vision evaluation experiment.

It builds a consistent ImageNet-style inference pipeline and compares pretrained ViT, ResNet-50, and BEiT-V2 models on a 5,000-image subset using CUDA.

Its portfolio value comes from model-evaluation methodology and architecture comparison rather than model implementation from first principles.

# Project Tags

- `individual-project`
- `computer-vision`
- `model-evaluation`
- `python`
- `jupyter-notebook`
- `pytorch`
- `torchvision`
- `timm`
- `vision-transformer`
- `vit`
- `resnet50`
- `beit-v2`
- `imagenet`
- `image-classification`
- `pretrained-models`
- `cuda`
- `gpu-inference`
- `dataloader`
- `dataset-subsampling`
- `top-1-accuracy`
- `top-5-accuracy`
- `inference-time`
- `comparative-evaluation`
