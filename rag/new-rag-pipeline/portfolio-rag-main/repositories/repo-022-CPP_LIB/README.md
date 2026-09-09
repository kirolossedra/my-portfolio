# CPP_LIB

## Repository Identity

- Repository: 022 / 134
- Name: `CPP_LIB`
- Repository start date: 2023-11-30
- Last meaningful update date: 2024-02-29
- Primary type: Personal C++ utility collection
- Technical field: General-purpose programming utilities, text processing, and number-theory helpers
- Collaboration type: `individual-project`
- Primary implementation language: C++

## Collaboration and Authorship Context

The visible repository history is owner-authored, including the latest `Factorization.cpp` commit on 2024-02-29. The current utility implementations are therefore personally attributable at repository level.

The collection is intentionally small and heterogeneous: individual `.cpp` files capture reusable snippets, experiments, and helper functions rather than one integrated application.

## Evidence Basis

The analysis is grounded in the repository tree, README, C++ source files, and commit history.

The current tree contains utilities including:

- `Irregular String Input Difference.cpp`;
- `Trim String.cpp`;
- `Factorization.cpp`;
- `isPrime.cpp`;
- `sieve.cpp`;
- `LCD.cpp`;
- `numberToEnglish.cpp`;
- `reverseInt.cpp`;
- `overflowChecker.cpp`;
- `splitSpace.cpp`;
- `xorv.cpp`.

## What This Project Is

`CPP_LIB` is a personal collection of compact C++ utilities accumulated across late 2023 and early 2024.

The repository is not organized around a single product workflow. Instead, it acts as a reusable scratch/library area for frequently useful programming operations: string cleanup, tokenization, set-like comparison of word collections, integer reversal, XOR accumulation, prime testing, prime counting, factorization, common-divisor reasoning, and exploratory number-to-text conversion.

This gives the project value as evidence of reusable coding patterns and small-function problem solving rather than application architecture.

## Project Scope

The repository covers several distinct utility families.

### Text Input and String Processing

`Irregular String Input Difference.cpp` reads two multi-line text blocks until a sentinel string is encountered, tokenizes both streams using whitespace-aware extraction, compares their word collections, sorts the values present only in the first input, and prefixes those values with `SELECT * FROM `.

`Trim String.cpp` contains:

- repeated-whitespace cleanup;
- leading/trailing blank trimming;
- conversion of a ratio string into percentage output;
- a small executable test harness.

`splitSpace.cpp` manually tokenizes a string into whitespace-delimited pieces.

### Number-Theory and Arithmetic Helpers

`Factorization.cpp` computes prime factors of a positive integer.

`isPrime.cpp` checks primality by searching divisors only up to the square root.

`sieve.cpp` implements a Sieve-of-Eratosthenes-style boolean table and counts primes below a bound.

`LCD.cpp` computes a GCD across an integer vector and then reduces that value until a prime divisor remains.

`xorv.cpp` accumulates the bitwise XOR of an integer vector.

### Integer Representation Helpers

`reverseInt.cpp` reverses decimal digits through modulus and integer division.

`overflowChecker.cpp` compares a `BigInt` value against `INT32_MAX`.

`numberToEnglish.cpp` is an exploratory partial number decomposition / English-word conversion experiment containing `unitator`, `hunds`, and an unfinished `DigitSectionizer` direction.

## Architecture and System Shape

The repository is a flat utility collection:

```text
CPP_LIB
├─ text-processing snippets
│  ├─ irregular multi-line difference
│  ├─ trimming / cleaning
│  └─ whitespace tokenization
├─ number-theory snippets
│  ├─ primality
│  ├─ sieve
│  ├─ factorization
│  └─ GCD-derived factor search
└─ integer helpers
   ├─ reverse digits
   ├─ overflow check
   └─ XOR accumulation
```

Each file is largely self-contained and can be copied or adapted independently.

## Technical Stack

### C++

C++ is used throughout for:

- `std::string`;
- `std::vector`;
- streams;
- `std::istringstream`;
- algorithms such as sorting;
- integer arithmetic;
- exception throwing;
- loops and conditionals;
- basic test/demo `main` functions.

### Standard Library Text Processing

The irregular-string utility uses `std::getline` for multi-line collection and `std::istringstream >>` for whitespace-aware tokenization.

### Standard Library Containers

`std::vector` is the primary collection structure for token lists, integer lists, and factor outputs.

## Major Engineering Work

### Multi-Line Input Comparison

The largest utility reads arbitrary multi-line blocks until the sentinel `STOP`.

It then:

1. preserves the entered blocks;
2. tokenizes both;
3. records word counts;
4. compares every token from the first set with tokens in the second;
5. retains values present only in the first;
6. sorts those values;
7. converts each result into a `SELECT * FROM ...` line.

The repository README explicitly documents this tool as comparing first-input items against second-input items.

This is practical developer tooling for reconciling irregular text lists.

### Prime Factorization

`primeFactors(int n)`:

- returns an empty factor list for `1`;
- throws `std::invalid_argument` for negative values;
- repeatedly extracts factor `2`;
- searches odd factors up to `sqrt(n)`;
- appends a remaining prime factor.

The function demonstrates both input validation and a more efficient factor search than testing every integer through `n`.

### Sieve-Based Prime Counting

`_sieve(int n)` initializes a boolean prime table, marks composite multiples beginning at `p*p`, and counts surviving primes below `n`.

This demonstrates the Sieve of Eratosthenes as a different prime-related strategy from direct divisor testing.

### Direct Primality Check

`is_prime(int n)` tests candidate divisors only while `i*i <= n`.

