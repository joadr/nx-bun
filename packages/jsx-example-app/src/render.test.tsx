/** @jsxRuntime classic */
/** @jsx h */

import { expect, test } from 'bun:test';
import { Page } from './page';
import { h, renderToHtml } from './render';

test('renderToHtml renders nested JSX', () => {
    const html = renderToHtml(
        <section className="card">
            <h1>Hello</h1>
            <p>World</p>
        </section>,
    );

    expect(html).toContain('<section class="card">');
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<p>World</p>');
});

test('Page returns a full HTML document', () => {
    const html = renderToHtml(Page());

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('jsx-example-app');
    expect(html).toContain('Rendered from TSX inside the workspace.');
});
