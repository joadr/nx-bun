# Project Conventions

## Purpose

This document records the working conventions for the `nx-bun` repository.

## Naming

* Use `nx-bun` as the repository name
* Use a scoped package name once publishing decisions are made
* Keep file and directory names explicit and descriptive

## Architecture conventions

* Treat the project as a standard Nx plugin
* Prefer executors and generators over custom orchestration logic
* Keep Bun integration close to the Bun CLI unless there is a strong reason not to
* Avoid coupling implementation to unstable Nx internals

## Documentation conventions

* Update documentation when adding features
* Document assumptions and limitations
* Prefer practical examples over abstract descriptions

## Implementation conventions

* Keep modules small and focused
* Separate command construction from process execution when possible
* Validate options clearly
* Surface Bun and Nx errors with enough context to debug quickly

## Scope conventions

* Keep v1 intentionally narrow
* Reject speculative complexity unless it solves a demonstrated problem
* Favor maintainability over cleverness
