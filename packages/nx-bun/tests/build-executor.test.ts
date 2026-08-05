import { expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import buildExecutor, {
  buildCliArgs,
  buildExecutableCliArgs,
  resolveBuildExternalDependencies,
} from "../src/executors/build/executor";

function makeTempProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nx-bun-build-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, "db", "migrations"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "package.json"),
    '{\n  "name": "temp-project"\n}\n',
    "utf8",
  );

  fs.writeFileSync(
    path.join(root, "src", "main.ts"),
    "console.log('hello from build');\n",
    "utf8",
  );
  fs.writeFileSync(
    path.join(root, "src", "index.prod.html"),
    '<!doctype html><html><body><div id="root"></div></body></html>\n',
    "utf8",
  );
  fs.writeFileSync(
    path.join(root, "db", "migrations", "Migration20250331154716.ts"),
    "console.log('hello from migration');\n",
    "utf8",
  );

  return root;
}

function makeNestedTempProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nx-bun-build-"));
  fs.mkdirSync(path.join(root, "apps", "accounts", "src"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "package.json"),
    '{\n  "name": "temp-project"\n}\n',
    "utf8",
  );

  fs.writeFileSync(
    path.join(root, "apps", "accounts", "src", "main.ts"),
    "console.log('hello from nested build');\n",
    "utf8",
  );

  return root;
}

function makeContext(root: string, projectRoot = ".") {
  return {
    root,
    projectName: "temp-project",
    projectsConfigurations: {
      projects: {
        "temp-project": {
          root: projectRoot,
        },
      },
    },
  } as never;
}

test("build executor writes transpiled output", async () => {
  const root = makeTempProject();

  const result = await buildExecutor(
    {
      entry: "src/main.ts",
      additionalEntryPoints: [
        {
          name: "db/migrations/migration0",
          path: "db/migrations/Migration20250331154716.ts",
        },
      ],
      outputPath: "dist",
    },
    makeContext(root),
  );

  expect(result.success).toBe(true);
  expect(fs.existsSync(path.join(root, "dist", "main.js"))).toBe(true);
  expect(
    fs.existsSync(path.join(root, "dist", "db", "migrations", "migration0.js")),
  ).toBe(true);
});

test("build executor can be forced to use the CLI", async () => {
  const root = makeTempProject();

  const result = await buildExecutor(
    {
      entry: "src/main.ts",
      additionalEntryPoints: ["db/migrations/Migration20250331154716.ts"],
      outputPath: "dist",
    },
    makeContext(root),
  );

  expect(result.success).toBe(true);
  expect(fs.existsSync(path.join(root, "dist", "main.js"))).toBe(true);
  expect(
    fs.existsSync(path.join(root, "dist", "Migration20250331154716.js")),
  ).toBe(true);
});

test("build executor accepts workspace-root-relative entry paths", async () => {
  const root = makeNestedTempProject();

  const result = await buildExecutor(
    {
      entry: "apps/accounts/src/main.ts",
      outputPath: "dist",
    },
    makeContext(root, "apps/accounts"),
  );

  expect(result.success).toBe(true);
  expect(fs.existsSync(path.join(root, "dist", "main.js"))).toBe(true);
});

test("build executor resolves workspaceRoot placeholders in outputPath", async () => {
  const root = makeNestedTempProject();

  const result = await buildExecutor(
    {
      entry: "apps/accounts/src/main.ts",
      outputPath: "{workspaceRoot}/dist/apps/accounts",
    },
    makeContext(root, "apps/accounts"),
  );

  expect(result.success).toBe(true);
  expect(
    fs.existsSync(path.join(root, "dist", "apps", "accounts", "main.js")),
  ).toBe(true);
});

test("build executor can bundle when requested", async () => {
  const root = makeTempProject();

  const result = await buildExecutor(
    {
      entry: "src/main.ts",
      additionalEntryPoints: [
        {
          name: "db/migrations/migration0",
          path: "db/migrations/Migration20250331154716.ts",
        },
      ],
      outputPath: "dist",
      bundle: true,
    },
    makeContext(root),
  );

  expect(result.success).toBe(true);
  expect(fs.existsSync(path.join(root, "dist", "main.js"))).toBe(true);
  expect(
    fs.existsSync(path.join(root, "dist", "db", "migrations", "migration0.js")),
  ).toBe(true);
});

test("build executor can compile executables when requested", async () => {
  const root = makeTempProject();

  const result = await buildExecutor(
    {
      entry: "src/main.ts",
      outputPath: "dist",
      compile: true,
    },
    makeContext(root),
  );

  expect(result.success).toBe(true);
  expect(fs.existsSync(path.join(root, "dist", "main"))).toBe(true);
});

test("build executor copies declared assets", async () => {
  const root = makeTempProject();

  const result = await buildExecutor(
    {
      entry: "src/main.ts",
      outputPath: "dist",
      bundle: true,
      target: "browser",
      assets: [{ input: "src/index.prod.html", output: "index.html" }],
    },
    makeContext(root),
  );

  expect(result.success).toBe(true);
  expect(fs.existsSync(path.join(root, "dist", "index.html"))).toBe(true);
});

test("build executor defaults CLI target to bun", () => {
  const args = buildCliArgs(
    {
      name: "main",
      sourcePath: "/tmp/main.ts",
      shimPath: "/tmp/shims/main.ts",
    },
    "/tmp/out/main.js",
    {
      entry: "src/main.ts",
      outputPath: "dist",
    },
    [],
  );

  expect(args).toContain("--target");
  expect(args).toContain("bun");
});

test("build executor emits compile args", () => {
  const args = buildExecutableCliArgs(
    {
      name: "main",
      sourcePath: "/tmp/main.ts",
      shimPath: "/tmp/shims/main.ts",
    },
    "/tmp/out/main",
    {
      entry: "src/main.ts",
      outputPath: "dist",
      compile: true,
    },
    [],
  );

  expect(args).toContain("--compile");
  expect(args).toContain("--outfile");
  expect(args).toContain("/tmp/out/main");
});

test("build executor infers runtime externals by default", () => {
  const root = makeTempProject();

  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "temp-project",
      dependencies: { leftpad: "1.3.0" },
    }),
    "utf8",
  );

  const externalDependencies = resolveBuildExternalDependencies(
    {
      entry: "src/main.ts",
      outputPath: "dist",
    },
    makeContext(root),
  );

  expect(externalDependencies).toContain("leftpad");
});
