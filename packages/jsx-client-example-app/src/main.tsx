/** @jsxImportSource react */

import { createRoot } from "react-dom/client";
import { App } from "./App";

type HotData = {
  reloads?: number;
  lastReloadedAt?: string;
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Missing root element with id "root".');
}

const root = createRoot(rootElement);
const reloads = import.meta.hot
  ? ((import.meta.hot.data as HotData).reloads ?? 0)
  : 0;
const lastReloadedAt = import.meta.hot
  ? ((import.meta.hot.data as HotData).lastReloadedAt ?? null)
  : null;

function render(): void {
  root.render(<App reloads={reloads} lastReloadedAt={lastReloadedAt} />);
}

render();

if (import.meta.hot) {
  import.meta.hot.dispose((data: HotData) => {
    data.reloads = reloads + 1;
    data.lastReloadedAt = new Date().toISOString();
  });

  import.meta.hot.accept();
}
