# Portfolio RAG Tag Ontology

This file defines the canonical factual tags used by the processed corpus.

## Global Rules

- Apply tags only to positively evidenced repository properties.
- Reuse canonical tags instead of inventing synonyms for the same capability.
- Repository capability and personal attribution remain separate dimensions.
- Dependency, filename, repository title, or documentation mention alone does not establish implementation.
- Course/framework/generated infrastructure is tagged only with local authorship qualification where relevant.
- `earliest-observed-*` means the underlying capability is positively evidenced here and has not appeared in an earlier repository by canonical `startDate` chronology; the claim remains provisional until the full corpus is processed.
- Persistent repository index records processing order and may differ from historical order when a chronology backfill is discovered.
- Empty or absent capabilities are represented by the absence of a tag.

# Project Type

- `academic-team-project` — Collaborative project whose evidence supports an academic/team context.
- `algorithm-practice` — Repository primarily containing independent algorithm/data-structure exercises.
- `algorithm-utility-collection` — Repository collects small reusable algorithmic helpers rather than one integrated application.
- `autonomous-driving-simulation` — Repository materially models or integrates an autonomous-driving simulation environment.
- `autonomous-vehicle-coursework` — Structured coursework materially studies autonomous-vehicle sensing or perception.
- `behavioral-pattern-exercises` — Repository contains focused executable exercises for behavioral software-design patterns.
- `browser-simulation` — Browser code materially runs a repeated simulation of interacting entities or state.
- `coding-interview-practice` — Repository centered on interview-style coding challenges.
- `computer-architecture-exercise` — Educational implementation focused on processor, ISA, datapath, or closely related architecture concepts.
- `console-application` — User-facing or interactive application whose primary interface is a console.
- `control-system-exercise` — Educational implementation centered on explicit control/state rules for a modeled system.
- `course-assignment-repository` — Repository materially contains completed structured course programming assignments.
- `cross-platform-application` — One application/framework codebase targets multiple native platforms.
- `data-preprocessing-tool` — Tool whose primary purpose is cleaning, reshaping, validating, or converting source data before downstream use.
- `database-tooling` — Repository contains focused utilities for database inspection, metadata discovery, or related engineering tasks.
- `design-pattern-learning` — Repository explicitly implements software design patterns for study or reference.
- `desktop-application` — User-facing application implemented for a desktop/native GUI environment.
- `developer-profile` — Repository/artifact whose primary purpose is public developer identity and portfolio presentation.
- `developer-tooling` — Software primarily built to support engineering, preprocessing, or technical workflows.
- `digital-design-exercises` — Focused exercises in digital logic or HDL behavior.
- `educational-project` — Repository whose evidenced purpose is learning, practice, or instructional implementation.
- `frontend-prototype` — Frontend implementation created primarily to explore presentation or interaction behavior.
- `github-profile-repository` — Same-name GitHub profile repository used to render the account profile README.
- `hardware-description-project` — Project centered on HDL descriptions of digital-hardware behavior.
- `hdl-utility-collection` — Collection of small independent HDL utilities or practice modules.
- `integrated-hdl-system` — HDL project that integrates multiple hardware components around shared system interfaces.
- `interactive-experiment` — Small interactive implementation whose primary purpose is experimenting with behavior or dynamics.
- `interactive-utility` — Focused user-facing tool built around a concrete interactive task.
- `longitudinal-practice` — Practice repository with meaningful activity across an extended period.
- `machine-learning-coursework` — Course repository whose programming work materially covers machine-learning algorithms or models.
- `mobile-application` — User-facing application implemented for mobile execution.
- `networking-protocol-simulation` — Repository materially simulates a communication/network protocol and its state transitions.
- `personal-project` — Repository evidence supports a personally driven project context.
- `pipelined-processor-model` — HDL implementation materially models processor execution through explicit pipeline stages/registers.
- `prototype` — Repository evidence explicitly supports an exploratory or incomplete implementation stage.
- `repository-placeholder` — Public repository exists as a chronological/organizational artifact without committed implementation content.
- `chronology-marker` — Artifact is retained primarily to preserve complete portfolio chronology.
- `sensor-processing-coursework` — Coursework materially exercises sensor-processing calculations or pipelines.
- `sensor-simulation-project` — Repository materially configures or integrates a simulated sensing subsystem.
- `sql-utility` — Focused SQL script or collection built for a concrete database-engineering task.
- `static-web-application` — Browser-delivered application whose runtime is static client-side assets.
- `ui-experiment` — Isolated UI implementation used to exercise presentation or interaction concepts.
- `utility-library` — Repository collects reusable programming helpers for later adaptation or reuse.
- `technical-lab` — Repository is organized primarily as a focused executable technical lab or notebook artifact.
- `developer-portfolio` — User-facing site whose primary purpose is presenting a developer and selected project work.

# Collaboration and Authorship

- `course-supplied-infrastructure` — Repository contains course-provided helpers, tests, datasets, scaffolding, or prose alongside personally completed work.
- `group-project` — Repository evidence supports implementation by multiple contributors as a team project.
- `individual-project` — Repository evidence supports individual ownership/authorship of the implemented project.
- `instructional-scaffold` — Material follows or incorporates a supplied/textbook instructional structure whose presence should not be equated with fully original design authorship.
- `multi-contributor-repository` — Commit or source evidence establishes multiple implementation contributors.
- `shared-authorship` — Implementation capability is materially shared across multiple contributors.
- `mixed-source-provenance` — Repository integrates files with explicitly different authorship/provenance and preserves that distinction locally.