The repository therefore preserves multiple number-theory approaches rather than one repeated implementation.

### String Trimming and Local Test Harness

`Trim String.cpp` includes a `cleaner` function that advances inward over leading/trailing blank characters and reconstructs the trimmed substring.

Its `main` function executes four concrete cases, increments a success counter, and prints the success ratio as a percentage.

That is direct evidence of small-scale expected-output verification inside a utility file.

### Reusable Tokenization

`splitSpace` manually accumulates non-space characters into a temporary token and emits tokens to a vector when whitespace is encountered.

### Integer Digit Reversal

`reverseInt` repeatedly uses `% 10` and `/ 10` to reconstruct a decimal integer in reverse digit order.

### XOR Reduction

`_xorv` reduces a vector into one integer through repeated bitwise XOR.

### Overflow Boundary Check

`overflowChecker` compares a `BigInt`-style value to the signed 32-bit maximum.

### Exploratory Number-to-English Work

`numberToEnglish.cpp` decomposes digits and contains partial branches for units, tens, and hundreds.

The source itself shows this as exploratory/incomplete work rather than a complete arbitrary-number formatter.

## Verification

### Embedded Expected-Output Checks

`Trim String.cpp` contains four explicit test cases for trimming behavior.

The program compares actual returned strings with expected strings and reports a success percentage.

### Console Demonstration

Several utilities are executable console snippets that print intermediate values, counts, or generated output for direct inspection.

## Engineering Practices

### Small Reusable Functions

The repository isolates narrow responsibilities into compact helpers such as:

- `is_prime`;
- `primeFactors`;
- `_sieve`;
- `splitSpace`;
- `reverseInt`;
- `_xorv`;
- `overflowChecker`.

### Input Validation

The factorization helper rejects negative input through an exception.

### Algorithm Selection by Problem Shape

The repository includes both direct divisor search and sieve-style prime processing, reflecting selection of different techniques for one-off primality versus range-oriented counting.

### Self-Documented Limitations

The README documents the irregular-string tool's whitespace tokenization behavior and one-direction comparison.

The partial number-to-English source also preserves the exploratory state directly in implementation.

## Scale and Complexity

### Implementation Scale

The repository contains roughly a dozen small source artifacts rather than a large application.

### Breadth

Its scale comes from the number of reusable problem types represented:

- strings;
- stream input;
- collection comparison;
- sorting;
- prime testing;
- factorization;
- sieve processing;
- GCD reasoning;
- bitwise operations;
- integer digit manipulation.

### Historical Time Span

The repository starts in November 2023 and continues receiving utility additions through February 2024.

## Skills Demonstrated

### C++

- **C++ utility development — strong evidence.**
- **Standard-library strings and vectors — strong evidence.**
- **Stream-based input parsing — strong evidence.**
- **Exception-based input validation — moderate evidence.**
- **Bitwise operations — moderate evidence.**

### Algorithms

- **Prime factorization — strong evidence.**
- **Primality testing — strong evidence.**
- **Sieve of Eratosthenes — strong evidence.**
- **GCD-based reasoning — moderate evidence.**
- **Sorting — strong evidence.**
- **Nested collection comparison — strong evidence.**

### Text Processing

- **Multi-line console input — strong evidence.**
- **Whitespace tokenization — strong evidence.**
- **String trimming — strong evidence.**
- **Generated SQL-line formatting — moderate evidence.**

### Verification

- **Embedded expected-output checks — moderate evidence.**
- **Manual console verification — strong evidence.**

## Capability Developed

The repository represents a shift toward maintaining a personal bank of reusable implementation patterns.

Rather than solving only a single project problem, small algorithms and text-processing helpers are preserved independently for later reuse.

That pattern is useful historically because it shows deliberate accumulation of coding utilities alongside the larger product, hardware, networking, and ML repositories.

## Portfolio Evolution Context

This repository strengthens personally attributable C++ evidence after the earlier collaborative XML project and the longitudinal LeetCode repository.

It also introduces the earliest observed dedicated personal **general C++ utility library** in the processed corpus.

The repository connects interview-style algorithm practice with reusable day-to-day programming helpers.

## Historical Significance

`CPP_LIB` marks a utility-library phase in the portfolio: small, frequently reusable solutions are collected outside a single application.

Its later February 2024 additions show the repository continuing to accumulate algorithms rather than being a one-day exercise.

## Overall Repository Narrative

`CPP_LIB` is a compact owner-authored C++ utility collection spanning text processing and algorithmic helpers.

The largest text tool compares two irregular multi-line token sets and emits SQL-style lines for values that exist only in the first input. Smaller utilities cover trimming, whitespace splitting, prime testing, factorization, sieve-based prime counting, GCD-derived factor reasoning, integer reversal, overflow checking, XOR reduction, and exploratory number decomposition.

The repository's strongest portfolio value is breadth of reusable C++ problem-solving patterns and evidence of maintaining personal implementation snippets over time.

# Project Tags

## Project Type

- `utility-library`
- `developer-tooling`
- `algorithm-utility-collection`
- `personal-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `cpp`

## Systems Engineering and Algorithms

- `prime-factorization`
- `primality-testing`
- `sieve-of-eratosthenes`
- `gcd`
- `sorting`
- `bitwise-xor`
- `integer-digit-reversal`

## Database and Data

- `text-parsing`
- `text-normalization`
- `whitespace-tokenization`
- `collection-difference`

## Testing and Verification

- `expected-output-verification`
- `manual-execution-demo`

## Software Engineering Practices

- `input-validation`
- `small-function-decomposition`
- `known-limitations-documented`

## Portfolio Significance

- `earliest-observed-general-cpp-utility-library`
