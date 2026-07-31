# `build` Executor Specification

## Purpose

The `build` executor produces Bun bundles for Nx projects.

It is API-first when `Bun.build()` is available and falls back to the Bun CLI when `useCli` is enabled or Bun APIs are unavailable.

## Options

* `entry`: primary Bun entry file to build
* `outputPath`: output directory for artifacts
* `additionalEntryPoints`: extra Bun entry files or named entry descriptors
* `external`: packages or paths to exclude
* `format`: bundle format
* `minify`: enable minification
* `sourcemap`: source map mode
* `splitting`: enable code splitting
* `define`: compile-time replacements
* `naming`: output naming pattern
* `publicPath`: runtime asset prefix
* `cliArgs`: extra Bun CLI flags for `useCli` mode
* `useCli`: force CLI mode
* `watch`: keep rebuilding on file changes

## Expected behavior

* resolve paths from the project root
* build artifacts into the declared output directory
* keep the output directory as the Nx `outputs` contract
* support multiple entry bundles for scripts and migrations
* preserve a simple option surface
* allow advanced Bun CLI customization when `useCli` is enabled
* return `success: false` on build failure
* support watch mode for continuous rebuilds

## Current Workspace Example

```json
{
  "targets": {
    "build": {
      "executor": "nx-bun:build",
      "continuous": true,
      "options": {
        "entry": "src/main.ts",
        "additionalEntryPoints": [
          {
            "name": "db/migrations/migration0",
            "path": "db/migrations/Migration20250331154716.ts"
          }
        ],
        "outputPath": "dist",
        "cliArgs": ["--compile", "--bytecode"],
        "watch": true
      },
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

Expected output:

* `dist/main.js`
* `dist/db/migrations/migration0.js`

## Advanced CLI Escape Hatch

`cliArgs` is only applied when the executor uses Bun CLI mode.

Use it for Bun flags that are not represented by the structured executor options.
