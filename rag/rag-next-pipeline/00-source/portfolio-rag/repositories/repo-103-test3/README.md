# test3

## Repository Identity

- Repository: 103 / 134
- Name: `test3`
- Repository start date: 2026-02-02
- Last meaningful update date: 2026-04-04
- Latest meaningful commit: `5f77f7d9d2338ec43e44d0b3d02ada4e8b511791`
- Primary type: Automated computer-networks lab grading and reference-solution toolkit
- Technical field: Networking education, Mininet, TCP sockets, load balancing, automated verification
- Application domain: University networking-lab evaluation
- Collaboration type: `individual-project-with-course-scaffold`
- Primary languages: Python and Bash
- Major systems: Mininet topology, round-robin load balancer, backend/client sample programs, grading harness

## Collaboration and Authorship Context

The repository README explicitly describes the directory as containing sample solutions for the load-balancer and topology tasks together with a Bash grading script intended to evaluate student submissions.

A second Markdown file reconstructs the assignment specification. That assignment text is instructional/course material and is kept separate from the engineering attribution.

The repository owner is attributed in the commit history, including the latest upload commit. The corpus therefore attributes the grader/tooling integration and retained sample-solution work to the repository owner while distinguishing the assignment specification as supplied instructional context.

## Evidence Basis

The analysis is grounded in:

- `README.md`;
- reconstructed lab specification in `READAME.md`;
- `lab_topology.py`;
- `load_balancer.py`;
- `client.py`;
- `backend_server.py`;
- `grading_script.sh`;
- `verify_output.py`;
- `monitor.py`;
- startup CLI/script assets;
- current commit history.

## What This Project Is

`test3` is an instructional network-lab automation repository centered on a layer-4 load-balancing exercise.

The system builds a Mininet topology with:

- three clients;
- a dual-homed load balancer;
- three backend servers;
- separate client and backend subnets.

The sample load balancer accepts TCP client connections, dispatches requests to backend servers using a thread-safe round-robin index, receives backend results, rewrites backend identity into the expected name, and sends responses back to the correct client connection.

A Bash grader starts the Mininet environment, inspects IP assignments, tests connectivity/isolation, launches backends and the load balancer, executes sequential and concurrent client tests, grades produced CSV rows, and writes aggregate grading output.

## Project Scope

### Mininet Topology

The topology creates:

- clients `h1`, `h2`, `h3` in `10.0.0.0/24`;
- load-balancer client-facing interface `10.0.0.9/24`;
- load-balancer backend-facing interface `20.0.0.2/24`;
- backend servers `b1`, `b2`, `b3` in `20.0.0.0/24`;
- two virtual switches.

The load balancer is modeled as a dual-homed Mininet node.

### Layer-4 Load Balancer

The sample implementation provides:

- TCP listening;
- thread-per-client handling;
- newline-delimited request framing;
- JSON decoding;
- client IP injection;
- shared round-robin backend selection;
- mutex protection around round-robin state;
- backend TCP connection;
- backend response parsing;
- backend IP-to-name normalization;
- client response forwarding.

### Automated Grading

The Bash grading harness checks:

- interface addressing;
- expected reachability;
- expected isolation;
- backend startup;
- load-balancer startup;
- sequential requests;
- concurrent requests;
- per-client output grading;
- summary CSV generation.

### Output Verification

`verify_output.py` checks each output row for:

- request-ID preservation;
- equal client/backend/received vertex counts;
- backend name/IP consistency.

It produces a percentage score and exits non-zero when rows fail.

## Architecture and System Shape

```text
                  grading_script.sh
                        |
          +-------------+-------------+
          |                           |
    Mininet topology              test execution
          |                           |
 clients h1-h3                 sequential clients
       \                           concurrent clients
        \                              |
         +----> load balancer <--------+
                  |
         thread-safe round robin
                  |
        +---------+---------+
        |         |         |
       b1        b2        b3
        |         |         |
        +---------+---------+
                  |
             CSV evidence
                  |
           verify_output.py
                  |
             grades.csv
```

