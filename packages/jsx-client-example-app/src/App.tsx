/** @jsxImportSource react */

import { useState } from "react";

export function App(props: { reloads: number; lastReloadedAt: string | null }) {
  const [count, setCount] = useState(0);

  return (
    <main className="app-shell">
      <p className="eyebrow">Bun + React + Nx</p>
      <h1>Client-only React example</h1>
      <p className="lede">
        Same source files, with Bun handling the dev server and the Nx build
        target bundling the client for production.
      </p>

      <div className="status-row">
        <span className="status-pill">HMR active</span>
        <span className="status-pill status-pill-muted">
          Reloads: {props.reloads}
        </span>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <span>Counter</span>
          <strong>{count}</strong>
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            Increment
          </button>
        </section>

        <section className="panel">
          <span>Hot reloads</span>
          <strong>{props.reloads}</strong>
          <code className="mono-line">
            {props.lastReloadedAt
              ? `last update ${props.lastReloadedAt}`
              : "first load"}
          </code>
          <p>
            Refresh any module in dev mode to see this number persist across
            reloads.
          </p>
        </section>
      </div>
    </main>
  );
}
