# @joadr/nx-bun

`@joadr/nx-bun` is an Nx plugin for Bun-based workflows.

## Docs

- [Docs index](docs/index.md)
- [Architecture](docs/architecture.md)
- [Decisions](docs/decisions.md)
- [Roadmap](docs/roadmap.md)

## Quickstart

### Build

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

### Run

```json
{
  "targets": {
    "serve": {
      "executor": "@joadr/nx-bun:run",
      "options": {
        "buildTarget": "example-app:build",
        "watch": true
      }
    }
  }
}
```

### Test

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

## Install

```bash
bun add -d @joadr/nx-bun
```

Or with npm:

```bash
npm install -D @joadr/nx-bun
```

For GitHub Actions publishing, use npm Trusted Publishing instead of an `NPM_TOKEN` secret.

## What It Provides

- `build` for Bun entry files
- `build` for Bun entry files and standalone executables
- `run` for Bun scripts and entry files
- `test` for `bun test`
- `buildTarget`-based launch flows for built output
- support for extra entry points, including migration files
- Bun CLI flags for advanced `build` customization
- optional pruned `package.json` generation for deployable builds
- a client-only React example app in `packages/jsx-client-example-app`

## Docs

- `docs/executors/build.md`
- `docs/executors/run.md`
- `docs/executors/test.md`
- `../jsx-example-app/README.md` for the TSX rendering example

## Status

Active development. The plugin is wired into this workspace and tested against the included example app.