# Languages

- `c` — C is materially used in repository-specific implementation.
- `cpp` — C++ is materially used in repository-specific implementation.
- `css` — CSS is materially used to style implemented web UI.
- `dart` — Dart is materially used in authored application logic.
- `html` — HTML is materially used to define implemented web structure or UI.
- `java` — Java is materially used in authored implementation.
- `javascript` — JavaScript is materially used in implemented repository behavior.
- `python` — Python is materially used in repository-specific logic.
- `sql` — SQL materially implements a repository-specific database query or script.
- `systemverilog` — SystemVerilog-specific language constructs materially implement hardware behavior.
- `tsql` — Microsoft T-SQL dialect features materially implement a repository-specific query or utility.
- `verilog` — Verilog materially describes digital hardware or simulation behavior.

# Frontend and Presentation

- `awt-graphics` — Java AWT graphics primitives materially participate in rendering or interaction.
- `browser-dom` — Implementation directly reads from or writes to the browser DOM.
- `client-side-animation` — Browser-side code materially updates visual entity positions or animation state over time.
- `client-side-application` — Primary application behavior executes in the browser/client.
- `clipboard-interaction` — Application code materially implements clipboard behavior.
- `css-animation` — CSS keyframes or transitions implement material animated behavior.
- `css-transforms` — CSS transforms materially implement movement or visual state changes.
- `custom-toggle` — Repository implements a custom-styled switch/toggle control.
- `desktop-gui` — Repository contains an implemented graphical desktop interface.
- `developer-branding` — Repository deliberately structures public technical identity/branding for a developer profile.
- `dynamic-element-creation` — Client code materially creates interface/rendered entities at runtime.
- `dynamic-readme-badges` — README embeds dynamically generated status/badge imagery.
- `event-driven-ui` — UI behavior is triggered by input, click, or comparable interface events.
- `external-image-integration` — README/UI materially integrates externally generated or hosted image resources.
- `flexbox` — CSS Flexbox materially structures layout or movement.
- `flutter` — Flutter materially implements the application UI/runtime.
- `hover-interaction` — Hover state materially changes behavior or presentation.
- `html-in-markdown` — HTML is intentionally embedded inside Markdown for layout or rich presentation.
- `longitudinal-profile-maintenance` — Developer-profile repository receives meaningful updates across an extended period.
- `markdown` — Markdown materially structures the repository's main artifact.
- `mobile-ui` — Mobile widgets materially implement the application interface.
- `mousemove-interaction` — Mouse movement materially affects application/simulation state.
- `navigation` — Application implements movement between distinct screens/views.
- `qt-style-ui` — Repository contains Qt-style UI definitions and corresponding C++ GUI structure.
- `responsive-layout` — Layout includes implemented behavior or metadata for varying viewport sizes.
- `sprite-sheet-animation` — Rendering materially selects animation frames from a sprite sheet.
- `stateful-ui` — UI behavior is driven by explicit mutable widget/application state.
- `swing` — Java Swing materially implements desktop UI or rendering surfaces.
- `syntax-highlighting` — Code visually distinguishes source/text tokens by syntax.
- `jquery` — jQuery materially performs browser DOM manipulation or interaction.
- `svg-animation` — SVG stroke/geometry properties materially participate in an animated UI effect.
- `dynamic-dom-generation` — JavaScript materially constructs and injects repeated DOM content at runtime.
- `css-grid` — CSS Grid materially structures page or component layout.
- `media-queries` — CSS media queries materially adapt layout or typography across viewport sizes.
- `css-custom-properties` — CSS custom properties materially centralize reusable presentation values.
- `timed-text-rotation` — JavaScript materially rotates visible text on a timer.
- `google-fonts` — Google Fonts is materially integrated into the rendered interface.
- `custom-domain-experiment` — Repository history materially includes custom-domain configuration experimentation.
- `portfolio-project-links` — Portfolio UI materially links visitors to distinct project artifacts/profiles.
- `intersection-observer` — Browser Intersection Observer API materially detects element visibility/intersection state.
- `scroll-reveal-animation` — Content reveal/hide animation materially depends on scroll/viewport intersection.
- `css-transitions` — CSS transitions materially animate changes between UI states.
- `viewport-based-interaction` — Runtime behavior materially depends on whether content is inside the viewport.
- `class-driven-ui-state` — JavaScript materially changes CSS classes to represent interface state.

# Integrations

- `github-streak-stats` — Profile README integrates a dynamically generated GitHub streak-stat image.
- `profile-view-counter` — Profile README integrates a dynamic profile-view counter.
- `skill-icons` — Profile README integrates a generated technology-icon strip as self-presentation metadata.
- `typing-svg` — Profile README integrates dynamic typing SVG content.

# Database and Data

