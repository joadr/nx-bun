# jsx-example-app

`jsx-example-app` is a small Bun app that renders a TSX page through a custom JSX factory.

## What It Demonstrates

* JSX syntax without React
* server-side rendering from TSX to HTML
* reusable components and list rendering
* local ambient types for `JSX` and `Bun`

## Run It

```bash
npx nx run jsx-example-app:serve
npx nx run jsx-example-app:serve-source
```

Open `http://localhost:3000`.

## Why It Does Not Use React

This example uses a local JSX factory (`h`) and a tiny HTML renderer in `src/render.ts`.

That keeps the demo focused on JSX composition rather than React runtime behavior.

## Files Of Interest

* `src/page.tsx` renders the landing page from TSX
* `src/render.ts` converts the JSX tree to HTML
* `src/jsx.d.ts` defines JSX intrinsic element types for the editor
* `src/bun.d.ts` defines the minimal Bun globals used by the app
