# JavaLibrary

## Repository Identity

- Repository: 028 / 134
- Name: `JavaLibrary`
- Repository Start Date: 2024-04-30
- Latest Meaningful Update Date: 2024-05-01
- Primary Language: Java
- Primary Type: Serialization / object-mapping prototype
- Technical Field: Java reflection, XML parsing, JSON parsing
- Collaboration Type: Individual Project

## Collaboration and Authorship Context

The visible repository history consists of owner-attributed uploads and cleanup activity.

The principal Java implementation is stored in `Doct2object.java`.

The code directly demonstrates repository-specific reflection and object-mapping logic.

## What This Project Is

`JavaLibrary` is a small Java experiment that maps structured document data into ordinary Java objects.

The project demonstrates two input formats:

- XML,
- JSON.

Instead of hard-coding every field assignment, the implementation uses Java reflection to inspect a target class at runtime.

Field names become the binding contract between the serialized data and the Java object.

The same generic mapping pattern is demonstrated against two model classes:

- `Employee`,
- `Animal`.

## Project Scope

The repository contains three files:

```text
JavaLibrary/
├── Animal.xml
├── Doct2object.java
└── lib.xml
```

The Java source performs both mapping demonstrations.

The XML files supply small source documents used by the parser.

## Architecture and Data Flow

The implementation can be summarized as:

```text
XML file
   ↓
DocumentBuilder / DOM
   ↓
Element
   ↓
reflection over target class fields
   ↓
typed Java object
```

and:

```text
JSON string
   ↓
JSONObject
   ↓
reflection over target class fields
   ↓
typed Java object
```

The architectural idea is generic runtime data binding.

The mapper receives a `Class<T>` rather than being implemented separately for every model class.

## XML Parsing

The XML path begins with Java’s standard DOM stack:

- `DocumentBuilderFactory`,
- `DocumentBuilder`,
- `Document`,
- `NodeList`,
- `Element`.

The program parses `lib.xml` and `Animal.xml`.

It selects top-level elements with `getElementsByTagName`.

Those elements are then passed to the generic `mapXMLToObject` method.

## Generic XML-to-Object Mapping

`mapXMLToObject(Element element, Class<T> clazz)` performs runtime construction and field assignment.

The method:

1. constructs a new instance with `clazz.getDeclaredConstructor().newInstance()`;
2. retrieves declared fields through `clazz.getDeclaredFields()`;
3. uses each field name as an XML element name;
4. obtains text content from the matching node;
5. enables reflective field access with `setAccessible(true)`;
6. converts and assigns supported values.

The demonstrated conversion logic handles:

- `String`,
- `Integer`.

This is a compact custom data-binding mechanism.

It demonstrates the principle behind larger serialization frameworks: mapping external field names into object state using runtime type information.

## JSON Parsing

The JSON path uses `org.json.JSONObject`.

A JSON string containing `name` and `id` is parsed into a `JSONObject`.

The generic `mapJSONToObject` method again:

- instantiates the requested target class,
- enumerates declared fields,
- checks whether JSON contains a matching field name,
- obtains the value,
- converts it,
- assigns it reflectively.

This creates a parallel binding workflow between XML and JSON.

## Java Reflection

Reflection is the central technical mechanism in this repository.

The code materially uses:

- `Class<T>`,
- `getDeclaredConstructor`,
- `newInstance`,
- `getDeclaredFields`,
- `Field`,
- `setAccessible`,
- `Field.set`.

That allows the mapper implementation to work against multiple target model types without writing separate assignment code for each type.

## Java Generics

Both mapping functions are generic:

```text
<T> T mapXMLToObject(...)
<T> T mapJSONToObject(...)
```

This preserves the target type at the method boundary.

Callers receive an `Employee` or `Animal` rather than a generic `Object`.

The use of `Class<T>` also connects generic typing to runtime reflection.

## Model Classes

### Employee

`Employee` contains:

- `name`,
- `id`,
- getters and setters.

### Animal

`Animal` contains:

- `kind`,
- `sound`,
- getters and setters.

These two distinct model classes demonstrate that the mapper is not coupled to one schema.

## Verification Through Executable Demonstration

The `main` method exercises both conversion paths.

It:

- parses an employee from XML,
- parses an animal from XML,
- prints mapped field values,
- parses an employee from JSON,
- prints the resulting `name` and `id`.

This is an executable behavior demonstration of the mapping mechanism.

## Engineering Practices

### Reusable Generic Functions

Mapping logic is centralized into reusable methods instead of duplicated per model.

### Separation of Input Parsing and Model Types

Structured-document parsing is separated conceptually from the domain classes that receive the data.

### Runtime Type Inspection

The mapper derives behavior from class metadata at runtime.

### Explicit Type Conversion

The code checks Java field types before assigning parsed values.

## Implementation Scale

The source is small, but conceptually dense.

In one file it combines:

- DOM parsing,
- JSON parsing,
- reflection,
- generics,
- dynamic instance creation,
- type-aware assignment,
- multiple model classes.

The repository therefore has more architectural significance than its raw file count suggests.

## Skills Demonstrated

### Java

- object-oriented programming,
- generics,
- reflection,
- exceptions,
- file handling,
- class construction,
- encapsulated model classes.

### Structured Data

- XML parsing,
- DOM traversal,
- JSON parsing,
- field-name-based data binding.

### Runtime Metaprogramming

- class introspection,
- field introspection,
- dynamic object construction,
- reflective assignment.

### Software Design

- reusable mapping abstraction,
- schema-to-object mapping,
- common processing path across multiple target types.

## Capability Developed

This repository demonstrates movement from ordinary application-level Java toward language/runtime mechanisms.

Rather than only using classes and interfaces, it uses Java’s metadata model to write behavior that adapts to arbitrary target classes.

That is relevant to later work involving frameworks, serialization, dependency injection, ORMs, and reflective infrastructure because those systems use related runtime concepts.

## Historical Portfolio Significance

This is the earliest processed repository centered specifically on Java reflection.

It is also the earliest processed repository that implements custom XML-to-object and JSON-to-object data binding through reflection.

The project therefore adds a new Java capability layer beyond the earlier design-pattern exercises.

## Overall Project Narrative

`JavaLibrary` is a compact experiment in building a lightweight serialization mapper.

Its significance is not the amount of code.

It is the shift in abstraction level.

The implementation stops treating XML and JSON parsing as one-off field extraction and instead asks a reusable question:

> Given a target Java class, can external fields be mapped into that class automatically?

The answer is implemented using generics, reflection, runtime construction and typed assignment.

That makes the repository a clear early example of framework-like thinking inside the portfolio.

# Project Tags

- `java`
- `individual-project`
- `developer-tooling`
- `xml-processing`
- `xml-parsing`
- `json-parsing`
- `dom-parsing`
- `java-reflection`
- `reflection`
- `java-generics`
- `runtime-instantiation`
- `field-introspection`
- `reflective-field-assignment`
- `object-mapping`
- `xml-object-mapping`
- `json-object-mapping`
- `data-binding-prototype`
- `manual-execution-demo`
- `object-oriented-programming`
- `earliest-observed-java-reflection`
- `earliest-observed-xml-object-mapping`
- `earliest-observed-json-object-mapping`
