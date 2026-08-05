import { expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import buildExecutor from "../src/executors/build/executor";

function makeTempProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nx-bun-build-"));
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.mkdirSync(path.join(root, "db", "migrations"), { recursive: true });

  fs.writeFileSync(
    path.join(root, "src", "main.ts"),
    "console.log('hello from build');\n",
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

test("build executor uses Bun.build when available", async () => {
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
      useCli: true,
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
  expect(
    fs.existsSync(path.join(root, "apps", "accounts", "dist", "main.js")),
  ).toBe(true);
});
