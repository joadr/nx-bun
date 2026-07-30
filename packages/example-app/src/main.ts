console.log('example-app: hello from Bun!');

Bun.serve({
  port: 8080,
  async fetch(request: Request): Promise<Response> {
    return new Response('Hello World from bun!');
  },
});

console.log(`Running on port http://localhost:8080`);