- `array-reshaping` — Arrays/tensors are materially reshaped or transposed for downstream computation.
- `binary-file-io` — Implementation reads or writes binary/bit-packed file data.
- `calendar-conversion` — Code transforms dates between calendar representations using explicit rules.
- `collection-difference` — Implementation materially computes values present in one collection and absent from another.
- `data-cleaning` — Code removes or normalizes unwanted source formatting.
- `data-normalization` — Numerical data is materially normalized/scaled before modeling or processing.
- `data-quality-checking` — Implementation explicitly identifies unsupported, malformed, or unexpected data values.
- `data-transformation` — Code converts data from one representation or shape into another.
- `dictionary-lookup` — Implementation resolves input terms against an in-memory lexical/key-value mapping.
- `embedded-dataset` — A material dataset is stored directly inside source code.
- `fraction-encoding` — Fraction values/forms are mapped to domain-specific representations.
- `hdf5-dataset` — Repository materially loads or works with HDF5-backed data.
- `historical-name-lookup` — Historical named entities are handled through explicit lookup/mapping logic.
- `image-preprocessing` — Image tensors/pixels are materially transformed for downstream computation or modeling.
- `json-generation` — Code programmatically emits JSON-formatted output.
- `like-pattern-matching` — SQL `LIKE` matching materially filters metadata or row values by partial patterns.
- `metadata-query` — Query targets database metadata rather than only application-domain rows.
- `numeric-symbol-encoding` — Numeric values are converted to domain-specific symbolic representations.
- `regular-expressions` — Regular expressions are materially used in parsing or transformation.
- `relational-join` — SQL query materially combines relations through a join condition.
- `reverse-lookup` — Implementation searches a mapping from encoded/value representation back to source entries.
- `schema-introspection` — Code queries a database engine for schema structure such as tables or columns.
- `sql-server` — Microsoft SQL Server-specific catalog or dialect behavior is materially used.
- `symbol-code-conversion` — Encoded symbolic identifiers are converted into another concrete representation.
- `system-catalog-query` — Query materially uses database system catalog views/tables.
- `text-normalization` — Input text is normalized before downstream processing.
- `text-parsing` — Code tokenizes or structurally interprets textual input.
- `text-transliteration` — Characters or tokens are mechanically mapped between writing/sign representations.
- `train-test-data` — Workflow materially distinguishes training data from evaluation/test data.
- `unicode-text` — Non-ASCII Unicode characters are materially stored, transformed, or emitted as domain data.
- `whitespace-tokenization` — Text is materially split into tokens using whitespace boundaries.
- `xml-correction` — Implementation repairs malformed XML structure.
- `xml-minification` — Implementation emits a compact XML representation.
- `xml-parsing` — Code parses XML tags/text into usable structures.
- `xml-pretty-printing` — Implementation emits structurally indented/readable XML.
- `xml-processing` — XML is a central implemented format with multiple operations.
- `xml-to-json` — Implementation converts XML structure into JSON semantics.
- `xml-validation` — Implementation detects invalid XML structure or tag relationships.
- `json-parsing` — Code materially parses JSON data into structured runtime values.
- `dom-parsing` — DOM APIs materially parse and traverse structured documents.
- `binary-data-parsing` — Code materially decodes packed/binary records into runtime data structures.
- `reproducible-input-data` — Repository checks in concrete data inputs used to reproduce an analysis or computation.
- `tabular-data` — Tabular records materially drive analysis/modeling.
- `dataframe` — DataFrame operations materially organize tabular computation.

# Cloud and Infrastructure

- `github-pages` — GitHub Pages is concretely enabled/configured as repository hosting.
- `static-site-deployment` — A static web application/site has concrete deployment evidence.

# Systems Engineering and Algorithms

