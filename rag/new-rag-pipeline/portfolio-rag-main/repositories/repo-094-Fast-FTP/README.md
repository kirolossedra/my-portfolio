# Repository 094 — Fast-FTP

## Repository Identity

- **Repository:** `kirolossedra/Fast-FTP`
- **Corpus index:** 094
- **Repository start date:** 2025-10-07
- **Last meaningful update date:** 2025-10-07
- **Latest meaningful commit:** `ef1df3f29b7f4abc6b41b220ffe456594cdcf9d7`
- **Actual substantive implementation language:** Swift
- **Project form:** native FTP upload/client experiment
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains a minimal README and two substantive source filenames: `MainController.m` and `My.swift`.

The two files resolve to the same retained blob content.

Despite the `.m` filename and GitHub language signal, the source syntax is Swift.

It uses Swift declarations such as `@objc class`, optionals, `Data`, and `InputStream`/`OutputStream` APIs.

This is an important language-classification correction for the corpus.

The implementation manually coordinates FTP control and passive data connections.

It sends protocol commands and parses numeric FTP reply codes.

The transport is plain FTP.

The source does not establish SFTP or FTPS encryption.

## What the Project Is

Fast-FTP is a native Apple-platform FTP upload experiment written in Swift.

Rather than delegating the entire transfer to a high-level FTP SDK, the controller manages protocol state around Foundation streams.

The implementation connects to an FTP server, authenticates, switches to binary transfer mode, enters passive mode, opens the negotiated data channel, sends a `STOR` command, transmits file bytes, and computes transfer performance.

The repository is small, but the retained code directly exposes FTP control/data-channel mechanics.

## Project Scope

The implemented workflow includes:

- TCP stream creation through Foundation;
- FTP control-channel connection;
- greeting handling;
- `USER`/`PASS` authentication flow;
- binary transfer mode using `TYPE I`;
- passive mode using `PASV`;
- parsing the server-provided passive address/port;
- opening a separate data connection;
- sending `STOR`;
- uploading file bytes;
- handling transfer-completion replies;
- elapsed-time measurement;
- throughput calculation in Mbps;
- basic transfer state management.

The source is focused on upload rather than a broad FTP client feature set.

## Architecture / System Shape

Classic FTP uses separate control and data channels.

The implementation mirrors that explicitly:

```text
local file
   ↓
Swift controller
   ├──────── control stream ────────→ FTP server :21
   │         USER/PASS/TYPE/PASV/STOR
   │
   └──────── passive data stream ───→ negotiated server port
                                      ↓
                                  file payload
```

This dual-channel model is the central architecture of the repository.

The controller coordinates protocol progression according to server response codes.

## Technical Stack

- Swift
- Foundation
- `InputStream`
- `OutputStream`
- `StreamDelegate`
- FTP
- TCP streams
- passive FTP
- binary file transfer
- timing/throughput calculation
- Apple run loop integration

## FTP Control State

The source sends protocol commands in sequence rather than writing all commands blindly.

It reacts to standard response codes including:

- `220` service ready;
- `331` password required;
- `230` authentication successful;
- `227` entering passive mode;
- `150` / `125` data-transfer startup;
- `226` / `250` completion-oriented responses.

This is evidence of protocol-state reasoning.

The controller is not merely opening a socket and streaming bytes under an FTP label.

## Authentication Flow

The implementation sends `USER` and `PASS` commands.

Credentials in the retained example are simple/test-oriented.

This establishes protocol authentication mechanics, not secure credential handling.

Because FTP control traffic is plaintext unless protected by another mechanism, username/password use should not be described as encryption.

## Binary Transfer Mode

The source sends:

```text
TYPE I
```

This selects image/binary mode.

That matters for arbitrary file payloads because ASCII-mode transformations could corrupt binary content.

It is a small but protocol-correct implementation detail.

## Passive Mode

The source issues `PASV` and parses the server's `227` response.

The response encodes an IPv4 address and port components.

The implementation extracts those components and computes the passive data port from `p1` and `p2`.

It then opens a separate stream pair to the passive endpoint.

This is one of the strongest technical features in the repository because it demonstrates understanding of FTP's separate data connection.

## Upload Flow

After the data channel is prepared, the controller sends `STOR` with a remote filename.

The local file is loaded into `Data`.

The payload is then written over the data output stream.

The source tracks transfer state so control-channel replies can be interpreted in context.

The implementation therefore coordinates application protocol and data transfer rather than treating the connection as generic TCP.

## Throughput Measurement

The controller records transfer timing.

It converts payload size and elapsed time into Mbps.

This ties the file-transfer experiment to a performance-measurement concern that becomes much larger in repository 095.

The metric is an application-observed transfer rate.

It is not a physical-layer throughput measurement.

## Stream / Run Loop Integration

Foundation streams are scheduled on the main run loop.

The controller conforms to `StreamDelegate`.

That means protocol progress is event-driven by stream activity rather than implemented as one blocking procedural socket loop.

This is relevant Apple-platform networking experience.

It also means long operations and UI integration would need care if this controller were expanded into a complete application.

## Language Classification Boundary

`MainController.m` has an Objective-C-style filename extension.

Its contents are Swift.

`My.swift` contains the same implementation blob.

