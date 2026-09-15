# Tag Ontology Extensions — Repositories 083–089

This file extends the factual retrieval vocabulary for repositories 083 through 089.

Tags describe repository-supported implementation or clearly labeled evidence boundaries. They are not ratings.

## Language Learning and Export

- `language-learning` — software whose implemented workflow supports structured language study.
- `vocabulary-tracker` — persistent capture and organization of words/expressions.
- `localization` — interface content changes according to an explicit language state.
- `pdf-generation` — application-generated PDF output.
- `jspdf` — direct use of the jsPDF browser library.
- `jspdf-autotable` — direct use of jsPDF AutoTable for tabular document output.
- `client-side-export` — downloadable artifact generation occurs inside the browser.
- `case-insensitive-validation` — validation explicitly normalizes case for comparison.

## Numerical Robotics / Inverse Kinematics

- `robotics-toolbox-python` — direct use of Robotics Toolbox for Python.
- `denavit-hartenberg` — robot kinematics modeled with DH parameters.
- `dhrobot` — direct construction of a Robotics Toolbox `DHRobot`.
- `inverse-kinematics` — iterative solving for joint state from a target end-effector pose.
- `jacobian-pseudoinverse` — Jacobian pseudoinverse used as an IK update method.
- `damped-least-squares` — damped normal-equation inversion used for numerical robustness.
- `damped-least-squares-ik` — damped least-squares specifically used in inverse kinematics.
- `trajectory-analysis` — state/path history is recorded and analyzed.
- `experiment-comparison` — several algorithms are run through a shared experimental harness.

## Android Networking

- `kotlin` — substantive implementation in Kotlin.
- `android-udp-receiver` — native Android application receives UDP datagrams directly.
- `udp-unicast` — explicit unicast UDP receive path.
- `programmatic-android-ui` — Android view hierarchy constructed directly in Kotlin rather than XML layout.
- `kotlin-coroutines` — direct coroutine use for asynchronous/background work.
- `dispatchers-io` — blocking I/O moved onto the coroutine IO dispatcher.
- `android-handler` — Android `Handler`/main looper used for UI-thread coordination.
- `network-diagnostics` — application exposes runtime interface/address/network behavior for operator inspection.

## Organizational / RTL Frontend

- `organizational-website` — public website designed around an external organization.
- `ministry-website` — organizational website for ministry/church communication.
- `rtl` — right-to-left document/layout behavior is explicit.
- `arabic-ui` — substantive Arabic-language interface.
- `rtl-organizational-website` — an organizational website explicitly implemented for RTL use.
- `ios-layout-debugging` — repository history explicitly records iOS-specific presentation debugging.
- `rollback-driven-debugging` — repository history explicitly records rollback to a known-good version during debugging.
- `daily-bible-verse` — third-party dynamic verse widget is integrated.
- `donation-links` — UI integrates external donation/payment links without implying local payment processing.

## Documented Generative NLP Workflow

- `documentation-heavy-project` — substantive project knowledge is stored primarily as documentation rather than executable source.
- `documented-workflow` — the repository specifies a detailed implementation workflow without proving execution.
- `generative-nlp` — documented work focuses on language generation.
- `gpt2` — GPT-2 is the primary documented model.
- `causal-language-modeling` — training design uses causal LM rather than masked LM.
- `gpt2-finetuning-workflow` — end-to-end GPT-2 fine-tuning flow is documented.
- `hugging-face-trainer` — Hugging Face Trainer API is directly represented in the workflow.
- `dataset-fallback` — workflow explicitly switches to an alternative dataset when the preferred source fails.
- `not-execution-verified` — repository contents do not establish that the documented run was executed.

## Realtime Audience Interaction

- `audience-feedback` — system captures participant feedback for a shared audience context.
- `meeting-feedback` — audience feedback is explicitly framed around a meeting.
- `multi-device-workflow` — separate devices/pages play coordinated roles.
- `presenter-display` — shared/master screen intended for presenter/room display.
- `participant-form` — participant-facing response entry surface.
- `qr-code` — QR code is generated as an interaction/onboarding mechanism.
- `qrcodejs` — direct use of QRCode.js.
- `realtime-subscription` — client subscribes to changing remote data and updates live.
- `session-filtering` — application restricts displayed records to a locally defined session boundary.
- `message-deduplication` — previously rendered message IDs are explicitly tracked.
- `web-audio-api` — direct browser Web Audio API use.
- `audio-synthesis` — sound generated algorithmically in browser rather than played from a stored file.
- `known-xss-risk` — source inserts untrusted values through unsanitized HTML interpolation; used as an explicit limitation tag.

## Mobile Robot Control

- `unicycle-model` — controller operates on a unicycle-style planar mobile base.
- `feedback-control` — current state error directly drives control commands.
- `proportional-control` — control command is proportional to measured error.
- `heading-control` — angular command derives from heading error.
- `angle-normalization` — angle difference is normalized across wraparound.
- `velocity-saturation` — commands are clipped to configured bounds.
- `clf-inspired` — source labels the design as CLF-oriented, but evidence does not establish a formal CLF controller.
- `not-formal-clf-qp` — explicit negative boundary: no CLF-QP solve/stability inequality is implemented.
- `known-external-simulator-dependency` — required simulator code is referenced but absent from repository.

## Earliest-Observed Additions in This Batch

- `pdf-generation` → repository 083
- `jspdf` → repository 083
- `jspdf-autotable` → repository 083
- `robotics-toolbox-python` → repository 084
- `denavit-hartenberg` → repository 084
- `damped-least-squares-ik` → repository 084
- `kotlin` → repository 085
- `android-udp-receiver` → repository 085
- `kotlin-coroutines` → repository 085
- `rtl-organizational-website` → repository 086
- `arabic-ui` → repository 086
- `gpt2-finetuning-workflow` → repository 087
- `hugging-face-trainer` → repository 087
- `qr-driven-realtime-feedback` → repository 088
- `web-audio-api` → repository 088
- `realtime-subscription` → repository 088
- `unicycle-feedback-control` → repository 089
- `clf-inspired-control` → repository 089
