# Tag Ontology Extensions — Repositories 076–082

This file extends the persistent portfolio RAG tag vocabulary for repositories 076 through 082.

The tags below are factual retrieval metadata. They do not represent ratings, seniority, or unsupported capability claims.

## Algorithm Practice

- `game-theory` — implementation evidence involving strategic multi-agent or adversarial outcome reasoning.
- `minimax` — optimal-play reasoning equivalent to maximizing an outcome against an optimal opponent.
- `zero-sum-game` — a game formulation where one player's advantage corresponds to the other's disadvantage.
- `judge-verified-solutions` — solution implementations evaluated by an external online programming judge.

## Network Simulation

- `ns-3` — direct use of the ns-3 network simulator API.
- `network-simulation` — programmable simulation of network topology, protocol behavior, or traffic.
- `wifi-simulation` — simulated Wi-Fi infrastructure or wireless traffic behavior.
- `wifi-802-11g` — explicit 802.11g configuration.
- `pcap` — packet-capture generation or handling using PCAP format/workflows.
- `rts-cts` — explicit RTS/CTS thresholding or behavior in a wireless experiment.
- `throughput-experiment-automation` — scripted repeated experiment execution with automatic throughput extraction.
- `parameterized-simulation` — simulation behavior controlled through runtime parameters rather than source edits.
- `per-user-throughput` — measurement or derivation of throughput normalized per simulated/real user.

## Reinforcement Learning

- `reinforcement-learning` — implementation of an agent learning from environment outcomes/rewards.
- `q-learning` — direct Q-learning update implementation.
- `tabular-q-learning` — Q-learning represented with discrete states/actions and an explicit table/dictionary of Q-values.
- `epsilon-greedy` — epsilon-greedy exploration/exploitation action selection.
- `epsilon-decay` — explicit reduction of epsilon during learning.
- `state-discretization` — conversion of continuous or large state values into discrete bins.
- `reward-shaping` — explicit task reward design used to guide agent behavior.
- `experience-replay` — storage and later resampling of prior transitions for additional learning updates.
- `pygame` — direct implementation using the Pygame framework.
- `physics-informed-learning` — engineered learning state/heuristics derived from physical-model information.
- `agent-environment-loop` — an implemented control loop connecting agent actions, environment transitions, reward, and updates.

## Research Networking Tooling

- `udp-broadcast` — direct UDP broadcast traffic generation or reception.
- `traffic-generation` — code designed to generate controlled network traffic.
- `send-rate-control` — explicit pacing/throttling of generated network traffic.
- `burst-measurement` — grouping received traffic into timed bursts for metric calculation.
- `multithreading` — direct use of multiple software threads for concurrent work.
- `thread-synchronization` — locks, events, joins, queues, or equivalent concurrency coordination.
- `thread-safe-queue` — queue-based communication designed to isolate worker threads from shared/UI state.
- `research-tooling` — software primarily created to execute, control, or measure research experiments.
- `research-methodology` — repository evidence explicitly tracking experimental-methodology quality/revision.
- `conference-paper-preparation` — repository evidence of preparing or revising work for conference-paper submission.

## Computer Vision Evaluation

- `pytorch` — direct use of the PyTorch framework.
- `torchvision` — direct use of torchvision datasets/transforms or models.
- `timm` — direct use of PyTorch Image Models (`timm`).
- `vision-transformer` — direct use/evaluation of a Vision Transformer architecture.
- `vit` — Vision Transformer family retrieval alias.
- `resnet50` — direct use/evaluation of ResNet-50.
- `beit-v2` — direct use/evaluation of a BEiT-V2 model constructor.
- `imagenet` — ImageNet/ImageNet-style 1,000-class evaluation context.
- `cuda` — direct GPU execution through CUDA as evidenced by code/output.
- `gpu-inference` — inference execution on GPU.
- `top-1-accuracy` — Top-1 classification accuracy measurement.
- `top-5-accuracy` — Top-5 classification accuracy measurement.
- `comparative-evaluation` — multiple models evaluated through a shared data/evaluation pipeline.

## AI-Assisted Product Development

- `ai-assisted-development` — commit or source history explicitly records use of generative AI during implementation iteration.
- `ai-hallucination-debugging` — repository history explicitly records identifying/correcting hallucinated or faulty AI-generated implementation.
- `web-crypto-api` — direct use of the browser Web Crypto API.
- `authority-gating` — application behavior that gates access/navigation based on stored authority data.
- `bottleneck-detection` — rule-based detection of stalled/problematic progress state in an application.

## LAN File Transfer

- `lan-file-transfer` — application-level file transfer between peers on a local network.
- `network-interface-discovery` — enumeration of local host network interfaces/IPv4 configuration.
- `subnet-calculation` — explicit network-address/host-range calculation from IP and netmask.
- `subnet-scanning` — scanning addresses across a subnet for active peers.
- `ping-scan` — host discovery based on ping execution.
- `tcp` — direct TCP socket programming.
- `custom-application-protocol` — personally implemented message/control semantics layered over sockets.
- `transfer-negotiation` — request/accept/decline coordination before a file transfer.
- `file-streaming` — chunked file byte transmission over a network socket.
- `transfer-progress` — user-facing progress tracking for a file/network transfer.
- `tkinterdnd2` — direct use of TkinterDnD2 for desktop drag-and-drop.
- `pyinstaller` — Python executable packaging environment/tooling.
- `packaged-executable` — checked-in compiled/packaged executable supporting distribution/execution evidence.

## Earliest-Observed Additions in This Batch

Within the processed corpus, the following are earliest observed here:

- `game-theory` → repository 076
- `minimax` → repository 076
- `zero-sum-game` → repository 076
- `ns-3` → repository 077
- `network-simulation` → repository 077
- `wifi-simulation` → repository 077
- `udp` → repository 077
- `pcap` → repository 077
- `rts-cts` → repository 077
- `reinforcement-learning` → repository 078
- `q-learning` → repository 078
- `tabular-q-learning` → repository 078
- `epsilon-greedy` → repository 078
- `experience-replay` → repository 078
- `pygame` → repository 078
- `multithreading` → repository 079
- `tkinter` → repository 079
- `pytorch` → repository 080
- `timm` → repository 080
- `vision-transformer` → repository 080
- `beit-v2` → repository 080
- `cuda` → repository 080
- `ai-assisted-development` → repository 081
- `ai-hallucination-debugging` → repository 081
- `web-crypto-api` → repository 081
- `lan-file-transfer` → repository 082
- `tcp` → repository 082
- `subnet-scanning` → repository 082
- `transfer-negotiation` → repository 082
- `file-streaming` → repository 082
- `tkinterdnd2` → repository 082

Two pre-existing concepts are also backfilled in the machine manifest where the prior earliest map omitted them despite earlier corpus evidence:

- `dynamic-programming` → repository 009
- `matlab` → repository 046
