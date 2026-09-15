# Tag Ontology Extensions — Repositories 090–096

This file extends the corpus tag vocabulary with concepts evidenced in repositories 090–096. Tags remain factual retrieval metadata rather than ratings.

## NLP / Model Execution

- `generative-nlp` — generative natural-language-model work.
- `story-generation` — text generation framed as story generation.
- `tinystories` — use of the TinyStories dataset.
- `hugging-face-datasets` — Hugging Face Datasets integration.
- `executed-notebook` — checked-in notebook includes execution/runtime evidence.
- `gpu-experiment` — execution evidence includes GPU-backed computation.
- `causal-language-modeling` — autoregressive causal language-model objective.
- `data-collator` — use of a model-training data collator.
- `training-arguments` — explicit trainer configuration through training-argument objects.
- `model-finetuning` — adaptation/fine-tuning of a pretrained model.
- `train-validation-split` — explicit training/evaluation split.
- `model-evaluation` — model evaluation logic beyond generation alone.
- `perplexity-oriented-evaluation` — evaluation logic connected to language-model loss/perplexity interpretation.
- `temperature-sampling`, `top-k-sampling`, `top-p-sampling` — probabilistic text-generation controls.
- `frontend-model-integration` — browser UI connected to model-generation functionality.
- `http-endpoint` — model/client boundary expressed as an HTTP endpoint.
- `json-api-consumption` — client parses/uses JSON API responses.
- `cloudflare-quick-tunnel` — transient Cloudflare tunnel integration.
- `transient-endpoint` — endpoint evidence is temporary/ephemeral rather than durable production deployment.
- `ml-product-prototype` — model functionality wrapped in a user-facing prototype.

## Wireless Simulation

- `802-11ac`, `vht`, `vht-mcs5` — IEEE 802.11ac/VHT configuration evidence, including MCS 5.
- `constant-rate-wifi-manager` — fixed ns-3 Wi-Fi rate-control configuration.
- `160-mhz-channel` — configured 160 MHz Wi-Fi channel width.
- `waypoint-mobility` — waypoint-based simulated movement.
- `onoff-application` — ns-3 OnOff traffic generator.
- `flow-monitor` — ns-3 FlowMonitor statistics collection.
- `distance-sweep` — repeated experiment varying distance.
- `throughput-vs-distance` — throughput evaluated against distance.
- `simulation-not-physical-measurement` — explicit evidence boundary separating simulation from live measurement.

## Coptic / Lexicography

- `coptic-language` — software/data centered on the Coptic language.
- `bohairic`, `bohairic-dialect` — Bohairic Coptic mapping/normalization.
- `lexicography`, `lexicon` — structured lexical/dictionary work.
- `language-tooling` — tooling built around language data.
- `translation-lookup`, `dictionary-based-translation` — lookup-driven translation behavior.
- `one-to-many-mapping` — one lexical key may map to multiple values/forms.
- `dialect-normalization`, `form-normalization` — normalization between dialectal or lexical forms.
- `large-static-dictionary` — substantial embedded static lexical data.
- `duplicate-key-risk` — dictionary construction includes a duplicate-key overwrite/collision risk.
- `linguistic-provenance-boundary` — linguistic claims/data provenance are not fully established by repository evidence.
- `ancient-language-computing` — computing work centered on ancient/historical language material.

## Zephyr / RTOS

- `zephyr`, `zephyr-rtos` — Zephyr RTOS source/API usage.
- `kernel-threads` — direct RTOS kernel-thread manipulation.
- `thread-scheduling`, `priority-scheduling`, `cooperative-scheduling`, `preemptive-scheduling` — scheduler semantics studied or exercised.
- `thread-suspend`, `thread-resume`, `thread-lifecycle` — explicit thread lifecycle operations.
- `k-thread-create`, `k-sleep`, `k-yield`, `k-busy-wait` — specific Zephyr kernel APIs/behaviors.
- `interrupt-lock` — interrupt locking used as a scheduling/timing boundary.
- `latency-study`, `scheduler-study` — timing/scheduling behavior investigated.
- `external-intel-source`, `external-anas-nashif-attribution` — retained source contains explicit external attribution.
- `nrf-name-without-nrf-specific-source` — repository name references nRF but retained source does not establish Nordic-specific implementation.

## FTP / Apple Streams

