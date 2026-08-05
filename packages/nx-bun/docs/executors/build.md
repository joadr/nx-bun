# `build` Executor

## Purpose

Transpile Bun entry files for Nx projects.

`build` uses the Bun CLI in transpile-only mode by default, and keeps `outputPath` aligned with the workspace-root-relative Nx contract.

## Quickstart

```json
{
  "targets": {
    "build": {
      "executor": "@joadr/nx-bun:build",
      "options": {
        "entry": "src/main.ts",
        "outputPath": "{workspaceRoot}/dist/apps/example-app"
      },
      "outputs": ["{workspaceRoot}/dist/apps/example-app"]
    }
  }
}
```

### Standalone executable

```json
{
  "targets": {
    "build": {
      "executor": "@joadr/nx-bun:build",
      "options": {
        "entry": "src/cli.ts",
        "outputPath": "{workspaceRoot}/dist/apps/example-app",
        "compile": true
      },
      "outputs": ["{workspaceRoot}/dist/apps/example-app"]
    }
  }
}
```

## Options

| Option                  | Type                               | Required                               | Default     | Description                                                                     |
| ----------------------- | ---------------------------------- | -------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| `entry`                 | `string`                           | yes                                    | -           | Primary Bun entry file to build.                                                |
| `outputPath`            | `string`                           | yes                                    | -           | Output directory for artifacts. Relative to the workspace root unless absolute. |
| `additionalEntryPoints` | `{ name: string; path: string }[]` | no                                     | `[]`        | Extra entry files or named descriptors.                                         |
| `external`              | `string[]`                         | no                                     | `[]`        | Packages or paths to exclude.                                                   |
| `format`                | `string`                           | no                                     | `undefined` | Bun output format.                                                              |
| `minify`                | `boolean`                          | no                                     | `false`     | Enable minification.                                                            |
| `sourcemap`             | `string`                           | no                                     | `undefined` | Source map mode.                                                                |
| `splitting`             | `boolean`                          | no                                     | `false`     | Enable code splitting.                                                          |
| `target`                | `string`                           | no                                     | `bun`       | Bun compilation target.                                                         |
| `define`                | `Record<string, string>`           | no                                     | `{}`        | Compile-time replacements.                                                      |
| `naming`                | `string`                           | no                                     | `undefined` | Output naming pattern.                                                          |
| `publicPath`            | `string`                           | no                                     | `undefined` | Runtime asset prefix.                                                           |
| `bundle`                | `boolean`                          | no                                     | `false`     | Enable Bun bundling instead of transpile-only output.                           |
| `compile`               | `boolean`                          | no                                     | `false`     | Build standalone Bun executables.                                               |
| `assets`                | `(string                           | { input: string; output?: string })[]` | no          | `[]`                                                                            | Files or directories to copy into the output path. |
| `cliArgs`               | `string[]`                         | no                                     | `[]`        | Extra Bun CLI flags.                                                            |
| `generatePackageJson`   | `boolean`                          | no                                     | `false`     | Write a pruned `package.json` into the output directory.                        |
| `watch`                 | `boolean`                          | no                                     | `false`     | Keep rebuilding on file changes.                                                |

## Behavior

- Resolve entries from project or workspace paths.
- Transpile artifacts into the declared output directory.
- Keep the output directory aligned with the Nx `outputs` contract.
- Support multiple entry files for scripts and migrations.
- Support bundling only when `bundle: true` is set.
- Support standalone executables when `compile: true` is set.
- Copy declared assets into the output directory.
- Return `success: false` on build failure.

## Output Contract

- `outputPath` is workspace-root-relative by default.
- Nx `outputs` should point at the output directory, not individual files.
- Transpiled output writes `main.js` into the resolved output directory.
- Compiled executables are written into the resolved output directory using the entry name.
- Use `assets` to copy HTML shells and static files for browser bundles.

## Notes

- Use `generatePackageJson` when you need a deployable manifest next to the build output.
- Use `cliArgs` only for Bun flags not covered by structured options.
- `bundle` and `compile` are mutually exclusive.
- `compile` is best for standalone CLI tools and single-binary deployments.
- `publicPath` is not supported when `compile: true` is enabled.

## Related Docs

- [run executor](run.md) for build-first launch flows.
- [Architecture](../architecture.md)
- [Decisions](../decisions.md)
