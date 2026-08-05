export {};

declare global {
  interface ImportMeta {
    hot?: {
      data: Record<string, unknown>;
      dispose(callback: (data: Record<string, unknown>) => void): void;
      accept(): void;
    };
  }
}
