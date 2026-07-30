# ARCHITECTURE

This document describes the intended architecture of `nx-bun`.

## Overview

`nx-bun` is designed as a modern Nx plugin that integrates Bun into Nx workspaces using supported Nx extension points.

The architecture should prioritize:

* compatibility with modern Nx versions
* low coupling to Nx internals
* thin, explicit integration with Bun CLI behavior
* clear separation between public plugin surface and internal utilities

## Architectural goals

* provide Bun-focused executors and generators
* keep command execution logic reusable and testable
* make configuration explicit and understandable
* support incremental growth without forcing early complexity

## Architectural non-goals

* replacing Nx task orchestration
* recreating deprecated custom task runner behavior
* embedding Nx forks or patches
* over-abstracting Bun behavior before real needs emerge

## Primary building blocks

### 1. Executors

Executors are the main runtime integration point.

Planned executors:

* `run`
* `build`
* `dev`
* `test`

Responsibilities:

* validate and normalize options
* construct Bun commands
* spawn Bun processes
* map process results into Nx executor results
* declare or document expected outputs where relevant

### 2. Generators

Generators provide workspace and project scaffolding.

Planned generators:

* `init`
* `app`
* `lib`

Responsibilities:

* create or update project configuration
* add sensible Bun defaults
* avoid unnecessary file generation
* keep generated projects easy to understand

### 3. Internal utilities

Internal utilities should support reuse without leaking unnecessary complexity into the public API.

Examples:

* Bun binary resolution
* command argument builders
* process spawning helpers
* workspace path helpers
* option normalization helpers

### 4. Migrations

Migrations are optional initially, but the architecture should leave room for them.

Responsibilities:

* evolve configuration safely between plugin versions
* reduce manual migration burden for users

## Proposed source layout

A likely initial layout:

```text
src/
    executors/
        run/
            executor.ts
            schema.json
        build/
            executor.ts
            schema.json
        dev/
            executor.ts
            schema.json
        test/
            executor.ts
            schema.json
    generators/
        init/
            generator.ts
            schema.json
        app/
            generator.ts
            schema.json
        lib/
            generator.ts
            schema.json
    utils/
        bun-command.ts
        bun-process.ts
        paths.ts
        options.ts
    migrations/
    index.ts
executors.json
generators.json
migrations.json
```

## Layering model

The project should follow a simple layering model.

### Public layer

This includes:

* executor entrypoints
* generator entrypoints
* published schemas
* public package exports

This layer should remain stable and easy to document.

### Internal layer

This includes:

* command construction helpers
* process execution wrappers
* normalization and validation utilities
* shared constants and path helpers

This layer may evolve as implementation improves, but should remain simple and cohesive.

## Executor design approach

## Generic-first strategy

The first executor should likely be `run`.

Why:

* it is the most general building block
* it validates process execution patterns
* it helps define option handling conventions
* other executors can reuse the same lower-level logic

The specialized executors should then either:

* wrap `run` logic internally, or
* share the same command-building utilities

## Command construction

Command construction should be deterministic and easy to inspect.

Preferred behavior:

* build Bun invocations from explicit options
* support passthrough arguments when appropriate
* avoid hidden defaults that materially change user intent

Examples of likely command shapes:

* `bun run <script>`
* `bun test`
* `bun build <entrypoint> --outdir <path>`

## Process execution model

The plugin should execute Bun via spawned child processes.

Important behaviors:

* inherit stdio for interactive and development workflows where appropriate
* return structured success or failure results to Nx
* preserve Bun exit codes
* surface command context clearly on failure

The process layer should be centralized so behavior is consistent across executors.

## Configuration philosophy

Configuration should be explicit, typed, and minimal.

Principles:

* prefer readable options over implicit behavior
* require only what is necessary
* document defaults clearly
* map closely to actual Bun concepts

## Caching and outputs

Nx caching should be supported where it makes sense, but the plugin should not hide caching assumptions.

### Cacheable candidates

* build tasks
* certain test tasks when deterministic and non-watch

### Non-cacheable or long-running candidates

* dev tasks
* watch tasks
* interactive processes

### Output handling

For build tasks, the architecture should encourage explicit outputs such as:

* `dist/apps/<name>`
* `dist/libs/<name>`

The plugin may provide defaults, but users should be able to override them.

## Error handling

Error handling should be practical and direct.

Executors should:

* fail with clear messages when Bun cannot be found
* fail clearly when required options are missing
* preserve Bun command errors instead of masking them
* include enough context to reproduce command invocation

## Testing strategy

Testing should happen at multiple levels.

### Unit tests

Use unit tests for:

* option normalization
* command construction
* error mapping

### Integration tests

Use integration tests for:

* executor behavior in a sample Nx workspace
* generated project configuration
* end-to-end Bun command invocation patterns where practical

## Extensibility rules

New features should be added only if they satisfy most of the following:

* they solve a clear user problem
* they fit supported Nx extension points
* they do not require internal Nx patching
* they can be explained simply in documentation
* they do not significantly increase maintenance burden

## Expected evolution

### Early stage

* thin CLI wrappers
* minimal generators
* explicit configuration

### Mid stage

* stronger defaults
* improved templates
* better compatibility coverage

### Later stage

* targeted quality-of-life improvements
* optional advanced integrations if justified by stable Nx APIs

## Decision guideline

When faced with an architectural choice, prefer the option that:

1. uses public Nx APIs
2. keeps Bun execution behavior obvious
3. reduces long-term maintenance risk
4. is easier to test
5. is easier to document
