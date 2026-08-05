# `run` Executor

## Purpose

Run Bun scripts or entry files from an Nx target.

`run` is the foundational executor in `nx-bun`, and it also supports build-first flows through `buildTarget`.

## Quickstart

```json
{
  "targets": {
    "serve-source": {
      "executor": "@joadr/nx-bun:run",
      "options": {
        "entry": "src/main.ts",
        "watch": true
      }
    }
  }
}
```

## Options

| Option        | Type                     | Required | Default      | Description                                                 |
| ------------- | ------------------------ | -------- | ------------ | ----------------------------------------------------------- |
| `script`      | `string`                 | no       | -            | Bun script name to run via `bun run <script>`.              |
| `entry`       | `string`                 | no       | -            | Bun entry file to execute directly.                         |
| `buildTarget` | `string`                 | no       | -            | Nx target to run before Bun starts.                         |
| `runtimeArgs` | `string[]`               | no       | `[]`         | Extra arguments passed to Bun before the script or entry.   |
| `args`        | `string[]`               | no       | `[]`         | Extra arguments appended after the script or entry.         |
| `cwd`         | `string`                 | no       | project root | Working directory for the Bun process.                      |
| `bunPath`     | `string`                 | no       | `bun`        | Explicit Bun binary path if auto-resolution is not desired. |
| `env`         | `Record<string, string>` | no       | `{}`         | Extra environment variables for the spawned process.        |
| `watch`       | `boolean`                | no       | `false`      | Keep Bun running in watch mode.                             |

## Modes

- Use `script` for `bun run <script>` flows.
- Use `entry` for direct source execution.
- Use `buildTarget` when the app should run built output instead of source.

## Behavior

- Exactly one of `script` or `entry` must be provided.
- `run` resolves `buildTarget` output before launching Bun.
- The executor inherits environment variables by default.
- The executor streams output and preserves the Bun exit code.
- `watch` keeps long-running development flows alive.

## Build-First Usage

When `buildTarget` is set, `run` launches the primary file from the build target's declared output directory.

See [build](build.md) for the build output contract.

## Notes

- Keep target configuration explicit.
- Use `bunPath` only when Bun is not available on the system path.

## Related Docs

- [build executor](build.md)
- [test executor](test.md)
- [Architecture](../architecture.md)
