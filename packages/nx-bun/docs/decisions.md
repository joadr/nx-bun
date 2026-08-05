# Decisions

This document records important architectural and product decisions for `nx-bun`.

## Decision 0001: Build `nx-bun` as a standard Nx plugin

### Status

Accepted

### Decision

`nx-bun` will be implemented as a standard Nx plugin package using supported Nx extension points.

### Rationale

Recent Nx versions no longer center customization around custom task runners. A plugin-based approach aligns with current Nx architecture and is more likely to remain maintainable across releases.

### Alternatives considered

- Revive older custom runner patterns
- Patch Nx internals
- Build on a fork of Nx

### Consequences

- the project will rely on executors, generators, migrations, and only optional hooks when justified
- deep task orchestration customization is out of scope
- some older Bun integration patterns will not be preserved

### Related docs

- [Architecture](architecture.md)

## Decision 0002: Thin-wrapper-first implementation strategy

### Status

Accepted

### Decision

The initial implementation will focus on thin wrappers around Bun CLI commands or Bun APIs instead of creating deep abstractions.

### Rationale

A thin-wrapper approach keeps the plugin simple, understandable, and more resilient to changes in both Bun and Nx.

### Alternatives considered

- build a highly opinionated Bun framework layer
- infer too much behavior automatically from project structure
- add advanced Bun-specific abstractions in v1

### Consequences

- early executors map closely to Bun behavior
- documentation stays straightforward
- advanced features can be deferred until real demand appears

### Related docs

- [build](executors/build.md)
- [run](executors/run.md)
- [test](executors/test.md)

## Decision 0003: Start with executors before generators

### Status

Accepted

### Decision

Executor implementation came before generator implementation.

### Rationale

Executors validate the core technical value of the plugin: running Bun workflows through Nx. Generators are useful, but they should be built after the runtime behavior is proven.

### Alternatives considered

- scaffold generators first for faster demos
- build app templates before command execution is stable

### Consequences

- the first meaningful implementation milestone is a working `run` executor
- generators will be designed around proven executor behavior

### Related docs

- [run](executors/run.md)
- [Architecture](architecture.md)

## Decision 0004: `run` is the foundational executor

### Status

Accepted

### Decision

The first executor is a generic `run` executor.

### Rationale

A generic `run` executor establishes shared logic for:

- Bun binary resolution
- argument passing
- process spawning
- error handling

This creates a stable base for later `build`, `dev`, and `test` executors.

### Alternatives considered

- start with `build`
- start with `dev`
- build each executor separately without a shared base

### Consequences

- early design prioritizes reusable process execution utilities
- specialized executors reuse shared execution logic rather than duplicate it

### Related docs

- [run](executors/run.md)
- [Architecture](architecture.md)

## Decision 0005: Do not target deprecated runner behavior

### Status

Accepted

### Decision

The project will not attempt to recreate or emulate deprecated Nx custom task runner behavior.

### Rationale

That approach is misaligned with current Nx direction and would increase maintenance risk significantly.

### Alternatives considered

- compatibility shims for older runner interfaces
- hidden internal integration with deprecated mechanisms

### Consequences

- some legacy use cases may not be supported
- the plugin remains aligned with public Nx extension points
- maintenance burden is reduced

### Related docs

- [Architecture](architecture.md)

## Decision 0006: Remote cache concerns are out of scope

### Status

Accepted

### Decision

`nx-bun` will not attempt to solve remote cache policy or ecosystem debates.

### Rationale

The purpose of this project is Bun integration for modern Nx, not replacing or competing with remote cache solutions.

### Alternatives considered

- bundle remote cache helpers
- position the plugin as part of a broader Nx alternative strategy

### Consequences

- scope remains focused
- the plugin can serve users who simply want Bun support in Nx
- unrelated product debates do not define the project roadmap

### Related docs

- [Roadmap](roadmap.md)

## Decision 0007: Hooks are optional, not foundational

### Status

Accepted

### Decision

Hooks will not be part of the initial architecture unless a concrete need emerges that executors and generators cannot address cleanly.

### Rationale

There is no need to introduce extra complexity before verifying whether core plugin features already solve the target use cases.

### Alternatives considered

- design around hooks from the start
- build speculative lifecycle integrations early

### Consequences

- the v1 implementation remains simpler
- hook usage must be justified by a specific problem

### Related docs

- [Architecture](architecture.md)

## Decision 0008: Prefer explicit configuration over hidden inference

### Status

Accepted

### Decision

The plugin will prefer explicit options and understandable defaults rather than heavy automatic inference.

### Rationale

Explicit configuration is easier to debug, document, and maintain, especially in a fast-moving ecosystem.

### Alternatives considered

- aggressive inference based on project structure
- silent defaults that change behavior substantially

### Consequences

- target configuration stays readable
- users may write slightly more configuration in exchange for clarity
- debugging becomes simpler

### Related docs

- [build](executors/build.md)
- [run](executors/run.md)
- [test](executors/test.md)

## Decision 0009: Build executor uses the Bun CLI

### Status

Accepted

### Decision

The Bun build executor will use the Bun CLI as its primary implementation.

### Rationale

The CLI path is predictable, matches Bun's own command-line behavior, and keeps the executor's output path semantics aligned with Nx.

### Alternatives considered

- CLI-only builds
- API-only builds
- hidden automatic switching with no escape hatch

### Consequences

- the build executor stays Bun-native
- the implementation stays simple and deterministic

### Related docs

- [build](executors/build.md)
- [Architecture](architecture.md)

## Decision 0010: Keep `buildTarget` as the build-first signal

### Status

Accepted

### Decision

`run` uses `buildTarget` to decide when to run a build task before launching Bun output.

### Rationale

`buildTarget` matches the Nx Node executor model and keeps launch targets explicit.

### Alternatives considered

- infer build tasks implicitly from outputs alone
- add separate pre-run lifecycle hooks

### Consequences

- build-first launch flows stay explicit
- `serve` can stay simple and readable
- the executor can still infer the primary built file from the build target outputs

### Related docs

- [run](executors/run.md)
- [build](executors/build.md)
