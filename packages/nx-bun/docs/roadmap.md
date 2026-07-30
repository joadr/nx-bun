# ROADMAP

This roadmap describes the planned evolution of `nx-bun` as a modern Nx plugin for Bun.

## Principles

The roadmap follows these principles:

* start small
* validate with working executors early
* prefer stable Nx APIs
* avoid dependence on deprecated runner concepts
* add convenience only after core behavior is reliable

## Current status

Phase 0: documentation and project framing.

## Phase 0: Foundation and documentation

### Goals

* define project scope
* document intent and constraints
* establish contribution guidance
* clarify first implementation targets

### Deliverables

* `README.md`
* `AGENTS.md`
* `.agents/rules/`
* `.agents/skills/`
* `ROADMAP.md`

### Exit criteria

* contributors can understand the purpose of the project
* the project has a documented v1 scope
* architectural anti-patterns are explicitly identified

## Phase 1: Package bootstrap

### Goals

* create the plugin package structure
* define build, lint, and test basics
* establish TypeScript and Nx plugin conventions

### Deliverables

* `package.json`
* TypeScript configuration
* source directory structure
* executor and generator registration files
* baseline development scripts

### Exit criteria

* the package installs locally
* the plugin can be built
* source layout is ready for executor implementation

## Phase 2: Generic Bun execution

### Goals

* implement a generic executor that can run Bun commands safely and predictably
* establish process spawning patterns and option validation

### Deliverables

* `run` executor
* executor schema
* command construction utilities
* basic tests for command behavior

### Example user value

Users can define Nx targets that invoke Bun without repetitive `run-commands` setup.

### Exit criteria

* a workspace target can execute Bun via the plugin
* command arguments are passed through correctly
* failures return useful error output

## Phase 3: Core Bun executors

### Goals

* provide focused executors for common workflows
* reduce repeated target boilerplate for Bun projects

### Deliverables

* `build` executor
* `dev` executor
* `test` executor

### Design notes

These may initially share internal logic with `run` rather than duplicating execution code.

### Exit criteria

* Bun build workflows work through Nx targets
* long-running dev tasks behave correctly
* test tasks integrate cleanly with Nx execution

## Phase 4: Workspace and project generators

### Goals

* make setup easier for users starting from scratch or adding Bun to an existing Nx workspace

### Deliverables

* `init` generator
* `app` generator
* `lib` generator
* starter templates

### Exit criteria

* a user can scaffold a Bun app or library with one command
* generated projects contain understandable configuration
* generated targets work with the executors from previous phases

## Phase 5: Caching and outputs refinement

### Goals

* improve target metadata so Nx caching behaves predictably where appropriate
* document what is and is not cacheable

### Deliverables

* explicit output conventions for build targets
* guidance for cacheable vs non-cacheable targets
* examples showing recommended Nx target configuration

### Exit criteria

* build outputs are clearly defined
* users understand expected caching behavior
* dev targets are clearly marked as long-running and non-cacheable where relevant

## Phase 6: Compatibility and polish

### Goals

* validate the plugin against multiple Nx and Bun versions
* improve DX and stability

### Deliverables

* compatibility matrix
* migration support if needed
* better examples
* improved error messages
* release preparation tasks

### Exit criteria

* supported version ranges are documented
* upgrade risks are known
* the package is ready for broader adoption

## Future ideas

These are possible future directions, but not part of the initial promise:

* richer framework templates
* Bun-specific inferred task integration
* deeper workspace analysis helpers
* optional hooks if a real use case appears
* benchmark and performance comparisons

## Explicit non-goals for early versions

* replacing Nx orchestration
* emulating deprecated custom task runner behavior
* bundling remote cache solutions
* forking or patching Nx internals
* broad framework support before core Bun workflows are stable

## Success criteria for v1

A version 1 release should provide:

* a working Nx plugin package
* Bun execution through dedicated executors
* starter generators for apps and libraries
* clear documentation
* compatibility with current Nx plugin practices

## How to use this roadmap

When adding work:

* map it to a phase
* describe the user problem it solves
* explain why it belongs in `nx-bun`
* keep new work aligned with the project principles
