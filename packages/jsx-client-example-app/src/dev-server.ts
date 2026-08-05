import homepage from "./index.dev.html";

const port = Number(Bun.env.PORT ?? 3000);

Bun.serve({
  port,
  development: true,
  routes: {
    "/": homepage,
  },
});

console.log(`Running on http://localhost:${port}`);
