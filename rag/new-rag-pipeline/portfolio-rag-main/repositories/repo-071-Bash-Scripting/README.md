# Repository 071 — Bash-Scripting

## Repository Identity

- **Repository:** `kirolossedra/Bash-Scripting`
- **Repository start date:** 2024-10-26
- **Last meaningful update date:** 2024-11-21
- **Latest meaningful commit:** `c196d94ed379f991975d2def156c22b7dae915dc`
- **Primary technical field:** Windows filesystem automation
- **Primary technologies:** Windows Batch, PowerShell
- **Project context:** personal scripting utility collection
- **Collaboration classification:** `individual-project`

## Evidence Basis

Despite the repository name, the checked-in executable scripts are:

- `rename.bat`;
- `naming.bat`;
- `DeleteRecovery.ps1`.

The implementation evidence therefore supports **Windows Batch and PowerShell**, not Bash.

This distinction is important for RAG accuracy: repository naming is not substituted for source evidence.

## What This Project Is

`Bash-Scripting` is a compact utility repository for repetitive filesystem operations on Windows.

The scripts automate three concrete workflows:

1. sequentially rename image files;
2. create numbered directories from a line-oriented names file;
3. recursively locate and delete directories named `RECOVERY`.

The repository is small, but each file has a narrow operational purpose.

## Repository Shape

```text
Bash-Scripting/
├── DeleteRecovery.ps1
├── naming.bat
├── rename.bat
└── README.md
```

## Sequential Image Renaming

`rename.bat` operates on image files in the current working directory.

### File Selection

A `for` loop enumerates:

- `*.jpg`;
- `*.png`.

### Counter State

The script initializes a counter at one and enables delayed environment-variable expansion.

### Rename Operation

Each image is renamed to a sequential number while retaining its original extension.

Conceptually:

```text
photoA.jpg  → 1.jpg
imageB.png  → 2.png
scanC.jpg   → 3.jpg
```

### Batch-Scripting Concepts

This script demonstrates:

- `@echo off`;
- `setlocal`;
- delayed expansion;
- `for` loops;
- file-extension expansion;
- arithmetic with `set /a`;
- `ren`.

## Folder Generation from Text Data

`naming.bat` turns a text file into a directory structure.

### Input Guard

The script first checks whether `Names.txt` exists.

If the required file is absent, it exits early.

### Line-Oriented Processing

`for /f "delims="` reads the text file line by line.

### Deterministic Naming

Each line becomes part of a folder name with a numeric prefix:

```text
0_<first line>
1_<second line>
2_<third line>
```

### Directory Creation

The script creates each resulting path through `mkdir`.

This is a small example of converting text data into filesystem structure.

## PowerShell Recursive Cleanup

`DeleteRecovery.ps1` uses a different Windows scripting environment for a recursive cleanup task.

### Parameterized Root Path

The script accepts a `RootDir` parameter.

A missing path triggers an explicit exception message.

### Recursive Directory Discovery

PowerShell's `Get-ChildItem` searches recursively for directories named:

```text
RECOVERY
```

### Pipeline Processing

Matching directories are piped into `ForEach-Object`.

### Recursive Deletion

Each directory is removed through:

```powershell
Remove-Item -Recurse -Force
```

### Operational Output

The script prints each deleted folder and a final completion message.

## Why Two Scripting Environments Matter

The repository shows choosing a scripting environment based on the operation.

Batch handles small current-directory transforms efficiently.

PowerShell provides a richer object/pipeline model for recursive filesystem traversal.

That is more informative than treating all command automation as one generic “shell” skill.

## Engineering Practices

### Input Validation

`naming.bat` verifies that its source text file exists.

`DeleteRecovery.ps1` requires or throws for the root-directory input.

### Automation of Repetitive Work

All three scripts replace repetitive manual filesystem operations.

### Parameterization

The PowerShell utility accepts its search root instead of hard-coding one path.

### Progress Feedback

Scripts emit status messages after actions.

### Extension Preservation

The image-renaming script retains the existing file extension while changing the base name.

## Scale and Complexity

The repository contains only three short scripts.

Its value comes from concrete automation breadth:

- file enumeration;
- renaming;
- text-file iteration;
- directory creation;
- recursive search;
- recursive deletion;
- argument handling.

## Skills Demonstrated

### Windows Batch

- **Batch control flow — strong evidence.**
- **Delayed variable expansion — strong evidence.**
- **Filesystem iteration — strong evidence.**
- **File renaming — strong evidence.**
- **Folder creation — strong evidence.**

### PowerShell

- **Parameter handling — strong evidence.**
- **Recursive filesystem traversal — strong evidence.**
- **Object pipeline processing — strong evidence.**
- **Recursive deletion — strong evidence.**

### Automation

- **Filesystem automation — strong evidence.**
- **Input guards — strong evidence.**
- **Small operational tooling — strong evidence.**

## Capability Developed

This repository adds direct evidence of Windows-native scripting.

Earlier command-line repositories focus on Linux and Unix tools.

Here the portfolio expands into:

- Windows Batch syntax;
- PowerShell pipelines;
- Windows-oriented filesystem automation.

## Portfolio Evolution Context

This is the earliest processed repository with direct evidence of:

- Windows Batch;
- PowerShell;
- Windows-focused filesystem automation.

The repository title itself is not used as evidence for Bash.

## Historical Significance

`Bash-Scripting` is a useful evidence-quality example because the source contradicts the repository name.

The corpus preserves what was actually implemented: Batch and PowerShell utilities.

That makes this repository relevant both technically and methodologically.

## Overall Repository Narrative

`Bash-Scripting` is a small collection of Windows automation scripts.

The code sequentially renames images, generates numbered folders from text input, and recursively removes `RECOVERY` directories using PowerShell.

Its strongest evidence is pragmatic filesystem automation and the use of two different Windows scripting environments for distinct tasks.

# Project Tags

## Project Type

- `scripting-utility-collection`
- `developer-tooling`
- `filesystem-automation`

## Collaboration and Authorship

- `individual-project`

## Languages

- `windows-batch`
- `powershell`

## Tooling

- `file-renaming`
- `directory-generation`
- `recursive-directory-search`
- `recursive-file-deletion`
- `text-file-processing`
- `parameterized-script`

## Software Engineering Practices

- `input-validation`
- `automation`
- `operational-tooling`

## Portfolio Significance

- `earliest-observed-windows-batch`
- `earliest-observed-powershell`
- `earliest-observed-windows-filesystem-automation`
