# ARCHITECTURE

This document describes the current architecture of `nx-bun`.

## Overview

`nx-bun` is a thin Nx plugin for Bun-based workflows.

It favors:

* supported Nx extension points
* explicit configuration
* Bun-native behavior
* small executors with shared helpers

## Package Shape

Current executors:

* `run`
* `build`

Planned later:

* `dev`
* `test`
* generators

## Execution Model

### `run`

`run` launches Bun directly.

It supports:

* `script` mode for `bun run <script>`
* `entry` mode for direct source execution
* `buildTarget` mode for build-first launch flows
* `watch` for long-running source or built-output execution

### `build`

`build` produces Bun bundles.

It is:

* API-first when `Bun.build()` is available
* CLI-fallback when `useCli` is set or the API is unavailable

It supports:

* a primary `entry`
* `additionalEntryPoints` for migration-style or extra bundles
* directory-based Nx outputs

### JSX example app

The workspace includes `jsx-example-app` as a TSX rendering example.

It uses a custom JSX factory and a small HTML renderer, so JSX syntax here does not imply React.

## Layout

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
  index.ts
```

## Shared Utilities

Shared helpers are kept small and focused.

Examples:

* Bun binary resolution
* option validation
* argument building
* build entry normalization
* working directory resolution
* child-process execution

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
