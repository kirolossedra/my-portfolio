# SwiftFTP

## Repository Identity

- Repository: 125 / 138
- Name: `SwiftFTP`
- Start date: 2025-11-08
- Latest meaningful update: 2025-11-08
- Latest meaningful commit: `cde6612f938d8ebd8b5e4a6a3c005a81ddc9a882`
- Primary language represented by repository metadata: Objective-C
- Technical field: iOS networking and FTP client infrastructure
- Context: research-oriented iOS networking source snapshot
- Collaboration type: `research-collaboration-with-external-components`

## Evidence and Authorship Boundary

This repository is important primarily as an integration and provenance artifact rather than as evidence that every checked-in Objective-C line was authored by the repository owner.

The dominant FTP implementation is the `WhiteRaccoon` library.

Its source header explicitly states that WhiteRaccoon was created by **Valentin Radu on August 23, 2011** and includes the original permissive license notice.

Accordingly, the WhiteRaccoon implementation is treated here as externally authored library code incorporated into the working source snapshot.

The repository also contains `SceneDelegate.m`.

That file identifies the project as `SedraFTP` and carries a `Created by UWaterloo on 10/9/25` source header.

The body is the standard iOS scene-lifecycle delegate shape generated for UIKit applications.

The strongest owner-relevant evidence therefore concerns assembling and working with an iOS FTP networking codebase in a University of Waterloo research context, not original authorship of the WhiteRaccoon network stack.

This distinction is essential for later RAG queries about Objective-C depth or FTP implementation ownership.

## What This Repository Represents

`SwiftFTP` is a compact iOS networking source snapshot centered on an FTP client library and an iOS application lifecycle shell.

The checked-in source exposes the low-level architecture of an Objective-C FTP client that is built on Apple networking primitives.

The repository is historically useful because it appears before later repositories that build much richer FTP experiment automation around the same research problem.

In that sense, it records an early stage of the portfolio's FTP-over-iOS experimentation lineage.

The repository contains two distinct source categories:

1. an externally authored FTP library implementation,
2. an iOS application shell associated with the SedraFTP research application.

The codebase is small, but the network library itself exposes a broad range of FTP operations and asynchronous stream behavior.

## WhiteRaccoon FTP Architecture

WhiteRaccoon imports:

- `Foundation`,
- `CFNetwork`.

The library defines a set of request abstractions around FTP operations.

### Request Types

The header defines request types for:

- upload,
- download,
- delete,
- directory creation,
- directory listing.

This provides a request-oriented model rather than placing every FTP operation inside one procedural function.

### `WRBase`

`WRBase` carries shared FTP state such as:

- path,
- hostname,
- username,
- password,
- URL scheme,
- passive-mode configuration,
- generated credentials,
- full URL,
- error state.

It also exposes lifecycle methods such as `start` and `destroy`.

### `WRRequest`

`WRRequest` extends the base abstraction with request-specific state.

It includes:

- previous and next request references,
- request type,
- delegate,
- stream information,
- stream-open state.

The linked request references support the queue abstraction used elsewhere in the library.

### Download Requests

`WRRequestDownload` conforms to `NSStreamDelegate`.

It stores received data and participates in the asynchronous stream-driven transfer model.

### Upload Requests

`WRRequestUpload` also uses stream callbacks.

It contains outgoing data and can interact with a directory-list request before an upload.

### Filesystem Operations

Specialized request classes exist for:

- delete,
- create directory,
- list directory.

This means the embedded library covers more than a single download path.

### Request Queue

`WRRequestQueue` provides ordered request execution.

The API can:

- add one request,
- add a request at the front,
- add an array of requests,
- remove a request.

A queue delegate is notified when queued work completes.

### Stream State

`WRStreamInfo` stores network-stream transfer state including:

- read stream,
- write stream,
- bytes consumed in the current iteration,
- total bytes consumed,
- expected size,
- transfer buffer.

This is evidence of an asynchronous buffered transfer architecture within the external library.

## Error Model

The library enumerates both client-side and FTP-server error conditions.

Client-side conditions include:

- missing hostname,
- inability to open a stream,
- inability to write a stream,
- inability to read a stream,
- missing outgoing data,
- existing-file conflict,
- directory overwrite conflict,
- stream timeout.

FTP-server-side mappings include common status conditions corresponding to codes such as:

- 425,
- 426,
- 450,
- 530,
- 550,
- 552,
- 553.

`WRRequestError` maps underlying errors into the library's FTP-oriented error model.