- `animation-state-machine` — Animation selection and frame progression materially depend on explicit runtime state.
- `arrays` — Array/vector data structures are materially used in algorithmic problem solving.
- `binary-encoding` — Values or fields are explicitly converted into bitstrings.
- `binary-trees` — Binary-tree traversal/comparison problem solving is materially represented.
- `bitwise-xor` — Implementation materially reduces or combines integer values with XOR.
- `boundary-collision` — Simulation materially detects and responds to collision with spatial boundaries.
- `c-pointers` — C pointers materially carry or mutate program/domain state.
- `c-structs` — C structs materially group domain/system state.
- `circular-sequence-arithmetic` — Protocol logic explicitly handles wrap-around sequence-number ordering.
- `collision-detection` — Implementation materially detects spatial intersection/contact between simulated entities.
- `collision-response` — Implementation materially adjusts position or velocity after detected collisions.
- `console-simulation` — Console program materially simulates system/protocol behavior through observable state transitions.
- `console-state-simulation` — Console application repeatedly displays and changes a modeled system state.
- `cpu-dma-integration` — Processor and DMA controller materially coordinate bus ownership and transfer behavior.
- `custom-assembler` — Software parses a custom assembly language and emits encoded instructions.
- `custom-isa` — Repository defines or implements a custom instruction-set architecture.
- `dynamic-programming` — Dynamic-programming or explicit recurrence reasoning is materially represented.
- `euclidean-distance` — Euclidean distance materially drives geometry, proximity, or clustering logic.
- `event-driven-state-machine` — System/protocol state evolves through explicit event-driven transitions.
- `file-compression` — Repository implements actual data compression behavior.
- `file-decompression` — Repository implements reconstruction of compressed data.
- `finite-state-machine` — Implementation models behavior through explicit finite state or state-transition logic.
- `frame-timing` — Runtime materially schedules or measures rendering/animation frames against explicit timing targets.
- `game-loop` — Application materially runs repeated update/render work through an explicit game/runtime loop.
- `gcd` — Greatest-common-divisor computation materially participates in an implemented algorithm.
- `graph-adjacency-list` — Graph relationships are represented through adjacency-list-style structures.
- `graph-analysis` — Implementation computes relationships or metrics over a graph.
- `hardware-system-integration` — Multiple hardware components are integrated into a coherent interacting system.
- `hashing` — Hash-map/set lookup or grouping is materially represented.
- `huffman-coding` — Huffman-tree coding is materially implemented or used for compression.
- `input-state-tracking` — Input events materially update persistent state later consumed by a runtime loop.
- `instruction-encoding` — Mnemonics/operands are converted into binary instruction representations.
- `instruction-parser` — Instruction tokens are parsed according to a defined assembly grammar.
- `integer-digit-reversal` — Decimal digits are materially reconstructed in reversed order.
- `linked-lists` — Linked-list problem solving or manipulation is materially represented.
- `memory-mapping` — Application generates processor memory/register mapping representations.
- `min-heap` — A min-heap is materially implemented or used.
- `opcode-mapping` — Operations are assigned explicit binary opcode values.
- `pairwise-iteration` — Algorithm materially evaluates combinations/pairs of entities through nested iteration.
- `peripheral-memory-transfer` — Peripheral data transfers to/from memory are materially orchestrated.
- `primality-testing` — Implementation materially determines whether integers are prime.
- `prime-factorization` — Implementation materially decomposes an integer into prime factors.
- `recursion` — Recursive algorithmic solutions are materially represented.
- `recursive-tree-traversal` — Recursive algorithms materially traverse hierarchical tree structures.
- `register-encoding` — Register identifiers are converted into fixed-width instruction fields.
- `rule-based-control` — System outputs/states are determined by explicit input-to-control rules.
- `shared-resource-arbitration` — Multiple requesters compete for a shared resource through implemented arbitration logic.
- `sieve-of-eratosthenes` — Sieve-style composite marking materially identifies/counts primes over a range.
- `signal-interface-definition` — Repository explicitly defines signal names, units, or semantics for integration consumers.
- `simulation-loop` — Repeated timed execution materially advances a simulation state.
- `sorting` — Sorting materially participates in an implemented algorithmic strategy.
- `stack-data-structure` — A stack data structure is materially implemented or used.
- `stacks` — Stack-based algorithmic problem solving is materially represented.
- `state-driven-control` — Control behavior materially depends on explicit current system state.
- `strings` — String-oriented algorithms are materially implemented.
- `threaded-runtime` — Application materially runs its core runtime loop on an explicit thread.
- `tree-data-structure` — Tree/node structures materially model hierarchy.
- `trigonometry` — Trigonometric functions materially implement geometric or motion calculations.
- `two-pointers` — A two-pointer traversal strategy is materially implemented.
- `update-render-separation` — Runtime materially schedules state updates separately from rendering cadence.
- `robust-median` — Median aggregation materially reduces sensitivity to outlying measurements or ratios.

# Embedded and Hardware

