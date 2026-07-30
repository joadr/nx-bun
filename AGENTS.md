# AGENTS.md

This file defines working guidance for humans and agents contributing to `nx-bun`.

## Project summary

`nx-bun` is intended to be a modern Nx plugin for Bun.

The project should help Nx users run Bun-based workflows without relying on deprecated Nx features such as custom task runners.

## Primary objective

Build and maintain a small, well-structured Nx plugin that:

* works with modern Nx versions
* works with modern Bun versions
* uses supported Nx plugin APIs
* remains easy to understand and maintain

## Core constraints

### 1. Do not build around deprecated runner internals

Avoid any approach that depends on:

* custom task runners
* internal Nx task orchestration hooks that are not public or stable
* patching Nx internals

If a feature requires this, it should be rejected or redesigned.

### 2. Prefer thin wrappers over deep abstractions

When possible, implement executors as clear wrappers around Bun CLI behavior.

Prefer:

* explicit options
* predictable command construction
* simple process spawning

Avoid:

* hidden side effects
* overly magical config inference
* Bun-specific abstractions that do not clearly improve usability

### 3. Use stable Nx extension points

Preferred extension points:

* executors
* generators
* migrations
* officially documented hooks, only when necessary

### 4. Keep v1 small

The initial implementation should focus on a narrow feature set:

* `run` executor
* `build` executor
* `dev` executor
* `test` executor
* `init` generator

Everything else should be considered optional until the basics are solid.

## Quality bar

All contributions should aim for:

* clear file and API boundaries
* typed options and schemas
* simple error messages
* documented assumptions
* compatibility with current Nx plugin conventions

## Decision rules

When choosing between two implementations, prefer the one that is:

1. more compatible with official Nx APIs
2. easier to maintain across Nx upgrades
3. simpler to explain in documentation
4. less surprising to users

## Documentation expectations

Before or alongside implementation work, keep documentation current in these areas:

* package purpose
* executor behavior
* generator behavior
* configuration examples
* known limitations

## Initial deliverables

The recommended order of work is:

1. documentation
2. package layout
3. generic `run` executor
4. specialized executors
5. generators
6. migrations and compatibility polish

## Out of scope for now

The following should not block initial development:

* remote cache integrations
* Nx fork compatibility
* deep Bun ecosystem specialization
* broad automatic inference features
* support for every Bun-related framework

## Working style

Changes should be incremental.

Favor small commits and files that are easy to review.

If introducing a new concept, also add or update documentation explaining:

* why it exists
* how it fits Nx
* how it fits Bun
* what alternatives were rejected
