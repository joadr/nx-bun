export {};

declare global {
  const Bun: {
    env: Record<string, string | undefined>;
    serve(options: {
      port?: number;
      development?: boolean;
      routes?: Record<string, unknown>;
    }): unknown;
  };
}
