# Batch Report — Repositories 100–111

- Repositories processed: **12**
- Batch ledger lines: **12,573**
- Batch words: **115,434**
- Cumulative ledger lines through Repo111: **119,040**
- Structural floor: **57 H2 sections per repository**
- Depth floor: **1,000+ lines per repository**

## Line/depth ledger

| Repo | Name | Lines | Words | H2 | Maturity | PEW |
|---:|---|---:|---:|---:|---:|---:|
| 100 | `Apple-Project` | 1,049 | 9,990 | 57 | 1.7/5 | 2.4/5 |
| 101 | `NRF-Zephyr` | 1,048 | 9,596 | 57 | 1.4/5 | 1.9/5 |
| 102 | `Fast-FTP` | 1,046 | 9,468 | 57 | 2.0/5 | 2.8/5 |
| 103 | `Private-FTP` | 1,047 | 10,015 | 57 | 3.0/5 | 4.1/5 |
| 104 | `SocketLib` | 1,050 | 9,627 | 57 | 2.8/5 | 4.1/5 |
| 105 | `ahaha` | 1,049 | 8,633 | 57 | 0.0/5 | 0.1/5 |
| 106 | `Thesis-Scripts` | 1,048 | 9,945 | 57 | 2.9/5 | 4.4/5 |
| 107 | `Rogers-Experiment` | 1,047 | 10,344 | 57 | 4.0/5 | 4.9/5 |
| 108 | `Jackal-Performance-Heatmaps-using-mmWave` | 1,046 | 8,549 | 57 | 0.0/5 | 0.1/5 |
| 109 | `SwiftFTP` | 1,049 | 9,313 | 57 | 0.9/5 | 0.8/5 |
| 110 | `SedraFTPVariant` | 1,046 | 10,293 | 57 | 3.6/5 | 4.8/5 |
| 111 | `Ray-Tracing-Experiment` | 1,048 | 9,661 | 57 | 1.0/5 | 1.2/5 |

## Batch-level findings

- Repo100 is provenance-heavy Apple networking integration: STFTPNetwork and the CoreWiFi helper are upstream/other-authored, so credit is integration/toolchain exposure rather than FTP/CoreWiFi implementation authorship.
- Repo101 is guided Zephyr/Linaro scheduling material; no BLE/GATT/Nordic application evidence was found despite the repository name.
- Repo102 is a directly inspectable Swift/UIKit FTP downloader; plaintext FTP, hardcoded credentials and duplicated source extensions cap maturity.
- Repo103 adds real Objective-C scheduling/instrumentation and Python experiment tooling but vendors WhiteRaccoon and later drifts into a large tinySA PyQt spectrum application with provenance uncertainty.
- Repo104 is the strongest direct low-level protocol node in the first half of the batch: a custom DHCP server manually parses/builds BOOTP/DHCP packets and tracks leases.
- Repos105 and 108 are empty repositories. They add chronology but zero technical skill evidence.
- Repo106 turns networking knowledge into wireless measurement instrumentation: timestamped ping/iperf3 capture plus Aruba RSSI/SNR log parsing.
- Repo107 is a major real wireless experiment-system node: Husky, Wi-Fi AP logs, Quectel 5G/QMI/AT workflows, unified timestamps and browser analyzers for latency/jitter/throughput/signal.
- Repo109 is primarily a deduplicated WhiteRaccoon/SceneDelegate shell and adds little independent evidence.
- Repo110 is the strongest FTP automation/orchestration node so far, combining concurrent LAN discovery, UDP control, automated trials, FastAPI phone control and a pyftpdlib virtual-stream server; prompt/generated provenance and insecure defaults remain explicit.
- Repo111 is a MathWorks copyrighted example and receives only guided ray-tracing API exposure credit.

## Validation

- Every repository has exactly 57 H2 sections.
- Every repository has at least 1,000 lines.
- Empty/title-only repositories remain explicit N/A/no-evidence nodes.
- Third-party/tutorial/carry-forward provenance is separated from authored implementation.
- Sensitive-looking credentials, station identifiers, certificate/profile contents and lab addresses are not reproduced as career facts.
- Repository names and GitHub language badges do not override source behavior.
