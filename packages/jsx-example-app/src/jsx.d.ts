export {};

declare global {
    namespace JSX {
        type Element = import('./render').Child;

        interface ElementClass {}

        interface ElementAttributesProperty {
            props: {};
        }

        interface ElementChildrenAttribute {
            children: {};
        }

        interface IntrinsicElements {
            [elemName: string]: Record<string, unknown>;
        }
    }
}
