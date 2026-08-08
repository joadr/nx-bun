# nx-bun Workspace

This repo contains the `@joadr/nx-bun` Nx plugin and example apps used to exercise it.

## What It Is

`@joadr/nx-bun` provides thin Nx executors for Bun workflows.

- `build` transpiles Bun entry files or compiles standalone executables.
- `run` launches Bun scripts or entry files.
- `test` runs `bun test`.

## Example Apps

- `packages/example-app` is the Bun app used as a live consumer example.
- `packages/jsx-example-app` is a TSX rendering example without React.
- `packages/jsx-client-example-app` is a client-only React example with Bun dev-server HMR.

## Docs

- [Docs index](packages/nx-bun/docs/index.md)
- [Architecture](packages/nx-bun/docs/architecture.md)
- [Decisions](packages/nx-bun/docs/decisions.md)
- [Roadmap](packages/nx-bun/docs/roadmap.md)

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

## Which Executor Should I Use?

- Use `build` to transpile Bun entry files into `dist`.
- Use `run` to execute Bun scripts or source files.
- Use `test` to run `bun test` from Nx.

## Install

```bash
bun add -d @joadr/nx-bun
```

Or with npm:

```bash
npm install -D @joadr/nx-bun
```

## Publish

The release workflow publishes `@joadr/nx-bun` to npm and GitHub Packages, and creates a GitHub Release with notes from the commit history.

For GitHub Actions publishing, use npm Trusted Publishing instead of an `NPM_TOKEN` secret.

## Thanks

Thanks to [Jordan-Hall's `nx-bun`](https://github.com/Jordan-Hall/nx-bun) for inspiring this project.

## Donations

- ETH: `0xA397c72a9b714A5990C8231388Fc944954D21888`
- EVM compatible: `0xA397c72a9b714A5990C8231388Fc944954D21888`
