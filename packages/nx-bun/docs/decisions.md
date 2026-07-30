# DECISIONS

This document records important architectural and product decisions for `nx-bun`.

## Purpose

The goal of this file is to capture decisions that are likely to matter later, especially when revisiting early assumptions or evaluating new proposals.

Each decision should document:

* what was decided
* why it was decided
* what alternatives were considered
* what consequences follow from the decision

## Decision 0001: Build `nx-bun` as a standard Nx plugin

### Status

Accepted

### Decision

`nx-bun` will be implemented as a standard Nx plugin package using supported Nx extension points.

### Rationale

Recent Nx versions no longer center customization around custom task runners. A plugin-based approach aligns with current Nx architecture and is more likely to remain maintainable across releases.

### Alternatives considered

* Revive older custom runner patterns
* Patch Nx internals
* Build on a fork of Nx

### Consequences

* the project will rely on executors, generators, migrations, and only optional hooks when justified
* deep task orchestration customization is out of scope
* some older Bun integration patterns will not be preserved

## Decision 0002: Thin-wrapper-first implementation strategy

### Status

Accepted

### Decision

The initial implementation will focus on thin wrappers around Bun CLI commands instead of creating deep abstractions.

### Rationale

A thin-wrapper approach keeps the plugin simple, understandable, and more resilient to changes in both Bun and Nx.

### Alternatives considered

* build a highly opinionated Bun framework layer
* infer too much behavior automatically from project structure
* add advanced Bun-specific abstractions in v1

### Consequences

* early executors will map closely to Bun commands
* documentation will remain straightforward
* advanced features may be deferred until real demand appears

## Decision 0003: Start with executors before generators

### Status

Accepted

### Decision

Executor implementation will come before generator implementation.

### Rationale

Executors validate the core technical value of the plugin: running Bun workflows through Nx. Generators are useful, but they should be built after the runtime behavior is proven.

### Alternatives considered

* scaffold generators first for faster demos
* build app templates before command execution is stable

### Consequences

* the first meaningful implementation milestone is a working `run` executor
* generators will be designed around proven executor behavior

## Decision 0004: `run` is the foundational executor

### Status

Accepted

### Decision

The first executor to implement will be a generic `run` executor.

### Rationale

A generic `run` executor establishes shared logic for:

* Bun binary resolution
* argument passing
* process spawning
* error handling

This creates a stable base for later `build`, `dev`, and `test` executors.

### Alternatives considered

* start with `build`
* start with `dev`
* build each executor separately without a shared base

### Consequences

* early design should prioritize reusable process execution utilities
* specialized executors should reuse shared execution logic rather than duplicate it

## Decision 0005: Do not target deprecated runner behavior

### Status

Accepted

### Decision

The project will not attempt to recreate or emulate deprecated Nx custom task runner behavior.

### Rationale

That approach is misaligned with current Nx direction and would increase maintenance risk significantly.

### Alternatives considered

* compatibility shims for older runner interfaces
* hidden internal integration with deprecated mechanisms

### Consequences

* some legacy use cases may not be supported
* the plugin remains aligned with public Nx extension points
* maintenance burden is reduced

## Decision 0006: Remote cache concerns are out of scope

### Status

Accepted

### Decision

`nx-bun` will not attempt to solve remote cache policy or ecosystem debates.

### Rationale

The purpose of this project is Bun integration for modern Nx, not replacing or competing with remote cache solutions.

### Alternatives considered

* bundle remote cache helpers
* position the plugin as part of a broader Nx alternative strategy

### Consequences

* scope remains focused
* the plugin can serve users who simply want Bun support in Nx
* unrelated product debates do not define the project roadmap

## Decision 0007: Hooks are optional, not foundational

### Status

Accepted

### Decision

Hooks will not be part of the initial architecture unless a concrete need emerges that executors and generators cannot address cleanly.

### Rationale

There is no need to introduce extra complexity before verifying whether core plugin features already solve the target use cases.

### Alternatives considered

* design around hooks from the start
* build speculative lifecycle integrations early

### Consequences

* the v1 implementation remains simpler
* hook usage must be justified by a specific problem

## Decision 0008: Prefer explicit configuration over hidden inference

### Status

Accepted

### Decision

The plugin will prefer explicit options and understandable defaults rather than heavy automatic inference.

### Rationale

Explicit configuration is easier to debug, document, and maintain, especially in a fast-moving ecosystem.

### Alternatives considered

* aggressive inference based on project structure
* silent defaults that change behavior substantially

### Consequences

* target configuration stays readable
* users may write slightly more configuration in exchange for clarity
* debugging becomes simpler

## Decision template

Use this template for future entries.

## Decision XXXX: Title

### Status

Proposed | Accepted | Superseded | Rejected

### Decision

What was decided.

### Rationale

Why this decision was made.

### Alternatives considered

* Alternative A
* Alternative B

### Consequences

What this decision implies for the project.