- `alu-operations` — Arithmetic/logic operation selection is implemented as part of a datapath/CPU model.
- `always-ff` — SystemVerilog `always_ff` materially models sequential hardware behavior.
- `binary-decoder` — Digital decoder logic maps encoded binary input to one-hot output.
- `bus-ownership` — Hardware logic explicitly controls which component may drive a shared bus.
- `clock-generator` — HDL/simulation module explicitly generates a periodic clock.
- `combinational-logic` — Implemented HDL behavior includes combinational logic.
- `counter-design` — HDL materially implements a stateful counter with defined transition modes.
- `data-memory` — Processor/data memory behavior is explicitly modeled.
- `digital-design` — Repository materially models digital-logic/hardware behavior.
- `dma-controller` — Repository materially implements a direct-memory-access controller.
- `dma-request-acknowledge` — DMA request/acknowledge signaling materially coordinates transfers.
- `five-stage-pipeline` — Processor model implements the classic IF/ID/EX/MEM/WB pipeline stages.
- `fixed-priority-arbitration` — Shared-resource requests are resolved by a deterministic fixed-priority policy.
- `hold-request-acknowledge` — CPU/DMA hold request and hold acknowledgement materially coordinate bus handoff.
- `instruction-decoding` — Encoded instruction fields/opcodes are decoded into hardware behavior.
- `instruction-memory` — Instruction storage/fetch is explicitly modeled.
- `keypad-interface` — Keypad/peripheral behavior materially participates in a modeled hardware interface.
- `memory-interface` — Memory materially participates through explicit address/data/control signaling.
- `memory-stage` — Processor pipeline includes an explicit memory-access stage.
- `mips-architecture` — Repository materially models MIPS-style instruction fields/execution concepts.
- `multi-module-hdl` — Several HDL modules are materially integrated through shared interfaces.
- `one-hot-decoding` — One-hot input patterns are explicitly decoded into values or actions.
- `parameterized-hdl` — HDL width/shape/behavior is controlled by elaboration parameters.
- `peripheral-interface` — Module behavior models a device/peripheral connection to control/data signals.
- `pipeline-registers` — Explicit state structures/registers carry processor information between pipeline stages.
- `program-counter` — Processor program-counter state/advancement is implemented.
- `readmemh` — HDL uses `$readmemh` to initialize simulation/program/data memory.
- `register-file` — Processor-style multi-register storage is implemented in HDL.
- `request-acknowledge-signals` — Interface contains implemented request/acknowledge semantics.
- `reset-logic` — HDL materially defines reset-driven state initialization or restoration.
- `sequential-logic` — HDL behavior includes clock/state-dependent sequential logic.
- `shared-bus` — Multiple modeled hardware components communicate over common address/data/control buses.
- `systemverilog-enums` — SystemVerilog enums materially model architectural/control state.
- `systemverilog-structs` — SystemVerilog structs materially bundle architectural/pipeline state.
- `traffic-light-control` — Modeled traffic-light input materially controls vehicle state such as speed.
- `tri-state-bus` — HDL models high-impedance states and conditional shared-bus driving.
- `temperature-control` — Modeled temperature input materially controls a system actuator/state.
- `vehicle-control` — Repository materially models vehicle operational/control state.
- `sensor-control-logic` — Sensor-like inputs materially drive modeled control behavior.
- `writeback-stage` — Processor pipeline includes an explicit register write-back stage.
- `embedded-systems` — Repository materially implements software against embedded hardware interfaces.
- `bare-metal` — Software materially accesses microcontroller hardware without a hosted application runtime.
- `tm4c123` — Code materially targets the TM4C123/TM4C123GH6PM microcontroller family.
- `arm-cortex-m` — Embedded implementation materially targets an ARM Cortex-M-class microcontroller platform.
- `autosar` — Repository materially implements AUTOSAR-style module conventions or interfaces.
- `autosar-4-0-3` — AUTOSAR release 4.0.3 compatibility/versioning is explicitly encoded.
- `mcal-style-driver` — Driver architecture materially follows MCAL-style hardware abstraction/configuration conventions.
- `port-driver` — Repository materially implements a configurable microcontroller Port driver.
- `gpio` — General-purpose I/O configuration or access materially participates in implementation.
- `memory-mapped-io` — Peripheral registers are materially accessed through memory-mapped addresses.
- `volatile-register-access` — Volatile pointers/register expressions materially access hardware state.
- `bit-manipulation` — Bit set/clear/mask operations materially configure or inspect hardware state.
- `pin-multiplexing` — Code materially maps physical pins among alternate peripheral functions.
- `post-build-configuration` — Driver behavior materially consumes a separate post-build-style configuration object.
- `preprocessor-version-checks` — Compile-time preprocessor checks materially enforce software/interface version compatibility.
- `development-error-tracing` — Driver APIs materially report development-time errors through DET-style interfaces.
- `det` — AUTOSAR Development Error Tracer-style reporting materially participates in driver validation.
- `dio` — Digital I/O driver services materially participate in repository functionality.
- `systick` — ARM SysTick timer materially implements timing/interrupt behavior.
- `timer-callback` — Timer/interrupt code materially invokes a registered callback function.
- `uart-pin-config` — Port driver materially configures pins for UART alternate function.
- `adc-pin-config` — Port driver materially configures pins for ADC/analog operation.
- `can-pin-config` — Port driver materially configures pins for CAN alternate function.
- `ssi-pin-config` — Port driver materially configures pins for SSI alternate function.
- `i2c-pin-config` — Port driver materially configures pins for I²C/open-drain operation.
- `pwm-pin-config` — Port driver materially configures pins for PWM alternate function.
- `usb-pin-config` — Port driver materially configures pins for USB alternate function.
- `qei-pin-config` — Port driver materially configures pins for quadrature-encoder interface operation.
- `gpt-pin-config` — Port driver materially configures pins for general-purpose timer operation.
- `nmi-pin-config` — Port driver materially configures pins for NMI alternate function.
- `pull-up-pull-down` — Internal pull-up/pull-down resistor configuration is materially implemented.
- `configuration-driven-initialization` — Hardware initialization materially iterates over typed configuration data.
- `layered-embedded-architecture` — Application/device abstractions and low-level drivers materially form separate embedded layers.

# Networking

- `automatic-repeat-request` — Protocol materially uses retransmission to provide reliable delivery.
- `computer-networking` — Repository materially implements or simulates networking concepts/protocols.
- `cumulative-acknowledgements` — Acknowledgements materially confirm a cumulative range of sequence numbers.
- `frame-protocol` — Protocol logic materially operates on explicit data-link-style frames.
- `go-back-n` — Repository materially implements or simulates Go-Back-N ARQ behavior.
- `network-flow-control` — Protocol materially gates upper-layer sending based on sender-window/buffer state.
- `piggyback-acknowledgements` — Acknowledgement state is materially carried with outbound data frames.
- `sequence-numbers` — Protocol materially tracks ordered frame/packet sequence identifiers.
- `simulated-packet-loss` — Simulation deliberately injects transmission failure/loss behavior.
- `sliding-window-protocol` — Sender/receiver behavior materially uses a bounded moving transmission window.
- `timeout-retransmission` — Timeout materially causes retransmission of outstanding data.

# Machine Learning and Numerical Computing

