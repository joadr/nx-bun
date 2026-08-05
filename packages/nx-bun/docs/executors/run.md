# `run` Executor Specification

## Purpose

The `run` executor is the foundational executor for `nx-bun`.

Its role is to let an Nx target execute Bun commands in a clear, reusable, Nx-native way without requiring users to repeat `nx:run-commands` configuration for common Bun workflows.

This executor should be general enough to support many Bun use cases while remaining simple and explicit.

## Status

Implemented as the initial Bun process runner for `nx-bun`.

## Goals

- execute Bun commands from Nx targets
- provide a typed and documented configuration surface
- establish shared Bun process execution logic for the plugin
- support later reuse by specialized executors such as `build`, `dev`, and `test`

## Non-goals

- replace all forms of process execution in Nx
- infer complex behavior automatically
- manage remote caching strategies
- wrap every Bun feature in dedicated options from the beginning

## User stories

### Generic script execution

As a user, I want to run a Bun script from an Nx target so I can standardize project tasks under plugin-provided executors.

### Direct Bun entry execution

As a user, I want to run Bun entry files with explicit runtime and application arguments so I can avoid writing repetitive shell commands in every target.

### Optional build first

As a user, I want Bun to run after a build target when I need compiled output, but skip the build when I want to run source directly.

For build-first targets, `buildTarget` points to the Nx task that produces the bundle, and `run` launches the inferred primary output from that target's declared `outputs`.

The inference supports common Nx output placeholders such as `{projectRoot}`, `{workspaceRoot}`, and `{options.outputPath}`.

### Watch mode

As a user, I want the `serve` target to keep rebuilding and restarting when source files change.

### Reusable plugin foundation

As a maintainer, I want `run` to provide shared Bun execution behavior so other executors can reuse it consistently.

## Supported usage patterns

The executor should support at least one or both of these patterns.

### Pattern A: Script mode

Example intent:

- `bun run dev`
- `bun run lint`
- `bun run start --port 3000`

### Pattern B: Direct entry mode

Example intent:

- `bun src/main.ts`
- `bun --inspect src/main.ts --watch`

The exact final option shape can be refined during implementation, but the executor should preserve explicitness.

## Current Workspace Examples

### Example 1: Direct source run

```json
{
  "targets": {
    "serve-source": {
      "executor": "@joadr/nx-bun:run",
      "continuous": true,
      "options": {
        "entry": "src/main.ts",
        "watch": true
      }
    }
  }
}
```

Expected command shape:

```text
bun --watch src/main.ts
```

### Example 2: Source run with runtime args

```json
{
  "targets": {
    "serve-source": {
      "executor": "@joadr/nx-bun:run",
      "continuous": true,
      "options": {
        "entry": "src/main.ts",
        "runtimeArgs": ["--inspect"]
      }
    }
  }
}
```

Expected command shape:

```text
bun --inspect src/main.ts
```

### Example 3: Build-first serve

```json
{
  "targets": {
    "serve": {
      "executor": "@joadr/nx-bun:run",
      "continuous": true,
      "options": {
        "buildTarget": "example-app:build",
        "watch": true
      }
    }
  }
}
```

Expected command shape:

```text
bun --watch /absolute/path/to/packages/example-app/dist/main.js
```

## Proposed option model

Initial proposal:

| Option        | Type                     | Required | Description                                                   |
| ------------- | ------------------------ | -------- | ------------------------------------------------------------- |
| `script`      | `string`                 | no       | Bun script name to run via `bun run <script>`                 |
| `entry`       | `string`                 | no       | Bun entry file to execute directly                            |
| `buildTarget` | `string`                 | no       | Nx target to run before Bun starts                            |
| `runtimeArgs` | `string[]`               | no       | Extra arguments passed to Bun before the script or entry      |
| `args`        | `string[]`               | no       | Extra arguments appended after script or entry                |
| `cwd`         | `string`                 | no       | Working directory relative to workspace root or absolute path |
| `bunPath`     | `string`                 | no       | Explicit Bun binary path if auto-resolution is not desired    |
| `env`         | `Record<string, string>` | no       | Extra environment variables for the spawned process           |

## Validation rules

The executor should validate at least the following:

- exactly one of `script` or `entry` must be provided
- `script` must be a non-empty string if provided
- `entry` must be a non-empty string if provided
- `args` must be an array of strings if provided
- `runtimeArgs` must be an array of strings if provided
- `buildTarget` must be a non-empty string if provided
- `cwd` must resolve to a valid location if provided

## Command construction rules

### Script mode

If `script` is provided:

- build command as `bun run <script> ...args`

### Entry mode

If `entry` is provided:

- build command as `bun ...runtimeArgs <entry> ...args`

### Precedence

If both `script` and `entry` are provided:

- fail validation

If neither is provided:

- fail validation

## Working directory behavior

Default behavior should be predictable.

Initial preference:

- default `cwd` to the project root when Nx provides project context cleanly
- otherwise default to workspace root

Implementation should document the final behavior clearly.

## Environment behavior

The executor should:

- inherit the current process environment by default
- merge any provided `env` entries
- avoid silently removing existing environment variables

## Process behavior

The process execution layer should:

- spawn Bun as a child process
- preserve the Bun exit code
- stream output directly for good developer experience
- return `{ success: true }` on exit code `0`
- return `{ success: false }` on non-zero exit code or execution failure

## Long-running tasks

If `watch` is true or the command is naturally long-running:

- the executor should behave correctly for interactive development workflows
- documentation should clarify that such tasks are not expected to be cacheable in normal Nx usage

## Bun binary resolution

Resolution strategy should be simple and explicit.

Preferred order:

1. use `bunPath` if provided
2. otherwise use `bun` from system resolution

If Bun cannot be found:

- fail with a clear error message explaining how to provide `bunPath` or install Bun

## Error handling requirements

Error output should be actionable.

The executor should report:

- whether validation failed or process execution failed
- the constructed command shape where useful
- the working directory used
- missing Bun binary issues clearly

## Caching expectations

The generic `run` executor should not make strong caching assumptions on its own.

Instead:

- caching should be determined primarily by target usage
- documentation should explain that some usages are cacheable and others are not
- specialized executors may provide stronger conventions later

## Reuse by future executors

The `run` executor should inform internal shared utilities for:

- Bun binary resolution
- command building
- environment merging
- working directory resolution
- process spawning

Specialized executors should reuse these utilities rather than fork behavior.

## Open questions

These can be decided during implementation:

- should `run` accept a single raw command string, or only structured options?
- should `cwd` default to workspace root or inferred project root?
- should passthrough CLI args from Nx invocation be supported explicitly in v1?
- should `watch` affect behavior or remain documentation-only metadata?

## Recommendation

For v1, prefer the most explicit and least ambiguous form:

- support structured options first
- avoid raw shell command strings initially
- keep command construction deterministic and testable

## Acceptance criteria

The `run` executor specification is satisfied when:

- a user can run `bun run <script>` through an Nx target
- a user can run direct Bun subcommands through an Nx target
- option validation is clear and consistent
- output is streamed properly
- exit codes are preserved
- the implementation provides reusable internal execution utilities for later executors