## Technical Stack

### Python

Python implements the Mininet topology, load balancer, client/backend behavior, monitoring, and output verification.

### Bash

The grading harness uses Bash for:

- lifecycle orchestration;
- Mininet process discovery;
- interface inspection;
- connectivity tests;
- process execution;
- sequential/concurrent test coordination;
- CSV aggregation.

### Mininet

Mininet supplies virtual hosts, switches, interfaces, links, namespaces, and the network CLI.

### TCP Sockets

The sample load balancer and endpoint programs use direct TCP sockets.

### JSON

Requests/responses use JSON fields to preserve request IDs, client identity, graph input, backend identity, and computed results.

### tmux / mnexec

The grader uses detached `tmux` sessions and `mnexec` to run programs inside Mininet host namespaces.

## Major Engineering Work

### Dual-Subnet Topology Construction

The topology creates two client/backend networks and a load-balancer host with one interface in each subnet.

This exercises explicit interface addressing rather than relying on automatic topology defaults.

### Thread-Safe Round-Robin Selection

The load balancer maintains a global backend index and protects selection/update with a `threading.Lock`.

This is the central concurrency requirement of the assignment.

### Client Request Framing

The handler accumulates bytes and splits on newline boundaries, allowing multiple framed requests to travel over one client connection.

### Per-Client Concurrency

Every accepted client connection is handled by a daemon thread, allowing the grader to exercise multiple clients concurrently.

### Request Correlation

The JSON communication contract carries request IDs through client, load balancer, backend, and response paths.

The verifier checks that received IDs match original IDs.

### Backend Identity Normalization

Backend IP addresses are mapped to expected symbolic names (`b1`, `b2`, `b3`) before returning results to clients.

### Automated Interface Validation

The grading script enters Mininet namespaces and inspects expected IP addresses on:

- six endpoint interfaces;
- both load-balancer interfaces.

### Automated Connectivity Matrix

The grader computes expected reachability between client, backend, and load-balancer endpoints, runs pings, and compares observed packet-loss values to expected behavior.

### Sequential Request Evaluation

The script runs multiple client rounds one at a time and grades each generated output set independently.

### Concurrent Request Evaluation

Three client workloads are launched concurrently, then their combined results are sliced by client IP and graded independently.

### Programmatic Output Scoring

The verifier calculates row-level correctness and a percentage score, giving the Bash harness a deterministic machine-readable grading signal.

## Verification

### IP-Configuration Checks

The grading harness checks configured addresses against an explicit expected IP map.

### Connectivity Checks

Expected reachability/isolation is exercised through automated pings.

### Sequential Functional Tests

Each client is run repeatedly in the foreground and graded separately.

### Concurrent Functional Tests

Clients are launched together to exercise load-balancer concurrency and request correlation.

### Row-Level Semantic Verification

The verifier validates request IDs, graph/vertex counts, and backend name/IP mapping.

### Exit-Code Integration

Verification exits non-zero when failures occur, enabling shell-level pass/fail orchestration.

## Engineering Practices

### Automated Evaluation

Manual lab checking is converted into a repeatable executable grading workflow.

### Deterministic Network Model

Hostnames, IPs, ports, and subnet boundaries are explicit and reused by the grader.

### Concurrency Safety

Round-robin state is protected by a lock.

### Test Isolation

Sequential CSV output is reset between individual client runs; concurrent output is partitioned by client identity before grading.

### Layer Separation

Topology construction, traffic generation, backend processing, load balancing, grading, and row verification are separated into different files.

### Defensive Process Handling

The Bash script checks for Mininet process IDs, handles existing tmux sessions, cleans previous output, and performs Mininet cleanup at the end.

## Product Engineering

This repository is best understood as educational infrastructure.

Its primary users are a grader/instructor/teaching workflow rather than consumers of a network service.

The main product-facing outcome is reproducibility:

- one command starts the topology;
- network properties are checked automatically;
- workloads are executed;
- outputs are scored;
- summary grades are written to CSV.