- `backpropagation` — Gradients are materially propagated backward through model layers/parameters.
- `binary-classification` — Model/workflow materially predicts one of two classes.
- `binary-cross-entropy` — Binary cross-entropy/log-loss is materially computed as an optimization objective.
- `decision-boundary` — Model behavior is materially visualized or reasoned about through classification decision boundaries.
- `fft` — Fast Fourier Transform computation materially produces a frequency-domain representation.
- `forward-propagation` — Model activations/predictions are materially computed through forward layer operations.
- `gradient-descent` — Model parameters are materially iteratively updated from computed gradients.
- `jupyter-notebook` — Jupyter notebooks materially serve as the implementation/execution environment.
- `logistic-regression` — Logistic regression is materially implemented or trained as a classifier.
- `machine-learning` — Repository materially implements, trains, or evaluates machine-learning models.
- `matplotlib` — Matplotlib materially visualizes numerical, scientific, or experiment data.
- `model-prediction` — Learned model parameters are materially used to generate predictions.
- `model-training` — Repository materially performs iterative parameter learning from data.
- `neural-networks` — Repository materially implements or trains a neural-network model.
- `numpy` — NumPy materially implements numerical/vectorized computation.
- `one-hidden-layer-network` — Neural-network implementation contains one learned hidden layer between input and output.
- `parameter-initialization` — Model parameters are materially initialized before optimization.
- `scikit-learn` — scikit-learn materially trains/evaluates a model or baseline.
- `sigmoid` — Sigmoid activation is materially implemented or applied.
- `tanh-activation` — Tanh materially serves as a neural-network activation function.
- `vectorization` — Core numerical operations are materially expressed as vector/matrix operations rather than scalar loops.
- `supervised-learning` — Labeled feature/target data materially trains a predictive model.
- `regression` — Model materially predicts a continuous numerical target.
- `linear-regression` — Linear regression materially serves as the fitted predictive model.
- `pandas` — pandas materially loads, transforms, or inspects tabular data.
- `train-test-split` — Dataset is materially divided into separate training and held-out test subsets.
- `reproducible-split` — Train/test partition uses a fixed random seed/state for repeatability.
- `mean-squared-error` — MSE materially evaluates regression prediction error.
- `r2-score` — R² materially evaluates explained variance/regression fit.
- `held-out-evaluation` — Model performance is materially measured on data withheld from training.
- `molecular-solubility` — Molecular aqueous solubility is the materially modeled target/domain.
- `molecular-descriptors` — Molecular descriptor features materially serve as model inputs.

# Sensors and Signal Processing

- `beat-frequency` — Beat-frequency values materially drive target-range or related signal calculations.
- `doppler-velocity` — Radar/sensor calculations materially derive or represent relative velocity from Doppler information.
- `fmcw-radar` — Frequency-modulated continuous-wave radar concepts materially drive implemented calculations.
- `frequency-domain-analysis` — Sampled signals are materially transformed or inspected in the frequency domain.
- `lidar` — LIDAR sensing or LIDAR-derived data materially participates in repository processing.
- `noise-injection` — Synthetic or experimental signals are materially perturbed with generated noise.
- `radar` — Radar sensing or radar-specific computation materially participates in repository work.
- `radar-range-equation` — Radar-equation parameters are materially computed to estimate detectable range.
- `signal-sampling` — Repository materially creates or processes discretely sampled signals.
- `sensor-processing` — Sensor-derived measurements materially undergo numerical or geometric processing.
- `time-to-collision` — Repository materially estimates time remaining before a projected collision/closing event.
- `camera-ttc` — Camera feature geometry materially estimates time to collision.
- `lidar-ttc` — Sequential lidar ranges materially estimate time to collision.
- `ego-lane-filtering` — Sensor points are materially filtered to a lateral ego-lane region before estimation.

# Point Clouds and Perception

- `bounding-boxes` — Object/cluster extents are materially represented by computed bounding boxes.
- `crop-box-filtering` — Spatial crop boxes materially filter 3D point-cloud regions.
- `euclidean-clustering` — Point clouds are materially partitioned with Euclidean cluster extraction.
- `kd-tree` — KD-tree spatial search materially supports clustering or neighborhood queries.
- `obstacle-detection` — Sensor/perception processing materially separates or identifies obstacle objects.
- `pcd-io` — PCD point-cloud files are materially loaded or saved.
- `pcd-streaming` — A sequence of PCD frames is materially enumerated and processed as a stream/playback.
- `pcl` — Point Cloud Library materially implements point-cloud processing or visualization.
- `point-cloud-processing` — 3D point clouds are materially filtered, segmented, clustered, or otherwise processed.
- `ransac-plane-segmentation` — RANSAC-based plane fitting materially separates planar surfaces from other points.
- `voxel-grid-filtering` — Voxel-grid downsampling materially reduces point-cloud density.
- `computer-vision` — Image/camera-derived data materially drives perception or localization computation.
- `camera-perception` — Camera observations or feature structures materially participate in a perception workflow.
- `visual-odometry` — Camera-sequence motion estimation is the material technical focus of an artifact.
- `visual-localization` — Visual observations materially support localization/ego-motion reasoning.
- `camera-localization` — Camera-based computation is materially applied to localization.
- `robotics-perception` — Perception processing materially supports a robotic/autonomous-system context.
- `localization` — Estimating platform position/motion is a material repository concern.
- `opencv` — OpenCV materially provides computer-vision structures or algorithms.
- `keypoint-matching` — Matched visual keypoints materially drive geometric computation.
- `opencv-keypoints` — OpenCV `KeyPoint` structures are materially reconstructed or processed.
- `opencv-dmatch` — OpenCV `DMatch` structures are materially reconstructed or processed.
- `python-struct` — Python `struct` materially decodes or encodes binary records.
- `feature-tracking` — Feature-tracking experimentation is a material repository workstream.
- `lidar-object-detection` — Lidar/object-detection experimentation is a material repository workstream.

# Java Runtime and Object Mapping

