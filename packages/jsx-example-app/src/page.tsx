/** @jsxRuntime classic */
/** @jsx h */

import { h } from './render';

type Feature = {
  title: string;
  body: string;
  accent: string;
};

type Metric = {
  value: string;
  label: string;
};

const features: Feature[] = [
  {
    title: 'Reusable components',
    body: 'Hero, card, and footer sections are built as small TSX components.',
    accent: 'linear-gradient(135deg, #22d3ee, #0ea5e9)',
  },
  {
    title: 'Data-driven UI',
    body: 'The feature grid is rendered from an array with `.map()`, not hard-coded markup.',
    accent: 'linear-gradient(135deg, #a855f7, #ec4899)',
  },
  {
    title: 'Server rendered',
    body: 'Bun turns the TSX tree into HTML and serves it directly from the Nx workspace.',
    accent: 'linear-gradient(135deg, #fbbf24, #f97316)',
  },
];

const metrics: Metric[] = [
  { value: '3', label: 'components' },
  { value: '1', label: 'render pass' },
  { value: '0', label: 'React dependency' },
];

const styles = `
  :root {
    color-scheme: dark;
    font-family: Inter, system-ui, sans-serif;
    background:
      radial-gradient(circle at top left, rgba(34, 211, 238, 0.22), transparent 30%),
      radial-gradient(circle at top right, rgba(168, 85, 247, 0.2), transparent 28%),
      linear-gradient(180deg, #020617, #0f172a 45%, #111827);
    color: #e2e8f0;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
  }

  a {
    color: inherit;
  }

  .shell {
    width: min(1100px, calc(100vw - 2rem));
    margin: 0 auto;
    padding: 2rem 0 3rem;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 3rem;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .brand-mark {
    width: 2rem;
    height: 2rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #22d3ee, #a855f7);
    box-shadow: 0 12px 30px rgba(34, 211, 238, 0.22);
  }

  .badge {
    padding: 0.45rem 0.8rem;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.55);
    font-size: 0.9rem;
    color: #cbd5e1;
  }

  .hero {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1.3fr 0.9fr;
    align-items: stretch;
    margin-bottom: 2rem;
  }

  .hero-card,
  .aside-card,
  .feature-card,
  .footer-card {
    border: 1px solid rgba(148, 163, 184, 0.16);
    background: rgba(15, 23, 42, 0.64);
    backdrop-filter: blur(18px);
    border-radius: 1.5rem;
    box-shadow: 0 24px 80px rgba(2, 6, 23, 0.28);
  }

  .hero-card {
    padding: clamp(1.5rem, 4vw, 3rem);
  }

  .kicker {
    display: inline-flex;
    padding: 0.35rem 0.7rem;
    margin-bottom: 1rem;
    border-radius: 999px;
    font-size: 0.82rem;
    color: #67e8f9;
    background: rgba(8, 145, 178, 0.14);
  }

  h1 {
    margin: 0;
    font-size: clamp(2.6rem, 8vw, 5.5rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .lede {
    max-width: 34rem;
    margin: 1.1rem 0 0;
    font-size: 1.07rem;
    line-height: 1.7;
    color: #cbd5e1;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.6rem;
  }

  .button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.8rem 1.1rem;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 600;
    border: 1px solid transparent;
  }

  .button-primary {
    color: #020617;
    background: linear-gradient(135deg, #67e8f9, #c084fc);
  }

  .button-secondary {
    border-color: rgba(148, 163, 184, 0.25);
    background: rgba(15, 23, 42, 0.4);
  }

  .aside-card {
    padding: 1.25rem;
    display: grid;
    gap: 1rem;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .metric {
    padding: 1rem;
    border-radius: 1rem;
    background: rgba(30, 41, 59, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.12);
  }

  .metric-value {
    font-size: 1.6rem;
    font-weight: 700;
  }

  .metric-label {
    margin-top: 0.25rem;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .code-panel {
    padding: 1.2rem;
    border-radius: 1rem;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.82));
    border: 1px solid rgba(148, 163, 184, 0.14);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #93c5fd;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .section-title {
    margin: 2rem 0 1rem;
    font-size: 1rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .feature-card {
    padding: 1.25rem;
  }

  .feature-accent {
    width: 3rem;
    height: 0.4rem;
    border-radius: 999px;
    margin-bottom: 1rem;
  }

  .feature-card h2 {
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
  }

  .feature-card p {
    margin: 0;
    line-height: 1.65;
    color: #cbd5e1;
  }

  .footer-card {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  .footer-card p {
    margin: 0;
    color: #cbd5e1;
  }

  @media (max-width: 840px) {
    .hero,
    .feature-grid,
    .footer-card {
      grid-template-columns: 1fr;
      display: grid;
    }

    .topbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .metric-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function AppHeader() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" />
        <span>jsx-example-app</span>
      </div>
      <span className="badge">Bun + TSX + Nx</span>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-card">
        <span className="kicker">TSX rendered on the server</span>
        <h1>Build a page with JSX components, not a string.</h1>
        <p className="lede">
          This example shows what JSX is good at: composing reusable pieces,
          passing props, and rendering lists from data while keeping the app
          tiny and dependency-free.
        </p>
        <div className="actions">
          <a className="button button-primary" href="https://bun.sh">
            Learn Bun
          </a>
          <a className="button button-secondary" href="https://nx.dev">
            Nx workspace
          </a>
        </div>
      </div>

      <aside className="aside-card">
        <div className="metric-grid">
          {metrics.map((metric) => (
            <div className="metric">
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="code-panel">{`const features = [
  { title: 'Reusable components' },
  { title: 'Data-driven UI' },
  { title: 'Server rendered' },
];`}</div>
      </aside>
    </section>
  );
}

function FeatureCard(feature: Feature) {
  return (
    <article className="feature-card">
      <div
        className="feature-accent"
        style={`background: ${feature.accent};`}
      />
      <h2>{feature.title}</h2>
      <p>{feature.body}</p>
    </article>
  );
}

function Footer() {
  return (
    <footer className="footer-card">
      <p>Rendered from TSX inside the workspace. No React runtime required.</p>
      <p>
        Open `packages/jsx-example-app/src/page.tsx` to see the composition.
      </p>
    </footer>
  );
}

export function Page() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>jsx-example-app</title>
        <style>{styles}</style>
      </head>
      <body>
        <div className="shell">
          <AppHeader />
          <Hero />

          <h2 className="section-title">Why this example matters</h2>
          <section className="feature-grid">
            {features.map((feature) => FeatureCard(feature))}
          </section>

          <Footer />
        </div>
      </body>
    </html>
  );
}