The repository therefore has inconsistent file naming/history.

For retrieval, the implementation should be tagged `swift` rather than inferred as Objective-C from the filename or GitHub primary-language metadata.

This is exactly the kind of corpus-cleaning correction that raw repository metadata cannot provide reliably.

## Security Boundary

The protocol implemented is FTP.

There is no TLS negotiation in the retained controller.

There is no SSH transport.

There is no SFTP subsystem.

Therefore tags such as `encrypted-file-transfer`, `ftps`, or `sftp` would be unsupported.

The project demonstrates FTP mechanics and transfer performance, not secure file-transfer protocol design.

## Major Engineering Work

### Manual Protocol Sequencing

The controller maps numeric FTP replies into the next protocol action.

### Passive Data-Channel Negotiation

The implementation parses a PASV response and creates a second connection.

### File Upload

It sends a binary file through the data stream after issuing `STOR`.

### Performance Observation

Transfer duration and Mbps are calculated directly in the client.

### Native Stream Integration

Foundation stream callbacks and run-loop scheduling are used instead of a browser/networking abstraction.

## Testing & Verification

The strongest verification evidence is operational protocol code and explicit server-response handling.

Transfer success is associated with standard FTP completion responses.

Timing is captured around the transfer path.

The repository does not retain a broad automated test suite or controlled benchmark harness.

The important verification boundary is that the code is a concrete FTP implementation experiment rather than a security-validated or production-hardened client.

## Engineering Discipline

Useful discipline choices include:

- explicit protocol reply-code handling;
- binary transfer mode;
- passive-address parsing;
- separate control/data streams;
- cleanup/state transitions;
- performance timing.

Repository hygiene is weaker around duplicated content and mismatched `.m`/Swift naming.

That is captured as a corpus fact because it affects automated language classification.

## Product Engineering

Fast-FTP is closer to a networking component/prototype than a finished product.

The retained controller could sit behind an application UI, but the repository primarily demonstrates transport behavior.

Its user value would be fast file upload to a known FTP endpoint.

The repository does not retain enough application shell to evaluate a complete end-user workflow.

## Scale / Complexity

The source footprint is modest.

Protocol complexity is meaningful because FTP requires coordination of two TCP connections and stateful responses.

The implementation covers more than a trivial socket send:

- control greeting;
- authentication;
- transfer mode;
- passive negotiation;
- data stream;
- completion responses;
- timing.

## Skills Demonstrated

- Swift networking
- Foundation streams
- event-driven stream handling
- FTP protocol understanding
- FTP reply-code parsing
- passive FTP
- binary transfers
- dual-channel protocol coordination
- file I/O
- transfer timing
- throughput calculation
- protocol-state management
- corpus metadata correction

## What Was Learned / Capability Developed

The repository develops understanding of how an application protocol sits on top of TCP.

FTP makes that especially visible because control and data are separate connections.

The project also exposes why protocol correctness and security are different concerns: a working USER/PASS/PASV/STOR flow can still be plaintext.

That distinction becomes important in later networking/product work.

## Portfolio Evolution Context

Earlier repositories contained network protocols, sockets, ns-3, and file-transfer ideas.

Fast-FTP brings those interests into a native Apple-platform implementation with explicit FTP semantics.

The next repository, `Private-FTP`, expands the theme dramatically into transfer experiments, measurement tooling, and instrumentation.

Fast-FTP therefore acts as a compact protocol-focused precursor.

## Historical Significance

Within the processed corpus, this is the clearest early owner-attributed Swift implementation of passive FTP control/data-channel sequencing.

It also provides a strong example of why RAG corpus generation must inspect content instead of trusting file extensions or GitHub language classification.

## Limitations & Missing Evidence

The retained protocol is plaintext FTP, not SFTP or FTPS.

Credentials are example-oriented rather than evidence of secure secret management.

The source loads a local file into memory before upload, which is suitable for experimentation but may not scale well to very large files.

Duplicated/misnamed source files reduce repository clarity.

These are implementation-specific boundaries rather than generic missing-feature inventory.

## Overall Narrative

Fast-FTP is a compact Swift networking experiment that manually implements the important stages of an FTP upload: control connection, USER/PASS login, binary mode, passive-mode negotiation, a separate data stream, STOR upload, completion-code handling, and transfer-rate measurement.

Its technical significance comes from protocol-level integration rather than codebase size.

The corpus also corrects a misleading metadata signal: the substantive code is Swift despite an `.m` file and Objective-C classification cues.

# Project Tags

`individual-project`, `swift`, `apple-platform`, `foundation`, `inputstream`, `outputstream`, `streamdelegate`, `ftp`, `ftp-client`, `ftp-upload`, `passive-ftp`, `pasv`, `stor`, `user-pass-authentication`, `binary-transfer`, `type-i`, `tcp`, `dual-channel-protocol`, `control-channel`, `data-channel`, `ftp-reply-codes`, `protocol-state-machine`, `file-transfer`, `throughput-measurement`, `transfer-timing`, `main-run-loop`, `plaintext-ftp`, `not-sftp`, `not-ftps`, `misleading-file-extension`, `duplicate-source-blob`, `earliest-observed-swift-passive-ftp-client`
