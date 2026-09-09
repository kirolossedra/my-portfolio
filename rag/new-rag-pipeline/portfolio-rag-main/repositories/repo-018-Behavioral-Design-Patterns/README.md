# Behavioral-Design-Patterns

## Repository Identity

- Repository: 018 / 134
- Name: `Behavioral-Design-Patterns`
- Repository start date: 2023-02-18
- Latest meaningful update date: 2023-03-03
- Primary type: Design-pattern learning repository
- Technical field: Object-oriented software design
- Application domain: Behavioral design-pattern exercises
- Project context: Personal educational project
- Collaboration type: `individual-project`
- Primary implementation language: Java

## Collaboration and Authorship Context

The visible repository history consists of owner-attributed uploads, and the Java source files carry `@author sedra` headers.

The repository is therefore treated as personally attributable educational implementation work.

Its examples are compact demonstrations of named design patterns rather than one integrated application.

## Evidence Basis

The repository is organized as multiple independent Maven projects.

Positively implemented examples include:

- `ChainOfResponsibility`;
- `MediatorPattern`;
- `MementoPattern`;
- `ObserverPattern`;
- `StatePattern`;
- `StrategyPattern`;
- `TemplatePatternDemo`.

A `VisitorPatternDemo` Maven project also exists, but its committed Java source only prints `Hello World!` and does not implement Visitor mechanics. The corpus therefore does not use the repository as evidence of an implemented Visitor pattern.

Each implemented example contains its own `pom.xml`, Java source tree, and generated `target` build outputs.

## What This Project Is

`Behavioral-Design-Patterns` is a Java learning repository that explores how object-oriented systems distribute responsibility and coordinate behavior between objects.

Rather than focusing on object construction or structural composition, these examples concentrate on runtime interaction:

- passing requests through handlers;
- coordinating peers through a mediator;
- capturing and restoring state;
- broadcasting state changes to observers;
- changing behavior through explicit state objects;
- selecting algorithms through strategy objects;
- preserving a fixed algorithm skeleton while varying steps through subclasses.

The repository complements the earlier Creational and Structural design-pattern repositories and completes a broader period of explicit GoF-style pattern study.

## Repository Shape

```text
Behavioral-Design-Patterns/
├── ChainOfResponsibility/
├── MediatorPattern/
├── MementoPattern/
├── ObserverPattern/
├── StatePattern/
├── StrategyPattern/
├── TemplatePatternDemo/
└── VisitorPatternDemo/
```

Each implemented pattern is isolated in its own small executable project.

## Technical Stack

### Java

Java provides the object-oriented mechanisms used throughout the examples:

- interfaces;
- abstract classes;
- inheritance;
- composition;
- encapsulated state;
- polymorphic dispatch;
- collections.

### Maven

Each pattern directory contains a `pom.xml`, giving the examples separate Maven project boundaries.

Generated `target/classes` and Maven compiler-status artifacts are committed for multiple examples, providing direct evidence that the projects were compiled through the Maven build path.

## Chain of Responsibility

The Chain of Responsibility example builds an explicit linked processing chain.

A `Chain` object wires together:

```text
NegativeProcessor
      ↓
ZeroProcessor
      ↓
PositiveProcessor
```

Each processor receives a `Number` request.

A processor handles the request when its condition matches; otherwise it delegates to the next processor through the abstract `Processor` base class.

The demonstration sends positive, negative, and zero values through the same entry point.

This is concrete evidence of:

- handler chaining;
- request delegation;
- polymorphic processing;
- responsibility transfer without the caller selecting the final handler directly.

## Mediator

The Mediator example models a simplified air-traffic-control interaction.

The main participants are:

- `ATCMediator`;
- `Flight`;
- `Runway`;
- `IATCMediator`;
- `Command`.

The flight and runway do not coordinate by directly owning each other's behavior.

They communicate landing state through the mediator abstraction.

The mediator registers the active flight and runway and stores whether landing is permitted.

This demonstrates centralized coordination between peer objects and reduces direct coupling between the collaborating domain classes.

## Memento

The Memento example separates current state from saved snapshots.

The main roles are:

- `Originator` — owns mutable state;
- `Memento` — stores a state snapshot;
- `CareTaker` — stores multiple mementos.

The program moves through several state values, saves selected points, and restores earlier snapshots later.

The example therefore demonstrates:

- state capture;
- state history;
- restoration without exposing restoration mechanics to the caretaker;
- separation between the object being restored and storage of its snapshots.

## Observer

The Observer example uses one `Subject` and three observer implementations:

- `BinaryObserver`;
- `OctalObserver`;
- `HexaObserver`.

Observers attach themselves to the subject.

When `Subject.setState()` changes the integer state, `notifyAllObservers()` invokes every registered observer's `update()` method.

Each observer renders the same state in a different numeric representation.

This makes the one-to-many notification relationship directly visible.

It also introduces a small collection-backed subscription list through `ArrayList<Observer>`.

## State

The State example defines a `State` interface with `doAction(Context)`.

Concrete states include:

- `StartState`;
- `StopState`.

Invoking a state action installs that object into the `Context`.

Subsequent behavior can inspect the current state polymorphically.

The example therefore represents system behavior as explicit state objects rather than only conditionals or primitive flags.

## Strategy

The Strategy example defines a `Strategy` interface around an arithmetic operation.

Concrete strategies include:

- addition;
- subtraction;
- multiplication.

`Context` receives a `Strategy` through construction and delegates execution to the selected implementation.

The caller can replace the algorithm by constructing the context with a different strategy while keeping the same execution interface.

