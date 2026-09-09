# Repository 096 — SocketLib

## Repository Identity

- **Repository:** `kirolossedra/SocketLib`
- **Corpus index:** 096
- **Repository start date:** 2025-10-22
- **Last meaningful update date:** 2025-10-22
- **Latest meaningful commit:** `dbd763b5564f8b62f891b1c5176f458a2e788648`
- **Primary repository language:** Python
- **Project form:** manual DHCP/BOOTP server implementation experiment
- **Collaboration classification:** `individual-project`
- **Substantive source:** `main.py`

## Evidence Basis

The repository contains a minimal README and one substantive Python source file.

`main.py` implements a DHCP server directly with Python UDP sockets and binary packet packing/parsing.

It does not rely on a high-level DHCP server framework.

The source manually handles core BOOTP/DHCP header fields and DHCP options.

It maintains an in-memory lease pool and responds to DISCOVER and REQUEST flows.

The repository is compact, but protocol-level work is meaningful because DHCP is a binary network protocol with broadcast behavior and strict field formats.

The implementation is educational/experimental rather than a full RFC-complete production DHCP daemon.

## What the Project Is

SocketLib is a hand-built Python DHCP server experiment.

The program binds to DHCP server UDP port 67.

It receives broadcast/client packets, parses BOOTP/DHCP fields, identifies message type, allocates an address from an in-memory pool, and constructs DHCP OFFER, ACK, or NAK replies.

Replies are broadcast toward DHCP client port 68 where appropriate.

The source therefore demonstrates protocol implementation below the level of ordinary HTTP/TCP application programming.

## Project Scope

The retained server supports key DHCP mechanics including:

- UDP server binding;
- socket broadcast mode;
- BOOTP header parsing;
- transaction ID extraction;
- client hardware/MAC address extraction;
- DHCP option parsing;
- DHCP magic cookie handling;
- DHCP DISCOVER recognition;
- address offer allocation;
- DHCP OFFER construction;
- DHCP REQUEST recognition;
- requested-IP extraction;
- ACK generation;
- NAK generation;
- subnet mask option;
- router option;
- DNS option;
- lease-time option;
- server-identifier option;
- lease expiration/reuse;
- in-memory MAC-to-IP lease tracking.

The implementation intentionally covers a core subset rather than every DHCP message/state.

## Architecture / System Shape

The server is a single-process event loop around a UDP socket:

```text
DHCP client broadcast
        ↓ UDP :67
Python socket server
        ↓
parse BOOTP header + DHCP options
        ↓
message type?
   ┌────┴────┐
DISCOVER    REQUEST
   ↓           ↓
allocate     validate requested IP
   ↓           ↓
OFFER       ACK / NAK
   └────┬──────┘
        ↓ broadcast UDP :68
      client
```

Lease state is held in process memory.

There is no external database.

## Technical Stack

- Python
- `socket`
- UDP
- broadcast sockets
- DHCP
- BOOTP
- binary packet parsing
- `struct.pack`
- `struct.unpack`
- IPv4 address packing
- in-memory lease management
- lease expiration

## DHCP / BOOTP Packet Model

DHCP is built on the BOOTP message format.

The source manually works with fixed header fields rather than parsing JSON or text lines.

It extracts fields such as:

- operation code;
- hardware type/length context;
- transaction ID;
- client IP field;
- client hardware address.

The DHCP options area begins after the fixed header and magic cookie.

This requires byte-offset reasoning.

That is significantly different from ordinary application-layer web protocol handling.

## Magic Cookie

The source uses the standard DHCP magic cookie value:

```text
0x63825363
```

This marks the options section as DHCP-formatted.

Correct cookie construction/parsing is a basic interoperability requirement.

Its explicit presence shows protocol-format awareness rather than an arbitrary custom UDP message.

## DHCP Options Parsing

The server iterates over the options portion of a received packet.

It interprets option code and length fields.

This allows the implementation to identify values such as DHCP message type and requested IP.

The parser must advance carefully across variable-length option records.

This is a practical binary TLV-style parsing problem.

## Address Pool

The configured pool spans addresses from `192.168.1.100` through `192.168.1.200`.

The server tracks leases in memory.

It associates client MAC identities with leased IP addresses.

An existing unexpired lease can be reused for a known client.

Expired leases can return to availability.

This is a basic stateful network-service behavior.

## Lease Time

The retained lease duration is 3600 seconds.

Lease expiry is therefore time-based rather than permanent.

The server compares current time with retained lease timestamps to determine reuse/reclamation.

There is no persistent lease database, so restarting the process resets this state.

That is appropriate to an experiment but not equivalent to durable network infrastructure.

## DISCOVER → OFFER

When a DHCP DISCOVER is received, the server selects an available address.

It creates a DHCP OFFER containing the candidate address and configuration options.

The reply is sent using broadcast behavior so a not-yet-configured client can receive it.

This implements the first half of the common DORA sequence:

```text
Discover → Offer
```

## REQUEST → ACK / NAK

For a DHCP REQUEST, the server inspects the requested address.

If the request is acceptable within the configured pool/state, it constructs an ACK.

If the requested address cannot be honored, the source includes NAK behavior.

This implements the second half of the typical allocation sequence:

```text
Request → Acknowledge
```

with an explicit negative path when needed.

## Configuration Options

The response builder includes practical client configuration data.

Visible options include:

- subnet mask;
- router/default gateway;
- DNS server;
- lease duration;
- DHCP server identifier.

This makes the server more than a bare address allocator.

It constructs a useful configuration response similar to what a client expects from a real DHCP service.

## Binary Packing

The implementation uses `struct.pack` to build reply packets.

