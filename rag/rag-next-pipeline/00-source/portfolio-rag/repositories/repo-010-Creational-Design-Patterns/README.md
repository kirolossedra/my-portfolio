# Creational-Design-Patterns

## Repository Identity

- Repository: 010 / 134
- Name: `Creational-Design-Patterns`
- Repository start date: 2023-02-16
- Last meaningful update date: 2023-03-03
- Primary type: Design-pattern learning repository
- Technical field: Object-oriented software design
- Project context: Personal educational implementation
- Collaboration type: `individual-project`
- Primary implementation language: Java
- Build tooling: Maven

## Collaboration and Authorship Context

The visible Java sources include owner author headers and the commit history is owner-attributed, supporting personal attribution of the pattern implementations.

Generated Maven `target` output is treated as build evidence rather than authored source complexity.

## Evidence Basis

The repository README states that the project contains creational design-pattern implementations in Java.

The current root contains implementations for:

- Builder;
- Factory Method;
- Singleton, under the misspelled `Singeleton` directory.

The README also discusses Prototype conceptually. Because the corpus uses implementation-backed tagging, the implemented pattern tags are based on the concrete source directories and classes.

## What This Repository Is

`Creational-Design-Patterns` is a compact Java learning repository that implements object-creation patterns as separate Maven projects.

The subject of the code is software architecture itself: object creation is isolated behind interfaces, abstract creators, builders, and controlled construction relationships.

## Repository Structure

```text
Creational-Design-Patterns/
  Builder/
      pom.xml
      src/main/java/...
      target/...
  Factory Method/
      pom.xml
      src/main/java/...
      target/...
  Singeleton/
      pom.xml
      src/main/java/...
      target/...
  README.md
```

The presence of compiled `target/classes` artifacts provides build evidence for the Maven projects.

## Technical Stack

### Java

Java is used to express:

- classes;
- interfaces;
- abstract classes;
- overriding;
- encapsulated construction;
- polymorphism;
- composition.

### Maven

Each pattern example is organized as its own Maven project through a `pom.xml`.

## Major Engineering Work

### Builder Pattern

The Builder example contains:

- `Car`;
- `Builder` interface;
- `CarBuilder`;
- `Director`;
- `BuilderPattern` entry point.

The `Builder` interface defines incremental construction operations for:

- reset;
- seat configuration;
- engine configuration;
- trip-computer configuration;
- GPS configuration.

`CarBuilder` stores the in-progress `Car`, returns the completed product, and resets itself for reuse.

`Director` defines reusable construction recipes such as a sports car and SUV.

This demonstrates separation among product representation, construction steps, concrete construction logic, and higher-level recipes.

### Factory Method Pattern

The Factory Method example centers on an abstract `Dialog`.

`Dialog.createButton()` is the factory method.

Concrete creators select product implementations:

- `WindowsDialog` → `WindowsButton`;
- `WebDialog` → `HTMLButton`.

The shared `render()` workflow consumes the result through the `Button` interface.

This demonstrates product variation behind an abstract creator contract.

### Singleton Pattern

The `Singeleton` Maven project contains the Singleton example and compiled `Database`/application classes.

This gives the repository direct implementation evidence for controlled single-instance access as a studied pattern.

## Object-Oriented Design Concepts

### Interfaces

`Builder` and `Button` define behavior behind abstractions.

### Abstract Classes

Factory Method uses an abstract `Dialog` creator.

### Polymorphism

Higher-level logic works through `Builder` and `Button` contracts.

### Composition

The concrete builder owns the product being constructed.

### Encapsulation of Creation

Creation decisions are moved into specialized construction objects/methods rather than being spread across consumers.

## Verification

### Maven Build Artifacts

Checked-in `target/classes` output provides direct evidence that the examples were compiled through Maven project structures.

### Runtime Demonstration

The Builder example contains a `main` method and prints a resulting property.

The Factory Method products print which button implementation is rendered or triggered.

These examples provide simple execution demonstrations of the pattern relationships.

## Engineering Practices

### Pattern Isolation

Each implemented pattern lives in its own Maven subproject.

### Abstraction-Oriented Design

Interfaces and abstract classes are used at intended extension points.

### Separation of Construction Concerns

The examples deliberately move object-creation responsibility away from direct consumer code.

### Documentation

The root README identifies the learning subject, and the Builder project includes additional README material.

## Scale and Complexity

### Source Scale

The repository is composed of small, focused examples.

### Conceptual Scale

The main breadth comes from comparing multiple approaches to object creation and understanding how responsibilities move between products, creators, builders, and clients.

## Skills Demonstrated

### Language

- **Java — strong evidence.**

### Object-Oriented Programming

- **Interfaces — strong evidence.**
- **Inheritance — strong evidence.**
- **Abstract classes — strong evidence.**
- **Polymorphism — strong evidence.**
- **Composition — strong evidence.**
- **Encapsulation of creation logic — strong evidence.**

### Design Patterns

- **Builder — strong implemented evidence.**
- **Factory Method — strong implemented evidence.**
- **Singleton — strong implemented evidence.**

### Build Tooling

- **Maven — moderate-to-strong evidence.**

## Capability Developed

This repository marks a shift from solving only domain-specific implementation problems toward deliberately studying reusable object-oriented design structures.

The key capability is recognizing object creation as an architectural responsibility that can be isolated behind stable abstractions.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- Java;
- Maven;
- a dedicated design-pattern repository;
- Builder pattern;
- Factory Method pattern;
- Singleton pattern.

Explicit object-oriented design vocabulary becomes substantially stronger here because the source is organized around extension points and construction responsibilities.

## Historical Significance

`Creational-Design-Patterns` establishes an explicit software-design-learning phase in the processed chronology.

It is also the earliest observed Java/Maven repository, creating a useful historical baseline for later Java and framework-based backend work.

## Overall Repository Narrative

`Creational-Design-Patterns` is a focused Java repository for learning object-creation architecture.

Builder separates configurable product construction from reusable construction recipes. Factory Method delegates concrete product selection to subclasses while keeping a shared workflow stable. Singleton provides a controlled single-instance example.

The repository is historically important because Java and explicit design-pattern study enter the processed portfolio here as first-class learning subjects.

# Project Tags

## Project Type

- `design-pattern-learning`
- `educational-project`
- `personal-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `java`

## Software Engineering Practices

- `maven`
- `object-oriented-programming`
- `interfaces`
- `abstract-classes`
- `polymorphism`
- `composition`
- `object-creation-abstraction`
- `builder-pattern`
- `factory-method-pattern`
- `singleton-pattern`
- `creational-design-patterns`

## Testing and Verification

- `build-artifact-evidence`
- `manual-execution-demo`

## Portfolio Significance

- `earliest-observed-java`
- `earliest-observed-maven`
- `earliest-observed-design-patterns`
- `earliest-observed-builder-pattern`
- `earliest-observed-factory-method-pattern`
- `earliest-observed-singleton-pattern`
