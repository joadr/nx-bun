# `test` Executor

## Purpose

Run `bun test` from an Nx target.

This executor stays thin and explicit, with optional prerequisite builds when needed.

## Quickstart

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

## Options

| Option        | Type                     | Required | Default      | Description                                               |
| ------------- | ------------------------ | -------- | ------------ | --------------------------------------------------------- |
| `args`        | `string[]`               | no       | `[]`         | Arguments passed after `bun test`.                        |
| `runtimeArgs` | `string[]`               | no       | `[]`         | Bun flags passed before `test`.                           |
| `buildTarget` | `string`                 | no       | -            | Optional prerequisite Nx target to run before `bun test`. |
| `cwd`         | `string`                 | no       | project root | Working directory for the Bun process.                    |
| `bunPath`     | `string`                 | no       | `bun`        | Explicit Bun binary path.                                 |
| `env`         | `Record<string, string>` | no       | `{}`         | Extra environment variables.                              |
| `watch`       | `boolean`                | no       | `false`      | Keep Bun test in watch mode.                              |

## Behavior

- Defaults `cwd` to the project root.
- Runs `buildTarget` first when provided.
- Executes `bun test` directly when no prerequisite build is needed.
- Streams output to the terminal.
- Preserves Bun's exit code.

## Build-First Usage

Use `buildTarget` for a finite prerequisite build, not for continuous watch chains.

For continuous flows, prefer Nx `dependsOn` wiring.

## Notes

- `watch` is useful for local development and interactive test loops.

## Related Docs

- [run executor](run.md)
- [Architecture](../architecture.md)
