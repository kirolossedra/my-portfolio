# Repository 039 — Linux

## Repository Identity

- **Repository:** `kirolossedra/Linux`
- **Repository start date:** 2024-08-17
- **Last meaningful update date:** 2024-08-25
- **Artifact type:** Linux operational notes and command reference
- **Primary formats:** Markdown and shell-command text
- **Collaboration classification:** individual reference repository

## What This Repository Is

`Linux` is a compact personal operational reference.

It records commands used around a Linux robotics/development environment rather than implementing a standalone application.

The material covers package installation, shell startup configuration, sudo/ownership operations, Git and GitHub CLI, PDF viewing, and RViz graphics troubleshooting.

## Development Environment Bootstrap

`ImportantLibraries.bashrc` records installation commands for:

- Git,
- `g++`,
- CMake,
- PCL development headers,
- Eigen3 development headers.

These dependencies align directly with the contemporaneous C++, point-cloud, Kalman-filter, and robotics repositories.

## Shell Configuration

The `SUDO` notes include:

- inspecting `~/.bashrc`,
- editing `~/.bashrc`,
- sourcing `~/.bashrc`.

This preserves the practical cycle of changing shell initialization and reloading the environment.

## GitHub CLI

The same notes record installing `gh`, authenticating with `gh auth login`, and cloning through `gh repo clone`.

This is direct evidence of GitHub CLI use in the Linux workflow.

## Filesystem Permissions

A concrete command recursively changes ownership of:

`/home/kiro/Robotics/src/`

That ties the repository directly to a robotics workspace and documents resolution of a Linux ownership/permission problem.

## Git Workflow Notes

`git.md` records a basic change lifecycle:

1. `git add`,
2. `git commit`,
3. `git push`.

It also records a force-push command.

The repository therefore served as a working source-control cheat sheet.

## Graphics and Robotics Troubleshooting

`media.md` records PDF opening through `evince`, setting `LIBGL_ALWAYS_SOFTWARE=1`, and starting `rviz2`.

The environment variable forces software rendering, which is a concrete workaround for graphics/runtime problems when launching RViz.

## Technical Context

The repository connects Linux package management with C++ compilation, CMake, Eigen, PCL, ROS/RViz, Git, and GitHub CLI.

It is best interpreted as operational knowledge accumulated while setting up robotics development.

## Engineering Skills Demonstrated

### Package Management

`apt` and `apt-get` provision development dependencies.

### Filesystem Ownership

`chown -R` is used to repair workspace ownership.

### Shell Environment Management

`.bashrc` is inspected, edited, and sourced.

### Source Control Operations

Git and GitHub CLI commands are retained as a reusable workflow.

### Graphics Troubleshooting

RViz is launched with software rendering as an environment workaround.

## Capability Developed

The repository captures the operational layer beneath robotics software.

The capability is moving between source code, package dependencies, build tools, shell environment, filesystem permissions, source control, and visualization runtime.

## Portfolio Evolution

`Linux` appears on the same day as `Kalman-Filters` and immediately before the dedicated `ROS` repository.

The PCL, Eigen, CMake dependencies and concrete `/home/kiro/Robotics/src/` path make the connection explicit.

It marks a transition into hands-on Linux robotics tooling.

## Overall Repository Narrative

`Linux` is a small engineering notebook built around real environment friction.

It records how a native robotics environment was provisioned, how shell state was reloaded, how GitHub CLI authentication/cloning worked, how workspace ownership was corrected, and how RViz was launched under software rendering.

Its portfolio value is operational rather than product-oriented.

# Project Tags

## Project Type
- `engineering-notes`
- `developer-reference`
- `linux-command-reference`
- `individual-project`

## Operating Systems and Tooling
- `linux`
- `apt`
- `bashrc`
- `sudo`
- `filesystem-permissions`
- `chown`
- `github-cli`
- `git`
- `cmake`
- `gpp`

## Robotics Environment
- `pcl`
- `eigen`
- `rviz`
- `software-rendering`

## Software Engineering Practices
- `environment-setup`
- `dependency-installation`
- `source-control-workflow`
- `troubleshooting-notes`

## Portfolio Significance
- `earliest-observed-linux-command-reference`
- `earliest-observed-github-cli`
- `earliest-observed-rviz`
