# Architecture

This document describes the current structure of `nx-bun`.

## Overview

`nx-bun` is a thin Nx plugin for Bun-based workflows.

It favors:

- supported Nx extension points
- explicit configuration
- Bun-native behavior
- small executors with shared helpers

## Executors

- [build](executors/build.md)
- [run](executors/run.md)
- [test](executors/test.md)

## Package Shape

Current package layout:

```text
src/
  executors/
    run/
      executor.ts
      run-utils.ts
      schema.json
    build/
      executor.ts
      schema.json
    test/
      executor.ts
      schema.json
  index.ts
```

## Execution Model

- `run` launches Bun directly.
- `build` transpiles Bun entry files.
- `test` wraps `bun test`.

## Shared Utilities

Shared helpers stay small and focused.

Examples:

- Bun binary resolution
- option validation
- argument building
- build entry normalization
- working directory resolution
- child-process execution

## Outputs

Build targets should declare directory-based outputs.

That keeps the Nx contract simple while still allowing `run` to infer the built file for `buildTarget` flows.

## Guiding Principles

When choosing behavior, prefer the option that:

1. uses public Nx APIs
2. keeps Bun behavior obvious
3. avoids hidden inference
4. stays easy to test
5. stays easy to document

## Related Docs

- [Docs index](index.md)
- [Decisions](decisions.md)
- [Roadmap](roadmap.md)
