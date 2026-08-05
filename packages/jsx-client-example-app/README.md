# jsx-client-example-app

`jsx-client-example-app` is a small Bun + React client example.

It shows a client-only React app with Bun dev-server HMR and an Nx build target that bundles the browser output.

## What It Demonstrates

- React integration without a framework wrapper
- Bun dev-server HMR with `import.meta.hot`
- client-only bundling with `@joadr/nx-bun:build`

## Quickstart

```bash
npx nx run jsx-client-example-app:serve
npx nx run jsx-client-example-app:build
```

## Docs

- [Workspace docs index](../nx-bun/docs/index.md)
- [Plugin README](../nx-bun/README.md)

## Files Of Interest

- `src/App.tsx` renders the React UI
- `src/main.tsx` mounts the app and preserves HMR state
- `src/dev-server.ts` serves the dev HTML route
- `src/index.dev.html` is the development shell
- `src/index.prod.html` is the production shell
