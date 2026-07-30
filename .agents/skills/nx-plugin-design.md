# Nx Plugin Design

## Skill description

Use this skill when designing or implementing plugin behavior for `nx-bun`.

## Guiding idea

`nx-bun` should behave like a modern Nx plugin that gives Bun workflows first-class ergonomics without depending on deprecated or unstable Nx extension points.

## Preferred building blocks

* executors for task execution
* generators for workspace and project scaffolding
* migrations for configuration evolution
* hooks only when a concrete requirement cannot be met cleanly otherwise

## Recommended implementation style

### Executors

Executors should:

* accept typed options
* build Bun CLI invocations predictably
* expose clear success and failure behavior
* integrate with Nx target configuration cleanly

### Generators

Generators should:

* create minimal, understandable files
* avoid locking users into unnecessary conventions
* support practical defaults
* be easy to rerun or extend

### Configuration

Configuration should:

* be explicit
* avoid hidden magic
* align with common Nx expectations
* define outputs for cacheable tasks where possible

## Anti-patterns

Avoid:

* recreating custom task runner behavior
* patching Nx internals
* mixing many responsibilities into one executor
* assuming Bun behavior that is not stable or documented

## Evaluation checklist

When proposing a feature, check:

* Does it use a supported Nx API?
* Does it make Bun workflows easier in a meaningful way?
* Can it be explained simply in README examples?
* Will it likely survive future Nx upgrades?
* Is it necessary for v1?
