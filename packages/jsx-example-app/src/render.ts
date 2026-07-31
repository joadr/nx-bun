export type Child = NodeLike | string | number | boolean | null | undefined | Child[];

export interface NodeLike {
    type: string | ((props: Record<string, unknown>) => Child);
    props: Record<string, unknown>;
    children: Child[];
}

export function h(type: NodeLike['type'], props: Record<string, unknown> | null = {}, ...children: Child[]): NodeLike {
    return { type, props: props ?? {}, children };
}

export function Fragment(props: { children?: Child[] }): Child[] {
    return props.children ?? [];
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function renderAttributes(props: Record<string, unknown>): string {
    const normalizedProps = props ?? {};
    const attributes: string[] = [];

    for (const [key, value] of Object.entries(normalizedProps)) {
        if (key === 'children' || value === undefined || value === null || value === false) {
            continue;
        }

        const name = key === 'className' ? 'class' : key === 'charSet' ? 'charset' : key;

        if (value === true) {
            attributes.push(name);
            continue;
        }

        attributes.push(`${name}="${escapeHtml(String(value))}"`);
    }

    return attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
}

const voidElements = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);

export function renderToHtml(node: Child): string {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }

    if (Array.isArray(node)) {
        return node.map(renderToHtml).join('');
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return escapeHtml(String(node));
    }

    if (typeof node.type === 'function') {
        return renderToHtml(node.type(node.props));
    }

    const attributes = renderAttributes(node.props);

    if (voidElements.has(node.type)) {
        return `<${node.type}${attributes}>`;
    }

    return `<${node.type}${attributes}>${node.children.map(renderToHtml).join('')}</${node.type}>`;
}
