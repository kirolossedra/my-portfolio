# Structural-Design-Patterns

## Repository Identity

- Repository: 011 / 134
- Name: `Structural-Design-Patterns`
- Repository start date: 2023-02-18
- Latest meaningful update date: 2023-03-03
- Primary type: Design-pattern learning repository
- Technical field: Object-oriented software design
- Project context: Personal educational implementation
- Collaboration type: `individual-project`
- Primary implementation language: Java
- Build tooling: Maven

## Collaboration and Authorship Context

The visible implementation commits are attributed to the repository owner. Java source files also carry the author marker `sedra`, supporting personal attribution of the pattern exercises.

Each pattern is stored as its own Maven project. Checked-in `target/classes` output is treated as build evidence, while the Java under `src/main/java` is the relevant implementation evidence.

## Evidence Basis

The analysis is grounded in the repository tree, seven separate Maven subprojects, their Java implementations, generated Maven class output, and owner-attributed commit history through March 3, 2023.

The implemented structural patterns are:

- Adapter;
- Bridge;
- Composite;
- Decorator;
- Facade;
- Flyweight;
- Proxy.

## What This Project Is

`Structural-Design-Patterns` is a Java learning repository devoted to the structural family of Gang-of-Four design patterns.

It follows the immediately preceding `Creational-Design-Patterns` repository chronologically, but changes the architectural question being studied. The earlier repository focuses on how objects are created. This repository focuses on how objects and abstractions can be connected, wrapped, grouped, shared, or mediated while preserving stable interfaces.

Each pattern is isolated in its own small Maven project so the collaborating classes and interfaces are visible directly.

## Repository Structure

```text
Structural-Design-Patterns/
├── AdapterPattern/
│   ├── pom.xml
│   ├── src/main/java/...
│   └── target/classes/...
├── BridgePattern/
├── CompositePattern/
├── DecoratorPattern/
├── FacadePattern/
├── FlyweightPattern/
└── ProxyPattern/
```

The repeated Maven structure gives every pattern a separately compilable example.

## Technical Stack

### Java

Java is used for:

- interfaces;
- abstract classes;
- inheritance;
- composition;
- delegation;
- collections;
- polymorphic dispatch;
- exception-based access control demonstrations.

### Maven

Each pattern has its own `pom.xml` and Maven compiler output under `target`.

This provides direct evidence of repeated Maven project organization and builds across multiple examples.

### Java Collections

The examples use structures such as:

- `ArrayList` in Composite;
- `HashMap` in Flyweight;
- `List<String>` in Proxy.

Collections are used to support the structural relationships being demonstrated rather than as incidental imports.

## Adapter Pattern

The Adapter example models a `RoundHole` that accepts `RoundPeg` objects.

A `SquarePeg` has an incompatible width-based interface.

`SquarePegAdapter` extends the expected `RoundPeg` shape and wraps a `SquarePeg`.

Its `getRadius()` converts square width into an effective radius using:

```text
width × sqrt(2) / 2
```

This lets the existing `RoundHole.fits()` operation consume a square peg through a compatible interface.

### Engineering concept represented

The example demonstrates interface adaptation through wrapping and conversion rather than changing the original consuming class.

## Bridge Pattern

The Bridge example separates two dimensions:

### Abstraction hierarchy

- `RemoteControl`;
- `AdvancedRemoteControl`.

### Implementation hierarchy

- `Device`;
- `Tv`;
- `Radio`.

`RemoteControl` delegates power, volume, and channel operations to a `Device`.

`AdvancedRemoteControl` adds a mute operation while remaining connected to the device abstraction.

The same control abstraction can therefore operate over different device implementations.

### Engineering concept represented

The example demonstrates composition as a way to vary abstraction and implementation independently.

## Composite Pattern

The Composite example defines a common `Graphic` interface:

- `move(x, y)`;
- `draw()`.

Leaf objects include:

- `Dot`;
- `Circle`.

`CompoundGraphic` also implements `Graphic`, but contains an `ArrayList<Graphic>` of children.