Again, this is capability of the incorporated WhiteRaccoon library, not evidence that these abstractions were originally designed by the repository owner.

## Delegate-Based Asynchronous Design

The library uses Objective-C protocols to report asynchronous completion.

`WRRequestDelegate` requires callbacks for:

- request completed,
- request failed.

It optionally asks whether an existing file should be overwritten.

`WRQueueDelegate` extends the request delegate and adds a queue-completed callback.

This architecture is consistent with the stream-driven Objective-C networking style used by the library.

## iOS Application Lifecycle Shell

`SceneDelegate.m` includes the familiar UIKit scene lifecycle callbacks:

- scene connection,
- scene disconnection,
- activation,
- resignation,
- foreground entry,
- background entry.

The file does not itself contain the FTP experiment logic.

Its value in this repository is contextual: the FTP source is being held beside an iOS lifecycle shell associated with the `SedraFTP` application.

## Technical Stack Represented

### Objective-C

Objective-C is the primary source language represented by the repository.

The repository exposes:

- Objective-C classes,
- protocols,
- properties,
- inheritance,
- delegates,
- enums,
- UIKit lifecycle source,
- Foundation and CFNetwork integration.

Because the central networking library is externally attributed, this demonstrates exposure and integration context more strongly than original library authorship.

### CFNetwork

WhiteRaccoon imports CFNetwork and builds FTP behavior around Apple's networking stack.

This is evidence that the iOS experiment lineage operated close to native Apple networking APIs.

### Foundation Streams

The FTP implementation models input and output streams and uses `NSStreamDelegate`.

This gives the repository direct exposure to asynchronous stream-based networking concepts.

### UIKit

The repository carries a UIKit `SceneDelegate`, linking the networking source to an iOS application environment.

## Repository Scale

The repository is intentionally compact.

Its main files are:

- `README.md`,
- `SceneDelegate.h`,
- `SceneDelegate.m`,
- `WhiteRaccoon.h`,
- `WhiteRaccoon.m`.

The WhiteRaccoon `.m` implementation is much larger than the application-shell files.

That imbalance is another reason to preserve authorship provenance carefully: raw line count would otherwise imply that the repository owner authored a much larger Objective-C FTP stack than the source headers support.

## Historical Portfolio Significance

`SwiftFTP` sits at an important transition point in the networking portfolio.

Earlier projects already contain FTP and network experimentation.

Later repositories, especially `SedraFTPVariant` and `Apple-Publication`, turn FTP transfer into a controlled experiment workload with:

- automated repetitions,
- UDP orchestration,
- timing,
- generated server-side data,
- desktop control interfaces,
- and publication-oriented processing.

`SwiftFTP` is therefore best understood as an early iOS FTP source/integration checkpoint in that progression.

It preserves the native iOS networking substrate that later experiments build around.

## Skills and Concepts Evidenced

### Integration and Source Evaluation

The repository demonstrates the need to identify the difference between:

- application-owned code,
- platform boilerplate,
- third-party library source.

That provenance distinction is especially relevant when integrating legacy Objective-C libraries into research tooling.

### Native iOS Networking Exposure

The repository provides concrete exposure to:

- Objective-C,
- UIKit application lifecycle,
- Foundation,
- CFNetwork,
- stream-oriented networking,
- delegate callbacks,
- FTP request abstractions.

### Legacy Library Integration

WhiteRaccoon is an older externally authored Objective-C FTP library.

Its presence in a 2025 research snapshot shows work with legacy/native networking code rather than a greenfield modern HTTP-only application stack.

## Overall Project Narrative

`SwiftFTP` is not a large standalone product.

It is a historically useful iOS networking source snapshot in the portfolio's FTP experimentation lineage.

Its central networking implementation is WhiteRaccoon, which is explicitly attributed to Valentin Radu and therefore must remain classified as external library code.

The surrounding repository places that library within a `SedraFTP` / University of Waterloo application context.

For portfolio reasoning, the strongest conclusions are therefore about native iOS networking integration, Objective-C/CFNetwork exposure, and the early source substrate for later FTP experiment automation.

# Project Tags

- `objective-c`
- `ios`
- `uikit`
- `foundation`
- `cfnetwork`
- `ftp`
- `ftp-client`
- `white-raccoon`
- `nsstream`
- `delegate-pattern`
- `asynchronous-networking`
- `legacy-library-integration`
- `external-library-integration`
- `uwaterloo-research-context`
- `research-networking`
