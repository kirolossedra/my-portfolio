# Repository 093 — NRF-Zephyr

## Repository Identity

- **Repository:** `kirolossedra/NRF-Zephyr`
- **Corpus index:** 093
- **Repository start date:** 2025-09-25
- **Last meaningful update date:** 2025-09-25
- **Latest meaningful commit:** `27bade3f9d64481733adcc3464c125e04aa2a282`
- **Primary repository language:** C
- **Project form:** Zephyr RTOS scheduler/timing study using externally attributed sample code
- **Collaboration classification:** `externally-attributed-source`

## Evidence Basis

The repository contains a minimal root README, an empty RTOS README, and two C source files.

The C files retain explicit Intel Corporation copyright headers.

`rescheduling-based-starv.c` identifies Anas Nashif as an original author.

This attribution is materially important.

The repository cannot be treated as evidence that the owner authored the base scheduler examples from scratch.

The safe portfolio interpretation is that the repository records Zephyr RTOS study, experimentation, or adaptation around externally sourced sample/test code.

The repository name includes `NRF`.

However, the retained C files do not contain nRF-specific peripheral APIs, Nordic SDK calls, BLE configuration, board overlays, or nRF devicetree material.

The current snapshot therefore supports Zephyr/RTOS learning evidence, not an nRF-specific implementation claim.

## What the Project Is

NRF-Zephyr is a compact RTOS learning repository focused on thread scheduling, preemption/cooperation, thread lifecycle operations, sleeping, yielding, busy waits, and timing overhead.

The two retained programs explore different scheduler behaviors.

One demonstrates thread creation and rescheduling interactions among threads with different priorities.

The other exercises timing/scheduling primitives and records timing-oriented output.

The repo is best understood as a systems-learning artifact rather than a product application.

## Project Scope

The retained source covers:

- Zephyr kernel threads;
- thread stacks;
- thread priorities;
- cooperative vs. preemptive behavior;
- suspended-thread creation;
- thread resume;
- current-thread introspection;
- sleeping;
- yielding;
- busy waiting;
- interrupt locking/unlocking;
- timing/latency-oriented measurement.

It does not establish an application-specific Nordic peripheral subsystem in the retained snapshot.

## Architecture / System Shape

There is no application architecture in the conventional web/mobile sense.

The repository is organized as small scheduler experiments.

The first source has a multi-thread relationship:

```text
thread A / thread B / thread C
            ↓
priority + scheduling interactions
            ↓
thread C creates D suspended
            ↓
resume D
            ↓
observe rescheduling behavior
```

The second source is closer to a timing microbenchmark:

```text
kernel timing primitive
        ↓
measure/print elapsed timing behavior
        ↓
compare sleep/yield/busy-wait/interrupt effects
```

## Technical Stack

- C
- Zephyr RTOS
- Zephyr kernel API
- kernel threads
- thread stacks
- priority scheduling
- sleep/yield APIs
- interrupt locks
- busy wait
- timing measurement

## Thread Scheduling Experiment

`rescheduling-based-starv.c` declares multiple thread stacks and thread control structures.

The program creates threads with different priority/scheduling characteristics.

It uses Zephyr thread APIs including:

- `k_thread_create`;
- `k_thread_suspend`/suspended creation semantics;
- `k_thread_resume`;
- `k_current_get`.

The experiment is designed to make rescheduling observable through controlled thread interactions.

The code is valuable for studying what happens when runnable state and priority change during execution.

## Cooperative vs. Preemptive Context

Zephyr distinguishes cooperative and preemptive priorities.

The sample's thread-priority choices expose that scheduler model directly.

This is a lower-level concurrency concept than ordinary application threads managed without explicit RTOS priority semantics.

Understanding it is relevant to embedded systems where latency and task responsiveness matter.

The repository provides study evidence for those concepts even though the base example is externally attributed.

## Suspended Thread Lifecycle

One notable pattern is creating a thread in a suspended state and resuming it later.

This separates allocation/creation from runnable eligibility.

That helps illustrate thread lifecycle control beyond simply “start a thread.”

It also makes scheduler transitions easier to observe.

## Timing Experiment

`sleep.c` explores multiple timing and scheduling operations.

It includes calls around:

- `k_sleep`;
- `k_busy_wait`;
- `k_yield`;
- interrupt lock/unlock;
- thread creation and scheduling.

The code prints timing-oriented observations.

This is useful for understanding the semantic difference between blocking sleep, active waiting, yielding, and critical-section effects.

## Busy Wait vs. Sleep

A busy wait consumes execution capacity while waiting.

A sleep allows the scheduler to run other work.

The source puts both kinds of primitives into one study artifact.

That provides a concrete systems-level comparison rather than treating delay APIs as interchangeable.

## Interrupt Lock Boundary

The timing source uses interrupt locking/unlocking.

This exposes the cost and behavioral implications of preventing interrupt handling over a critical interval.

The repository should not be described as implementing a complete interrupt-driven device driver.

The supported claim is narrower: kernel interrupt-lock behavior is part of the scheduler/timing experiment.

## External Provenance and Attribution

The source headers are the strongest authorship evidence in this repository.

