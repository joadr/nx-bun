# nx-bun Workspace

This repo contains the `nx-bun` Nx plugin and a small example app used to exercise it.

## Layout

* `packages/nx-bun` contains the plugin source, executors, and package docs.
* `packages/example-app` is the Bun app used as a live consumer example.
* `packages/jsx-example-app` is a TSX rendering example that shows JSX without React.

## What `nx-bun` Does

`nx-bun` provides Nx executors for Bun workflows.

* `build` builds Bun bundles.
* `run` launches Bun scripts or entry files.
* `run` can also launch built output via `buildTarget`.
* `build` supports extra entry points for things like migrations.
* The workspace also includes a TSX server-rendering example to exercise JSX support.

The plugin aims to stay thin, explicit, and aligned with modern Nx APIs.

## Current Workspace Targets

* `nx run example-app:build` builds the example app and migration bundle.
* `nx run example-app:serve` builds first, then launches the built app in watch mode.
* `nx run example-app:serve-source` runs the source entry directly in watch mode.
* `nx run jsx-example-app:test` runs the TSX example tests.
* `nx run nx-bun:test` runs the plugin tests.
* `nx run nx-bun:selftest` exercises the built plugin.
* `nx run nx-bun:selftest-source` exercises the source plugin.

## Quick Start

### Build a Bun app

```json
{
  "targets": {
    "build": {
      "executor": "nx-bun:build",
      "options": {
        "entry": "src/main.ts",
        "outputPath": "dist"
      },
      "outputs": ["{projectRoot}/dist"]
    }
  }
}
```

### Run a Bun entry file

```json
{
  "targets": {
    "serve-source": {
      "executor": "nx-bun:run",
      "options": {
        "entry": "src/main.ts",
        "watch": true
      }
    }
  }
}
```

### Run Bun tests

```json
{
  "targets": {
    "test": {
      "executor": "nx-bun:test",
      "options": {
        "args": ["src/render.test.tsx"]
      }
    }
  }
}
```

```bash
npx nx run example-app:build
npx nx run example-app:serve
npx nx run example-app:serve-source
npx nx run jsx-example-app:test
```

## How The Plugin Works

* `build` is API-first and uses `Bun.build()` when available.
* `build` falls back to the Bun CLI when `useCli` is set or Bun APIs are unavailable.
* `run` executes `bun` directly for scripts or entry files.
* `run` can use `buildTarget` to launch built output from a prior Nx task.
* `watch` keeps build and serve targets continuous.

## Bun Build Notes

* `entry` is the primary bundle entry point.
* `additionalEntryPoints` supports extra bundles, including migration-style scripts.
* `outputPath` is the Bun output directory.
* Nx `outputs` stay directory-based for now.

## Documentation

* `packages/nx-bun/README.md`
* `packages/nx-bun/docs/executors/build.md`
* `packages/nx-bun/docs/executors/run.md`
* `packages/nx-bun/docs/executors/test.md`

## Status

The workspace is functional and actively under development.