Its `move()` and `draw()` methods iterate across children and delegate the same operation recursively.

`ImageEditor` constructs a top-level compound and can group selected compounds into another compound.

### Engineering concept represented

Individual objects and object groups share one interface, allowing client code to treat them uniformly.

## Decorator Pattern

The Decorator example defines:

- `Shape`;
- `Circle`;
- `Rectangle`;
- abstract `ShapeDecorator`;
- `RedShapeDecorator`.

`ShapeDecorator` stores a wrapped `Shape`.

`RedShapeDecorator.draw()` first delegates to the wrapped object's `draw()` behavior and then adds border behavior.

The main program demonstrates:

- a normal circle;
- a decorated circle;
- a decorated rectangle.

### Engineering concept represented

The example adds behavior through object wrapping while preserving the `Shape` contract.

## Facade Pattern

The Facade example defines several shape implementations:

- `Circle`;
- `Rectangle`;
- `Square`.

`ShapeMaker` owns these concrete objects and exposes a simplified surface:

- `drawCircle()`;
- `drawRectangle()`;
- `drawSquare()`.

Client code interacts with `ShapeMaker` rather than constructing and coordinating each concrete shape directly.

### Engineering concept represented

The facade centralizes access to a small subsystem behind a simpler client-facing interface.

## Flyweight Pattern

The Flyweight example uses a static `HashMap` in `ShapeFactory`.

Circles are keyed by color.

When `getCircle(color)` is called:

1. the factory checks the cache;
2. an existing circle is returned when present;
3. a new intrinsic color-specific circle is created and stored when required.

The main loop requests twenty circles while supplying varying external coordinates and radius values.

### Engineering concept represented

The example separates shared intrinsic state, represented by color-keyed circle instances, from changing extrinsic drawing state such as position.

It demonstrates object reuse through a factory-managed cache.

## Proxy Pattern

The Proxy example defines a shared `Internet` interface.

`RealInternet` performs the connection behavior.

`ProxyInternet` also implements `Internet`, owns a `RealInternet`, and checks a list of banned hostnames before delegation.

The main program attempts a permitted connection and a blocked connection.

### Engineering concept represented

The proxy controls access to another implementation while preserving the same client-facing contract.

## Architecture and System Shape

At repository level, the architecture is intentionally repetitive:

```text
Pattern-specific client
        ↓
Stable interface / abstraction
        ↓
Pattern-specific structural relationship
        ↓
Concrete implementation(s)
```

What changes from project to project is the relationship:

```text
Adapter   → translate incompatible interface
Bridge    → separate abstraction from implementation
Composite → unify leaf and group treatment
Decorator → add behavior through wrapping
Facade    → simplify subsystem access
Flyweight → share reusable intrinsic objects
Proxy     → mediate access to a real object
```

This makes the repository useful as a comparative design-pattern corpus rather than seven unrelated Java examples.

## Verification

### Maven Build Artifacts

Compiled class files and Maven compiler-status files are present across the pattern subprojects.

This provides concrete build evidence for the examples.

### Runtime Demonstrations

Several `main()` methods explicitly exercise the relationships:

- Adapter prints fit results for adapted square pegs;
- Bridge toggles TV power and mutes a radio;
- Decorator compares ordinary and decorated shapes;
- Facade invokes the simplified shape interface;
- Flyweight repeatedly requests cached color-based circles;
- Proxy exercises allowed and denied connections.

These execution paths make the examples demonstrable rather than purely declarative class diagrams.

## Engineering Practices

### Pattern Isolation

Each structural pattern has its own project boundary.

### Interface-Oriented Design

Interfaces such as `Device`, `Graphic`, `Shape`, and `Internet` define stable contracts around variation.

### Composition and Delegation

Composition is central to multiple examples:

- Bridge stores a `Device`;
- Composite stores child `Graphic` objects;
- Decorator stores a wrapped `Shape`;
- Proxy stores a real `Internet` implementation.

### Controlled Object Sharing