They explicitly attribute the base material externally.

The corpus therefore distinguishes:

```text
repository ownership / study use
≠
original authorship of the retained sample source
```

This is consistent with the corpus's collaboration/authorship rules.

A portfolio can legitimately include study artifacts, but they must not be represented as owner-written systems code when the source says otherwise.

## NRF Naming Boundary

The repository name suggests an intended Nordic/Zephyr learning context.

Names are weak evidence compared with source.

The retained programs do not show:

- nRF52/nRF53 register work;
- BLE host/controller setup;
- Nordic radio APIs;
- GPIO peripheral control;
- board-specific devicetree overlays.

Therefore the final tags emphasize Zephyr RTOS and scheduler study.

They do not tag a specific nRF peripheral implementation.

## Major Engineering / Learning Work

### Scheduler Semantics

The repository captures concrete examples of runnable state, priorities, and rescheduling.

### Timing Primitive Comparison

Sleep, busy-wait, yield, and interrupt-lock behavior are exposed as distinct mechanisms.

### Thread Lifecycle

Suspended creation and later resume demonstrate explicit lifecycle control.

### Source Reading / Systems Study

Because the base samples are external, an important demonstrated activity is reading and working through production RTOS test/example code.

That is different from original implementation but still relevant systems-learning evidence.

## Testing & Verification

The source itself is test/sample-oriented code designed to make kernel behavior observable.

Printed execution/timing output is the primary verification mechanism.

The corpus does not claim owner-authored unit tests around these examples.

The important verification boundary is provenance rather than absence of a testing framework.

## Engineering Discipline

The strongest discipline visible here is attribution preservation.

The original copyright and author headers remain intact.

That allows downstream analysis to correctly separate source ownership from study activity.

Technically, the examples also use explicit stack allocation, priorities, and kernel APIs rather than abstracting scheduler behavior away.

## Product Engineering

This repository is not an end-user product.

Its output is learning/experimental understanding of RTOS scheduling semantics.

The value is in systems behavior and embedded-concurrency concepts rather than UI or business workflow.

## Scale / Complexity

The codebase is small.

The conceptual complexity is higher than its line count because RTOS scheduling depends on priority, runnable state, preemption semantics, timing, and interrupt behavior.

The repository should still be represented as a compact study artifact rather than an embedded product codebase.

## Skills Demonstrated

Evidence supports familiarity/study with:

- Zephyr RTOS kernel APIs
- C systems code
- RTOS threads
- thread priorities
- cooperative scheduling
- preemptive scheduling
- suspend/resume lifecycle
- sleeping
- yielding
- busy waiting
- interrupt locking
- timing/latency observation
- reading externally authored embedded-system sample code
- preserving source attribution

## What Was Learned / Capability Developed

The repository develops intuition about why RTOS timing primitives are not interchangeable.

It also exposes how priority and runnable state determine which embedded task executes.

Those concepts are foundational for later real-time firmware work, especially when radio, sensor, or control tasks compete for bounded response time.

The repository's educational value is systems semantics rather than original algorithm creation.

## Portfolio Evolution Context

Earlier repositories already contained bare-metal/embedded C, AUTOSAR-oriented work, Verilog, and operating-system/Linux study.

NRF-Zephyr adds explicit RTOS kernel scheduling semantics to that trajectory.

Later portfolio work with Nordic boards and Zephyr can build on this foundation, but this snapshot itself should remain narrowly described.

## Historical Significance

Within the processed corpus, this is the clearest early repository centered specifically on Zephyr RTOS scheduler/timing primitives.

It marks a shift from general embedded/system exercises toward a named modern RTOS environment.

The source provenance simultaneously demonstrates why the corpus needs explicit authorship boundaries for learning repositories.

## Limitations & Missing Evidence

The current retained source is externally attributed sample/test material.

There is insufficient evidence to claim original owner authorship of the scheduler examples.

The repository name alone does not establish nRF hardware integration.

These are the two central evidence boundaries and should remain attached to any retrieval from this repository.

## Overall Narrative

NRF-Zephyr is a compact Zephyr RTOS study repository built around externally attributed kernel scheduling/timing examples.

It provides evidence of work with Zephyr threads, priorities, preemption/cooperation, suspend/resume lifecycle, sleep/yield/busy-wait behavior, interrupt locking, and timing observation.

Its portfolio value is RTOS learning and source-level systems study—not proof of an owner-authored nRF firmware application.

# Project Tags

`externally-attributed-source`, `c`, `zephyr`, `zephyr-rtos`, `rtos`, `embedded-systems`, `kernel-threads`, `thread-scheduling`, `priority-scheduling`, `cooperative-scheduling`, `preemptive-scheduling`, `thread-suspend`, `thread-resume`, `thread-lifecycle`, `k-thread-create`, `k-sleep`, `k-yield`, `k-busy-wait`, `interrupt-lock`, `timing-measurement`, `latency-study`, `scheduler-study`, `external-intel-source`, `external-anas-nashif-attribution`, `source-study`, `nrf-name-without-nrf-specific-source`, `earliest-observed-zephyr-rtos-scheduler-study`