- `swift` — Swift implementation language.
- `apple-platform`, `foundation` — Apple/Foundation APIs.
- `inputstream`, `outputstream`, `streamdelegate` — Foundation stream APIs/delegation.
- `ftp`, `ftp-client`, `ftp-upload`, `passive-ftp`, `pasv`, `stor` — FTP client/upload behavior including passive mode and STOR.
- `user-pass-authentication` — FTP USER/PASS login sequence.
- `binary-transfer`, `type-i` — binary FTP transfer mode.
- `dual-channel-protocol`, `control-channel`, `data-channel` — separate FTP command and data connections.
- `ftp-reply-codes` — numeric FTP response parsing.
- `protocol-state-machine` — protocol behavior coordinated as explicit states/sequences.
- `plaintext-ftp` — unencrypted FTP transport.
- `not-sftp`, `not-ftps` — explicit negative classification preventing encrypted-protocol overclaim.
- `misleading-file-extension` — file extension does not match the actual retained language syntax.
- `duplicate-source-blob` — multiple filenames resolve to identical retained source content.

## Transfer Measurement / RF Instrumentation

- `custom-application-protocol` — application-specific framing/semantics built over a transport.
- `custom-tcp-file-transfer` — custom file transfer built directly over TCP sockets.
- `not-ftp-protocol-for-python-transfer` — Python transfer subsystem is not FTP despite repository naming/context.
- `threaded-server`, `thread-per-client` — server concurrency via per-client threads.
- `file-framing` — application-level boundaries/metadata around transferred file payloads.
- `flow-completion-time`, `fct` — transfer completion-time measurement/analysis.
- `experiment-results` — checked-in structured experiment output.
- `desktop-analysis-tool`, `interactive-plotting` — desktop visualization/analysis UI.
- `scpi` — Standard Commands for Programmable Instruments command/control.
- `serial-communication` — serial instrument/device communication.
- `spectrum-analyzer`, `mini-circuits-rsa` — spectrum-analyzer control, specifically Mini-Circuits RSA context.
- `rf-instrumentation` — software controlling/measuring RF laboratory equipment.
- `spectrum-sweep`, `resolution-bandwidth`, `rbw`, `multi-sweep`, `max-hold`, `peak-marker` — spectrum-measurement configuration/analysis capabilities.
- `realtime-plotting` — plots updated while measurement is running.
- `dat-export` — DAT-format export.
- `xml-configuration`, `configuration-persistence` — configuration saved/restored through XML.
- `background-threading` — long-running work moved away from the UI thread.
- `lab-tooling` — software intended for laboratory experimentation/measurement.
- `white-raccoon`, `external-whiteraccoon-library`, `third-party-source` — retained third-party WhiteRaccoon FTP implementation and provenance.
- `security-claim-boundary`, `no-verified-transfer-encryption` — security-themed claims are not treated as encryption evidence.
- `multi-phase-experimental-workspace` — repository retains multiple evolutionary experimental subsystems.

## DHCP / BOOTP

- `udp-server` — UDP server implementation.
- `dhcp`, `bootp`, `dhcp-server` — DHCP/BOOTP protocol/server work.
- `binary-protocol`, `binary-packet-parsing` — direct binary network-protocol parsing.
- `struct-pack`, `struct-unpack` — Python `struct` packing/unpacking.
- `tlv-options`, `dhcp-options` — DHCP option TLV parsing/construction.
- `dhcp-magic-cookie` — DHCP magic-cookie handling.
- `discover-offer`, `request-ack`, `dhcp-nak`, `dora` — DHCP state/message exchanges.
- `mac-address` — MAC-address extraction/handling.
- `address-pool`, `lease-management`, `lease-expiration`, `in-memory-state` — address allocation and lease state.
- `subnet-mask-option`, `router-option`, `dns-option`, `server-identifier` — DHCP option construction.
- `network-infrastructure` — infrastructure-level network service experimentation.
- `privileged-port` — implementation uses a normally privileged network port.
- `protocol-implementation` — direct implementation of a protocol rather than only consuming a high-level client library.

## Earliest-Observed Retrieval Tags

- `earliest-observed-executed-gpt2-tinystories-finetuning` — repository 090.
- `earliest-observed-model-backed-story-generation-client` — repository 090.
- `earliest-observed-vht-distance-throughput-sweep` — repository 091.
- `earliest-observed-coptic-lexicography-centered-repository` — repository 092.
- `earliest-observed-bohairic-mapping` — repository 092.
- `earliest-observed-zephyr-rtos-scheduler-study` — repository 093.
- `earliest-observed-swift-passive-ftp-client` — repository 094.
- `earliest-observed-scpi-spectrum-analyzer-gui` — repository 095.
- `earliest-observed-file-transfer-fct-analysis` — repository 095.
- `earliest-observed-manual-dhcp-server` — repository 096.
- `earliest-observed-bootp-dhcp-binary-packet-construction` — repository 096.