## Scale and Complexity

### Topology Scale

The lab contains seven virtual hosts across two L2 domains plus switches.

### Concurrency Scale

The load-balancer service supports concurrent client threads, and the grader explicitly launches three simultaneous workloads.

### Evaluation Scale

The grader evaluates addressing, connectivity, multiple sequential runs, and multiple concurrent runs in one orchestration script.

### Integration Complexity

The repository coordinates:

- Mininet;
- Linux namespaces;
- TCP applications;
- JSON contracts;
- Bash;
- tmux;
- CSV;
- process management;
- Python verification.

## Skills Demonstrated

### Networking

- **Mininet — strong evidence.**
- **Virtual network topology construction — strong evidence.**
- **Layer-4 load balancing — strong evidence.**
- **TCP socket programming — strong evidence.**
- **Network isolation testing — strong evidence.**
- **Multi-interface host configuration — strong evidence.**

### Concurrency

- **Python threading — strong evidence.**
- **Thread-per-client servers — strong evidence.**
- **Mutex-protected shared state — strong evidence.**
- **Concurrent workload testing — strong evidence.**

### Automation

- **Bash automation — strong evidence.**
- **Automated grading — strong evidence.**
- **Namespace process execution — strong evidence.**
- **CSV result aggregation — strong evidence.**

### Verification

- **Machine-readable semantic checks — strong evidence.**
- **Sequential/concurrent integration testing — strong evidence.**
- **Exit-code-driven validation — strong evidence.**

## Capability Developed

The repository moves from implementing networking concepts to building infrastructure that evaluates networking implementations.

That adds a different engineering dimension:

- defining expected behavior;
- orchestrating environments;
- automating tests;
- measuring correctness;
- producing grading outputs.

It combines network programming with developer/test tooling.

## Portfolio Evolution Context

Within the processed corpus, this repository provides especially strong evidence of:

- Mininet-based network automation;
- automated network-lab grading;
- load-balancer correctness verification;
- thread-safe round-robin dispatch;
- automated connectivity/isolation matrices;
- sequential versus concurrent evaluation design.

## Historical Significance

`test3` is significant because the repository is not only a networking implementation. It is a **testing and evaluation system for networking work**.

The code demonstrates the mindset of turning a lab specification into repeatable infrastructure with explicit correctness checks.

## Overall Repository Narrative

`test3` packages a load-balancing networking lab into an executable grading environment.

A Mininet topology creates separated client/backend networks around a dual-homed load balancer. The reference load balancer uses direct TCP sockets and a lock-protected round-robin index. The Bash grader validates topology configuration, launches network services, drives sequential and concurrent workloads, and invokes a Python verifier that checks request correlation and backend consistency.

The result is both a sample implementation and an automated evaluation framework.

# Project Tags

## Project Type

- `instructional-tooling`
- `automated-grader`
- `networking-lab`
- `reference-implementation`
- `individual-project-with-course-scaffold`

## Collaboration and Authorship

- `individual-project-with-course-scaffold`
- `owner-attributed-grader`
- `supplied-assignment-context`

## Languages

- `python`
- `bash`

## Networking

- `mininet`
- `tcp-sockets`
- `layer-4-load-balancer`
- `round-robin-load-balancing`
- `dual-homed-host`
- `network-isolation`
- `multi-subnet-topology`
- `json-protocol`

## Concurrency

- `python-threading`
- `thread-per-client`
- `mutex`
- `shared-state-synchronization`

## Testing and Verification

- `automated-grading`
- `integration-testing`
- `sequential-testing`
- `concurrent-testing`
- `connectivity-testing`
- `semantic-output-validation`
- `exit-code-verification`
- `csv-grading-output`

## Tooling

- `tmux`
- `mnexec`
- `linux-network-namespaces`
- `process-orchestration`

## Portfolio Significance

- `earliest-observed-mininet-grader`
- `earliest-observed-automated-network-lab-grading`
- `earliest-observed-thread-safe-round-robin-grading`