Flyweight uses a map-backed factory to reuse objects keyed by intrinsic state.

### Encapsulation of Subsystem Access

Facade moves concrete subsystem object handling behind a dedicated access layer.

## Scale and Complexity

### Implementation Scale

The source is made of seven focused Java/Maven examples.

### Conceptual Scale

The repository covers the complete GoF structural-pattern family, which makes conceptual breadth the main scale dimension.

### Comparative Architectural Scale

The repository is especially useful because similar Java mechanisms—interfaces, inheritance, composition, delegation, and collections—are used to solve different architectural relationship problems.

## Skills Demonstrated

### Java

- **Java — strong evidence.**
- **Interfaces — strong evidence.**
- **Abstract classes — strong evidence.**
- **Inheritance — strong evidence.**
- **Polymorphism — strong evidence.**
- **Composition — strong evidence.**
- **Delegation — strong evidence.**
- **Java collections — moderate-to-strong evidence.**

### Design Patterns

- **Adapter — strong implemented evidence.**
- **Bridge — strong implemented evidence.**
- **Composite — strong implemented evidence.**
- **Decorator — strong implemented evidence.**
- **Facade — strong implemented evidence.**
- **Flyweight — strong implemented evidence.**
- **Proxy — strong implemented evidence.**

### Build Tooling

- **Maven — strong recurring evidence across seven subprojects.**

## Capability Developed

This repository extends the explicit design-pattern learning phase begun in repository 010.

The capability moves from object-creation structures toward reasoning about object relationships and boundaries.

The examples repeatedly ask a systems-design question:

> How can existing components collaborate while limiting coupling between the client and structural details?

The answers vary across adaptation, composition, delegation, wrapping, caching, simplification, and controlled access.

## Portfolio Evolution Context

Relative to repository 010:

- Java and Maven recur immediately;
- design patterns remain an explicit learning focus;
- the pattern scope expands from creational to structural relationships;
- composition and delegation become much more central.

This is the earliest observed repository in the processed corpus so far containing implemented:

- Adapter pattern;
- Bridge pattern;
- Composite pattern;
- Decorator pattern;
- Facade pattern;
- Flyweight pattern;
- Proxy pattern;
- a complete seven-pattern structural design-pattern study set.

## Historical Significance

`Structural-Design-Patterns` establishes a short but concentrated architecture-study sequence in February–March 2023.

Together with the preceding creational-pattern repository, it shows Java being used not merely as a programming language but as a vehicle for deliberately studying reusable software-design structures.

## Overall Repository Narrative

`Structural-Design-Patterns` is a seven-project Java/Maven study of structural software design.

The repository implements the full GoF structural family through concrete examples: square pegs are adapted to round-hole interfaces, remote controls bridge to multiple device implementations, graphics are grouped recursively through Composite, decorators add behavior around stable interfaces, facades simplify subsystem access, flyweights reuse color-keyed objects, and proxies mediate access to a real service.

Its portfolio value is architectural vocabulary backed by implementation. It demonstrates direct work with interfaces, composition, delegation, polymorphism, caching, and access mediation across several deliberately contrasted designs.

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
- `inheritance`
- `polymorphism`
- `composition`
- `delegation`
- `adapter-pattern`
- `bridge-pattern`
- `composite-pattern`
- `decorator-pattern`
- `facade-pattern`
- `flyweight-pattern`
- `proxy-pattern`
- `structural-design-patterns`
- `object-wrapping`
- `interface-adaptation`
- `object-caching`
- `access-mediation`

## Testing and Verification

- `build-artifact-evidence`
- `manual-execution-demo`

## Portfolio Significance

- `earliest-observed-structural-design-patterns`
- `earliest-observed-adapter-pattern`
- `earliest-observed-bridge-pattern`
- `earliest-observed-composite-pattern`
- `earliest-observed-decorator-pattern`
- `earliest-observed-facade-pattern`
- `earliest-observed-flyweight-pattern`
- `earliest-observed-proxy-pattern`
