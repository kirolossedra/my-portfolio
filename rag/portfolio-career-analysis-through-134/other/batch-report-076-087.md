# Batch Report — Repositories 076–087

## Scope

This batch processes exactly twelve repositories in fixed GitHub creation chronology. The same anti-compression and anti-inflation rules used through Repository 075 are preserved.

## Repository ledger

| Repo | Name | Lines | Words | H2 | Maturity | Portfolio Weight |
|---:|---|---:|---:|---:|---:|---:|
| 076 | `ME-780-Machine-Learning-in-Engineering` | 1,004 | 9,244 | 57 | 0.0/5 | 0.4/5 |
| 077 | `Demotic-OCR` | 1,005 | 9,175 | 57 | 0.0/5 | 0.4/5 |
| 078 | `Habit-Tracker` | 1,028 | 10,031 | 57 | 2.2/5 | 2.7/5 |
| 079 | `Word-Tracker` | 1,025 | 10,017 | 57 | 2.4/5 | 3.0/5 |
| 080 | `LeetCodeJava` | 1,027 | 10,092 | 57 | 2.6/5 | 3.5/5 |
| 081 | `Matlab-Experiments` | 1,030 | 10,140 | 57 | 2.8/5 | 3.6/5 |
| 082 | `NS3` | 1,034 | 10,160 | 57 | 2.8/5 | 3.7/5 |
| 083 | `Reinforcement-Learning` | 1,035 | 10,181 | 57 | 3.0/5 | 4.0/5 |
| 084 | `SDR` | 1,046 | 10,664 | 57 | 3.4/5 | 4.5/5 |
| 085 | `ViT` | 1,029 | 10,130 | 57 | 2.3/5 | 3.2/5 |
| 086 | `NetSeer` | 1,034 | 10,170 | 57 | 2.8/5 | 3.7/5 |
| 087 | `Milestone` | 1,041 | 10,502 | 57 | 2.6/5 | 4.0/5 |

**Batch total:** 12,338 lines / 120,506 words.

## High-value provenance and correction notes

- Repos076–077 are title/minimal-README placeholders. They receive no ML/OCR implementation credit.
- Repo079 is the first direct Firebase Realtime Database evidence found in the processed corpus.
- Repo080 is not Java-only: current metadata names Python as the primary language and the tree contains both Python and Java solutions.
- Repo082 is C++ ns-3 code stored in `.pp` files; GitHub’s Pascal classification is an extension heuristic. The directory named `multicast` contains an inspected unicast experiment, so multicast implementation credit is withheld.
- Repo083 is tabular Q-learning with heuristics and replay, not DQN/deep RL.
- Repo084 contains environment documentation with sensitive machine/network identifiers. Those identifiers are intentionally not reproduced in this corpus.
- Repo085 uses pretrained ViT/ResNet/BEiT models; pretrained integration is not converted into architecture/pretraining authorship.
- Repo087 uses Firebase but implements password storage with unsalted client-side SHA-256 and a client-visible authority flow; functionality does not erase the security defect.

## Next fixed batch

Repositories **088–099**:
1. `FlashWare`
2. `ME-780-Project`
3. `LanguageStudy`
4. `assignment`
5. `BroadcastInAndroid`
6. `Life-in-Christ`
7. `NLP-Project`
8. `Quizedra`
9. `Robotics-Project`
10. `NLP_ENDPOINT`
11. `RogersExperiment`
12. `Coptic`
