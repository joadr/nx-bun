# `test` Executor Specification

## Purpose

The `test` executor runs `bun test` from an Nx target.

It is intentionally thin: a small wrapper around Bun test execution with explicit options and optional prerequisite builds.

## Options

- `args`: arguments passed after `bun test`
- `runtimeArgs`: Bun flags passed before `test`
- `buildTarget`: optional prerequisite Nx target to run before `bun test`
- `cwd`: working directory for the Bun process
- `bunPath`: explicit Bun binary path
- `env`: extra environment variables
- `watch`: keep Bun test in watch mode

## Expected behavior

- default `cwd` to the project root
- run `buildTarget` first when provided
- execute `bun test` directly when no prerequisite build is needed
- keep output streamed to the terminal
- preserve Bun's exit code
- allow `watch` for continuous test runs

`buildTarget` should generally point to a finite prerequisite build target.
For continuous build/watch flows, prefer normal Nx `dependsOn` wiring instead.

## Command Shape

The executor builds commands like:

```text
bun test
bun --watch test
bun --smol test src/render.test.tsx
```

## Current Workspace Example

```json
{
  "targets": {
    "test": {
      "executor": "@joadr/nx-bun:test",
      "options": {
        "args": ["src/render.test.tsx"]
      }
    }
  }
}
```

## Build-First Example

```json
{
  "targets": {
    "test": {
      "executor": "@joadr/nx-bun:test",
      "options": {
        "buildTarget": "my-app:build",
        "args": ["src/main.test.ts"]
      }
    }
  }
}
```
