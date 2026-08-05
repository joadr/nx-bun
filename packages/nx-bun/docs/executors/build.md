# `build` Executor Specification

## Purpose

The `build` executor transpiles Bun entry files for Nx projects.

It shells out to the Bun CLI, uses `--no-bundle`, and keeps the output path aligned with Nx's workspace-root-relative `outputPath` contract.

## Options

- `entry`: primary Bun entry file to build
- `outputPath`: output directory for artifacts, relative to the workspace root unless absolute
- `additionalEntryPoints`: extra Bun entry files or named entry descriptors
- `external`: packages or paths to exclude
- `format`: bundle format
- `minify`: enable minification
- `sourcemap`: source map mode
- `splitting`: enable code splitting

* `target`: Bun compilation target, defaults to `bun`

- `define`: compile-time replacements
- `naming`: output naming pattern
- `publicPath`: runtime asset prefix
- `bundle`: enable Bun bundling instead of transpile-only output
- `cliArgs`: extra Bun CLI flags
- `generatePackageJson`: write a pruned `package.json` into the output directory
- `watch`: keep rebuilding on file changes

## Expected behavior

- resolve entries from project or workspace paths
- transpile artifacts into the declared workspace-root-relative output directory
- keep the output directory aligned with the Nx `outputs` contract
- support multiple entry files for scripts and migrations
- preserve a simple option surface
- optionally emit a deployable `package.json`

- default to a server-friendly Bun build target
- support bundling as an opt-in mode
- allow advanced Bun CLI customization through Bun CLI flags
- return `success: false` on build failure
- support watch mode for continuous rebuilds

## Current Workspace Example

```json
{
  "targets": {
    "build": {
      "executor": "@joadr/nx-bun:build",
      "continuous": true,
      "options": {
        "entry": "src/main.ts",
        "additionalEntryPoints": [
          {
            "name": "db/migrations/migration0",
            "path": "db/migrations/Migration20250331154716.ts"
          }
        ],
        "outputPath": "dist/apps/example",
        "generatePackageJson": true,
        "cliArgs": ["--compile", "--bytecode"],
        "watch": true
      },
      "outputs": ["{workspaceRoot}/dist/apps/example"]
    }
  }
}
```

Expected output:

- `dist/apps/example/main.js`
- `dist/apps/example/db/migrations/migration0.js`
- `dist/apps/example/package.json`

## Package Json Generation

When `generatePackageJson` is enabled, `@joadr/nx-bun:build` writes a pruned `package.json` next to the build output.

The generated manifest keeps the workspace package name/version metadata and runtime dependencies, while removing scripts and development-only dependencies.

## Advanced CLI Escape Hatch

`cliArgs` is only applied when the executor uses Bun CLI mode.

Use it for Bun flags that are not represented by the structured executor options.
