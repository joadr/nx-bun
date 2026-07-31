import { Page } from './page';
import { renderToHtml } from './render';

const port = Number(Bun.env.PORT ?? 3000);

Bun.serve({
    port,
    fetch(): Response {
        return new Response(`<!doctype html>${renderToHtml(Page())}`, {
            headers: {
                'content-type': 'text/html; charset=utf-8',
            },
        });
    },
});

console.log(`Running on http://localhost:${port}`);