This demonstrates runtime algorithm interchange through composition and polymorphism.

## Template Method

The Template Method example defines an abstract `Game` class.

Its final `play()` method fixes the execution order:

```text
initialize()
    ↓
startPlay()
    ↓
endPlay()
```

`Cricket` and `Football` implement the variable steps.

The overall algorithm remains fixed by the base class while subclasses customize the concrete stages.

This is direct evidence of template-method control inversion through inheritance.

## Build Artifacts

The repository contains compiled `.class` files and Maven compiler-status output under multiple `target` directories.

These artifacts show that the examples were compiled rather than existing only as unexecuted source sketches.

The build outputs also expose the resulting class decomposition for examples such as Chain of Responsibility and Mediator.

## Engineering Practices

### Pattern Isolation

Each behavioral pattern is placed in a separate project boundary.

This makes each concept independently inspectable and runnable.

### Interface-Driven Design

Several examples use interfaces to define behavioral contracts:

- `IATCMediator`;
- `Command`;
- `State`;
- `Strategy`.

### Abstract Base Classes

Chain of Responsibility and Template Method use abstract base classes to provide shared control behavior while leaving part of execution to concrete subclasses.

### Composition and Delegation

Mediator, Observer, State, Strategy, and Chain of Responsibility all rely on object references and delegation rather than large monolithic procedures.

### Explicit Runtime State

Memento and State make mutable state a first-class design concern, but solve different problems:

- Memento preserves and restores snapshots;
- State changes behavior by changing the active state object.

## Scale and Complexity

### Repository Scale

The repository contains eight small Maven project directories.

Seven contain positively evidenced behavioral-pattern implementations.

### Conceptual Scale

The important scale is conceptual breadth rather than application size.

The repository exercises several distinct ways objects can collaborate at runtime:

- chains;
- centralized coordination;
- snapshots;
- subscriptions;
- state objects;
- interchangeable algorithms;
- inherited algorithm skeletons.

## Skills Demonstrated

### Java

- **Java — strong evidence.**
- **Interfaces — strong evidence.**
- **Abstract classes — strong evidence.**
- **Inheritance — strong evidence.**
- **Composition — strong evidence.**
- **Polymorphism — strong evidence.**
- **Collections — strong evidence through observer and memento storage.**

### Behavioral Design Patterns

- **Chain of Responsibility — strong implementation evidence.**
- **Mediator — strong implementation evidence.**
- **Memento — strong implementation evidence.**
- **Observer — strong implementation evidence.**
- **State — strong implementation evidence.**
- **Strategy — strong implementation evidence.**
- **Template Method — strong implementation evidence.**

### Build Workflow

- **Maven project structure — strong evidence.**
- **Compiled Java artifacts — strong evidence.**

## Capability Developed

This repository develops the ability to recognize recurring collaboration problems and represent them with explicit object relationships.

The examples make several forms of behavioral decoupling concrete:

- a sender can hand a request to a chain instead of selecting a handler;
- peer objects can communicate through a mediator;
- state can be snapshotted and restored;
- subscribers can react to state changes;
- behavior can move into state objects;
- algorithms can be injected as strategies;
- a superclass can define an algorithm skeleton while subclasses fill in steps.

The practical learning value is therefore not only memorizing pattern names, but seeing how interfaces, inheritance, composition, and delegation produce different runtime collaboration structures.

## Portfolio Evolution Context

This repository continues the explicit design-pattern study already visible in the Creational and Structural repositories.

Within the processed corpus, it is the earliest observed repository centered specifically on behavioral GoF-style patterns.

It adds first observed implementations of:

- Chain of Responsibility;
- Mediator;
- Memento;
- Observer;
- State pattern;
- Strategy;
- Template Method.

## Historical Significance

Together with the adjacent Creational and Structural pattern repositories, this project records a concentrated object-oriented design-learning phase in early 2023.

The sequence broadens Java usage from application/problem implementations into explicit study of reusable software-design vocabulary.

## Overall Repository Narrative

`Behavioral-Design-Patterns` is a personally attributable Java learning repository made of independent Maven examples for seven implemented behavioral patterns.

The examples explore request delegation, mediated coordination, state snapshots, one-to-many notifications, explicit state objects, interchangeable algorithms, and template-controlled execution. Compiled Maven outputs provide direct evidence that the examples were built. A Visitor-named project exists only as a placeholder and is deliberately excluded from the implemented-pattern evidence.

The repository's strongest corpus value is its explicit, code-backed study of runtime object collaboration and behavioral decoupling.

# Project Tags

## Project Type

- `design-pattern-learning`
- `educational-project`
- `behavioral-pattern-exercises`

## Collaboration and Authorship

- `individual-project`

## Languages

- `java`

## Software Engineering Practices

- `object-oriented-programming`
- `interfaces`
- `abstract-classes`
- `inheritance`
- `composition`
- `polymorphism`
- `delegation`
- `maven`
- `build-artifact-evidence`

## Design Patterns

- `behavioral-design-patterns`
- `chain-of-responsibility`
- `mediator-pattern`
- `memento-pattern`
- `observer-pattern`
- `state-pattern`
- `strategy-pattern`
- `template-method-pattern`

## Portfolio Significance

- `earliest-observed-behavioral-design-patterns`
- `earliest-observed-chain-of-responsibility`
- `earliest-observed-mediator-pattern`
- `earliest-observed-memento-pattern`
- `earliest-observed-observer-pattern`
- `earliest-observed-state-pattern`
- `earliest-observed-strategy-pattern`
- `earliest-observed-template-method-pattern`