IP addresses are converted into packed binary form.

Numeric fields must use the protocol's expected byte widths and byte order.

This is a strong low-level networking skill signal.

The server is not using a library that hides packet layout.

## Broadcast Socket Behavior

The socket enables broadcast capability.

The server listens on `0.0.0.0:67`.

DHCP clients frequently operate before they have a usable IP configuration, so broadcast behavior is fundamental to the protocol.

This is why the transport pattern differs from a normal client connecting to a known application server address.

## Privileged-Port / Environment Boundary

UDP port 67 is a privileged and infrastructure-sensitive port on many systems.

Running the server can require elevated privileges and an isolated/test network to avoid conflicting with an existing DHCP server.

The repository demonstrates protocol code.

It should not be casually interpreted as safe to run on an arbitrary production LAN without network isolation and configuration control.

## Major Engineering Work

### Manual Binary Protocol Parsing

The server reads DHCP/BOOTP fields from raw received bytes.

### Manual Packet Construction

Replies are built using explicit binary packing and protocol options.

### Lease State

The program tracks address allocation by MAC and expiration time.

### Broadcast Networking

The source handles the broadcast-centric request/reply model of initial DHCP configuration.

### Positive and Negative Allocation Paths

REQUEST handling can result in ACK or NAK rather than assuming every request succeeds.

## Testing & Verification

The source includes runtime logging/prints around message receipt and response behavior.

The strongest verification would be interoperability with real DHCP clients or packet captures, but such captures are not retained in this repository snapshot.

The code itself is sufficient to establish the intended protocol mechanics and packet-building logic.

The corpus does not claim RFC compliance certification from source inspection alone.

## Engineering Discipline

The implementation demonstrates disciplined protocol decomposition:

- constants for message/option types;
- separate parsing/building responsibilities;
- bounded address pool;
- explicit lease duration;
- reuse/expiration logic;
- separate DISCOVER and REQUEST behavior;
- standard network byte representation.

The educational nature is also visible in the limited message-state coverage.

The source prioritizes understanding core DHCP operation over implementing every edge case.

## Product Engineering

SocketLib is infrastructure/protocol software rather than an end-user application.

Its “product” is a network service responding to DHCP clients.

There is no GUI because the relevant interaction surface is the wire protocol.

That makes observability/logging and correct packet semantics more important than visual UX in this repository.

## Scale / Complexity

The repository has one source file, but it crosses several low-level concerns:

- binary serialization;
- UDP networking;
- broadcast semantics;
- protocol option parsing;
- network address representation;
- stateful leases;
- time-based expiration;
- client identity by MAC;
- protocol response branching.

The codebase is small in size but dense in protocol mechanics.

## Skills Demonstrated

- Python socket programming
- UDP servers
- broadcast networking
- DHCP
- BOOTP
- binary protocols
- `struct.pack` / `struct.unpack`
- byte-level parsing
- TLV-style option parsing
- IPv4 byte representation
- MAC-address handling
- DHCP DORA flow
- DHCP OFFER
- DHCP ACK
- DHCP NAK
- address-pool management
- lease state
- lease expiration
- infrastructure-protocol reasoning

## What Was Learned / Capability Developed

The repository develops understanding of networking below application protocols like HTTP and FTP.

It shows that a protocol implementation must honor binary layout, byte order, special broadcast behavior, client state, and option semantics.

It also demonstrates that network services often manage time-dependent state even when they are implemented in one small process.

That is useful preparation for systems/network engineering beyond framework-based application development.

## Portfolio Evolution Context

Repositories 094 and 095 focused heavily on file transfer, TCP behavior, measurement, and instrumentation.

SocketLib moves one layer deeper into local-network infrastructure.

Instead of implementing a file-transfer conversation on top of a configured IP network, this project implements part of the mechanism that gives hosts their IP configuration in the first place.

That is a meaningful expansion of network-protocol breadth.

## Historical Significance

Within the processed corpus, this is the earliest observed hand-built DHCP server with manual BOOTP/DHCP binary packing, lease-pool logic, and OFFER/ACK/NAK response construction.

It demonstrates a transition from using sockets for application data to implementing a standardized network configuration protocol directly.

## Limitations & Missing Evidence

The retained server implements a useful core subset, not every DHCP state/message.

Lease state is in memory and resets when the process exits.

The repository does not establish formal RFC conformance or production-LAN deployment.

Those boundaries keep the project accurately positioned as a low-level protocol implementation experiment.

## Overall Narrative

SocketLib is a compact but technically dense Python DHCP server experiment.

It binds to the standard server port, parses raw BOOTP/DHCP packets, handles DHCP options, tracks an address pool and expiring leases, and manually constructs broadcast OFFER, ACK, and NAK responses using binary packing.

Its value is direct protocol understanding: the code works at the byte and network-state level rather than hiding DHCP behind a high-level library.

# Project Tags

`individual-project`, `python`, `socket-programming`, `udp`, `udp-server`, `broadcast`, `dhcp`, `bootp`, `dhcp-server`, `binary-protocol`, `binary-packet-parsing`, `struct-pack`, `struct-unpack`, `tlv-options`, `dhcp-options`, `dhcp-magic-cookie`, `discover-offer`, `request-ack`, `dhcp-nak`, `dora`, `ipv4`, `mac-address`, `address-pool`, `lease-management`, `lease-expiration`, `in-memory-state`, `subnet-mask-option`, `router-option`, `dns-option`, `server-identifier`, `network-infrastructure`, `privileged-port`, `protocol-implementation`, `earliest-observed-manual-dhcp-server`, `earliest-observed-bootp-dhcp-binary-packet-construction`