- `java-reflection` — Java reflection materially inspects classes/fields or creates/assigns objects at runtime.
- `reflection` — Runtime metadata/introspection materially drives program behavior.
- `java-generics` — Java generic type parameters materially define reusable typed behavior.
- `runtime-instantiation` — Objects are materially constructed from runtime `Class` metadata.
- `field-introspection` — Declared fields are materially enumerated and inspected at runtime.
- `reflective-field-assignment` — Runtime reflection materially assigns values to object fields.
- `object-mapping` — Structured external data is materially mapped into typed object instances.
- `xml-object-mapping` — XML element values are materially mapped into Java object fields.
- `json-object-mapping` — JSON properties are materially mapped into Java object fields.
- `data-binding-prototype` — Repository materially prototypes framework-like structured-data-to-object binding.

# Build and Tooling

- `boost-filesystem` — Boost filesystem APIs materially enumerate or manage filesystem paths.
- `cmake` — CMake materially defines native project build configuration.
- `eigen` — Eigen types or numerical operations materially participate in repository implementation.

# Testing and Verification

- `automated-pass-fail` — Testbench or test harness materially computes a pass/fail outcome rather than relying only on manual inspection.
- `autograder-contract` — Completed code materially operates under an external automated-grader function/signature contract.
- `boundary-condition-testing` — Verification materially targets defined boundary or wrap-around behavior.
- `build-artifact-evidence` — Compiled or packaged output provides direct evidence that a build occurred.
- `course-supplied-tests` — Course-provided automated tests materially validate completed assignment functions.
- `deterministic-memory-initialization` — HDL simulation uses controlled initial program/data/register contents.
- `executed-notebook-output` — Notebook cells preserve actual execution results used as evidence of exercised computation.
- `expected-output-verification` — Repository uses known expected values/outputs to check implementation behavior.
- `experimental-result-documentation` — Repository materially records experimental/simulation outcomes for later comparison.
- `external-correctness-oracle` — A separate system evaluates submitted behavior against known correctness criteria.
- `fault-injection-simulation` — Simulation deliberately injects errors/failures to exercise recovery behavior.
- `hdl-simulation` — HDL design is materially exercised through simulation constructs or simulator output.
- `hdl-testbench` — Repository contains a module intended to stimulate an HDL design under test.
- `integration-testbench` — Testbench materially wires and stimulates several interacting components.
- `interactive-console-verification` — Console inputs and printed resulting state are materially used to exercise behavior.
- `manual-execution-demo` — Executable example code demonstrates behavior through direct run/print output.
- `manual-hdl-verification` — HDL behavior is verified through manually inspected simulation output/stimulus.
- `manual-simulation` — A model/protocol is manually exercised through an explicit simulation path.
- `manual-waveform-verification` — HDL state/waveforms are inspected to verify behavior.
- `online-judge` — Correctness is evaluated through an external coding-problem judge.
- `python-assertions` — Python assertions materially validate expected program/data values.
- `reset-verification` — Test logic materially checks expected reset behavior.
- `runtime-performance-timing` — Repository materially measures processing-stage runtime or elapsed duration.
- `scenario-based-verification` — Verification is organized around documented behavior scenarios and expected outcomes.
- `self-checking-testbench` — HDL testbench materially evaluates expected outcomes in simulation code.
- `submission-performance-metrics` — External judge results record runtime or memory feedback for submissions.
- `test-result-aggregation` — Multiple test outcomes are materially stored or emitted as one summarized result set.
- `timed-stimulus` — Simulation testbench materially changes inputs/signals at controlled times.
- `truth-table-enumeration` — Implementation systematically enumerates a finite Boolean input space.
- `visual-simulation-verification` — Rendered/screenshot simulation output is materially preserved for behavior inspection.

# DevOps and Delivery

- `android-apk` — Repository contains a built Android APK artifact.
- `deployment-automation` — Repository materially automates publication/deployment through a configured workflow.
- `deployment-concurrency` — Deployment workflow materially controls concurrent/queued deployment execution.
- `github-actions` — GitHub Actions materially executes repository automation.
- `leetsync` — LeetSync materially synchronizes coding-challenge solutions/metadata into the repository.
- `pages-artifact` — Workflow materially packages static content as a GitHub Pages deployment artifact.
- `workflow-dispatch` — GitHub Actions workflow explicitly supports manual dispatch.

# Software Engineering Practices

