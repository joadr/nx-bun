# ROADMAP

This roadmap describes the current and planned evolution of `nx-bun`.

## Principles

* start small
* validate with working executors early
* prefer stable Nx APIs
* avoid deprecated runner concepts
* add convenience only after core behavior is reliable

## Current Status

Phase 3: core Bun executors are in progress.

Implemented so far:

* `run`
* `build`
* workspace examples and smoke tests

## Phase 3: Core Bun Executors

### Goals

* finish Bun-specific execution flows
* keep build and run behavior aligned with the current workspace examples
* improve watch-mode ergonomics

### Deliverables

* `run` executor refinements
* `build` executor refinements
* better output inference for multi-entry builds
* more example app coverage

### Exit Criteria

* Bun build workflows work through Nx targets
* long-running dev tasks behave correctly
* build-first launch flows are clear and reproducible

## Phase 4: Workspace and Project Generators

### Goals

* make setup easier for new users
* add Bun app/library scaffolding

### Deliverables

* `init` generator
* `app` generator
* `lib` generator

## Phase 5: Compatibility and Polish

### Goals

* validate against multiple Nx and Bun versions
* improve DX and error messages

### Deliverables

* compatibility matrix
* migration support if needed
* better examples
* release preparation tasks

## Future Ideas

Possible future directions, but not part of the current promise:

* richer framework templates
* Bun-specific inferred task integration
* deeper workspace analysis helpers
* optional hooks if a real use case appears

## Non-Goals for Early Versions

* replacing Nx orchestration
* emulating deprecated custom task runner behavior
* bundling remote cache solutions
* forking or patching Nx internals
* broad framework support before core Bun workflows are stable