- `abstract-classes` — Abstract classes materially define reusable/template behavior.
- `access-mediation` — An intermediary object materially controls access before delegating to a real implementation.
- `adapter-pattern` — Adapter pattern is explicitly implemented around incompatible interfaces.
- `bridge-pattern` — Bridge pattern is explicitly implemented by separating abstraction and implementation hierarchies.
- `builder-pattern` — Builder pattern is explicitly implemented.
- `complexity-analysis-comments` — Source comments explicitly discuss algorithmic time/space complexity.
- `composite-pattern` — Composite pattern is explicitly implemented through a common leaf/group interface.
- `composition` — Objects are materially composed/owned to structure behavior.
- `creational-design-patterns` — Repository explicitly studies/implements creational design patterns.
- `decorator-pattern` — Decorator pattern is explicitly implemented through object wrapping and added behavior.
- `delegation` — Objects materially forward behavior to composed collaborators.
- `error-categorization` — Distinct validation/error conditions have separate categories/messages.
- `facade-pattern` — Facade pattern is explicitly implemented through a simplified subsystem interface.
- `factory-method-pattern` — Factory Method pattern is explicitly implemented.
- `flyweight-pattern` — Flyweight pattern is explicitly implemented through shared intrinsic state/object reuse.
- `functional-decomposition` — Program logic is materially split into named functions around distinct responsibilities.
- `inheritance` — Class inheritance materially structures implementation relationships.
- `input-validation` — Input is checked against explicit implemented constraints.
- `interface-adaptation` — Code materially converts/wraps one interface into another expected interface.
- `interfaces` — Interfaces materially define behavioral/extension contracts.
- `isolated-ui-experiment` — UI behavior/presentation is explored in a separate focused artifact.
- `known-limitations-documented` — Repository documentation or commits explicitly record an implementation boundary.
- `manual-verification` — Repository evidence shows manual inspection/output checking during development.
- `maven` — Maven materially structures or builds Java subprojects.
- `module-decomposition` — Implementation is separated into meaningful functional modules/files/classes.
- `object-caching` — Reusable objects are materially stored/retrieved from a cache keyed by intrinsic state.
- `object-creation-abstraction` — Object creation responsibility is deliberately separated from consuming workflow.
- `object-oriented-programming` — Classes and object-oriented relationships materially structure implementation.
- `object-wrapping` — An object is materially wrapped by another object preserving/augmenting a stable contract.
- `offline-processing` — Primary computation runs as local/offline transformation tooling.
- `polymorphism` — Code operates through abstract/interface types with multiple implementations.
- `proxy-pattern` — Proxy pattern is explicitly implemented through a stand-in sharing the target interface.
- `rapid-prototyping` — Repository history/shape supports a short focused prototyping cycle.
- `shape-validation` — Numerical/model code materially checks or reasons about tensor/array dimensions.
- `singleton-pattern` — Singleton pattern is explicitly implemented.
- `small-function-decomposition` — Repository organizes narrow reusable helpers as small focused functions.
- `state-diagram-documentation` — Repository documentation materially includes a state diagram corresponding to implemented behavior.
- `static-linting` — Repository configures lint/static-analysis rules for authored source.
- `structural-design-patterns` — Repository explicitly studies/implements the structural GoF pattern family.
- `validation-first-processing` — Core output generation occurs after explicit validation checks.
- `vectorized-computation` — Numerical implementation materially uses vector/matrix operations for core computation.

# Design Patterns

- `behavioral-design-patterns` — Repository explicitly studies or implements behavioral GoF-style design patterns.
- `chain-of-responsibility` — Chain of Responsibility is materially implemented through ordered handler delegation.
- `mediator-pattern` — Mediator is materially implemented to coordinate peer objects through a central collaborator.
- `memento-pattern` — Memento is materially implemented to capture and restore object state snapshots.
- `observer-pattern` — Observer is materially implemented through one-to-many notification of registered observers.
- `state-pattern` — State is materially implemented through explicit state objects that alter context behavior/state.
- `strategy-pattern` — Strategy is materially implemented through interchangeable behavior supplied behind a common contract.
- `template-method-pattern` — Template Method is materially implemented through a fixed algorithm skeleton with subclass-defined steps.

# Simulation and Modeling

- `3d-simulation-assets` — Repository materially preserves 3D world/model/texture assets used by a simulation.
- `matlab` — MATLAB materially participates in the repository's simulation or integration workflow.
- `prescan` — PreScan project/configuration artifacts materially define a vehicle/sensor simulation.
- `radar-simulation` — Repository materially models radar sensing in simulation.
- `sensor-configuration` — Simulated sensor assignments or parameters are materially configured in repository artifacts.
- `simulink` — Simulink model artifacts materially implement or orchestrate simulation behavior.
- `vehicle-simulation` — Repository materially models vehicle/world behavior in a simulator.

# Robotics and Autonomous Systems

- `autonomous-driving` — Repository materially contributes to an autonomous/self-driving vehicle workflow.
- `azimuth-elevation` — Sensor outputs materially include azimuth/elevation angular measurements.
- `energy-loss` — Radar/sensor output materially includes signal energy-loss information.
- `publish-subscribe` — Components materially exchange data through publish/subscribe messaging semantics.
- `radar-range` — Radar/sensor outputs materially include target range.
- `ros` — ROS materially participates in runtime integration.
- `ros-node` — Repository workflow materially starts or operates a ROS node.
- `ros-topics` — ROS topics materially carry repository data/signals.
- `sensor-fusion` — Repository materially participates in multi-sensor fusion integration.
- `target-identification` — Sensor outputs materially include target/object identity information.
- `topic-publication` — Repository evidence materially demonstrates publishing data onto topics.
- `topic-subscription` — Repository evidence materially demonstrates subscribing to topic data.

# Domain

- `ancient-egyptian` — Project domain materially involves Ancient-Egyptian language/history/sign data.
- `coptic-script` — Coptic Unicode text is materially generated or stored as application output/data.
- `egyptian-calendar` — Application materially models or renders an Egyptian calendar representation.
- `gardiner-sign-codes` — Gardiner-style Egyptian sign identifiers are materially processed.
- `hieroglyphs` — Egyptian hieroglyphic characters/sign representations are material application data.
- `language-tooling` — Repository implements software for language lookup, transliteration, or related text transformation.
- `pharaoh-names` — Pharaoh/royal names are material structured domain data.
- `social-network-analysis` — Project computes relationships or metrics over social-network-style data.
- `structured-document-processing` — Repository materially processes structured documents and hierarchy.

# Portfolio Significance

Any canonical `earliest-observed-<capability>` tag qualifies only when the underlying positive capability is evidenced in that repository and no earlier repository by canonical `startDate` chronology contains it.
