import { ExecutorContext } from "@nx/devkit";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  collectRuntimeDependencies,
  writeGeneratedPackageJson,
} from "./package-json";

type EntryPointInput = string | { name: string; path: string };

export interface BuildExecutorOptions {
  entry: string;
  outputPath: string;
  additionalEntryPoints?: EntryPointInput[];
  cliArgs?: string[];
  generatePackageJson?: boolean;
  external?: string[];
  format?: "esm" | "cjs" | "iife";
  minify?: boolean;
  sourcemap?: boolean | "inline" | "external";
  splitting?: boolean;
  target?: string;
  define?: Record<string, string>;
  naming?: string;
  publicPath?: string;
  bundle?: boolean;
  compile?: boolean;
  watch?: boolean;
}

interface NormalizedEntryPoint {
  name: string;
  sourcePath: string;
  shimPath: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateOptions(options: BuildExecutorOptions): void {
  if (!isNonEmptyString(options.entry)) {
    throw new Error('"entry" must be a non-empty string.');
  }

  if (!isNonEmptyString(options.outputPath)) {
    throw new Error('"outputPath" must be a non-empty string.');
  }

  if (options.additionalEntryPoints !== undefined) {
    if (!Array.isArray(options.additionalEntryPoints)) {
      throw new Error(
        '"additionalEntryPoints" must be an array when provided.',
      );
    }
  }

  if (options.cliArgs !== undefined) {
    if (
      !Array.isArray(options.cliArgs) ||
      !options.cliArgs.every((arg) => typeof arg === "string")
    ) {
      throw new Error('"cliArgs" must be an array of strings when provided.');
    }
  }

  if (
    options.generatePackageJson !== undefined &&
    typeof options.generatePackageJson !== "boolean"
  ) {
    throw new Error('"generatePackageJson" must be a boolean when provided.');
  }

  if (options.target !== undefined && !isNonEmptyString(options.target)) {
    throw new Error('"target" must be a non-empty string when provided.');
  }

  if (options.bundle !== undefined && typeof options.bundle !== "boolean") {
    throw new Error('"bundle" must be a boolean when provided.');
  }

  if (options.compile !== undefined && typeof options.compile !== "boolean") {
    throw new Error('"compile" must be a boolean when provided.');
  }

  if (options.bundle && options.compile) {
    throw new Error('"bundle" and "compile" cannot both be enabled.');
  }

  if (options.compile && options.publicPath) {
    throw new Error('"publicPath" is not supported when "compile" is enabled.');
  }
}

function getProjectRoot(context: ExecutorContext): string {
  const workspaceRoot = resolveWorkspaceRoot(context);
  const projectsConfigurations = (
    context as {
      projectsConfigurations?: { projects?: Record<string, { root: string }> };
    }
  ).projectsConfigurations;

  if (!context.projectName) {
    return workspaceRoot;
  }

  const projectRoot =
    projectsConfigurations?.projects?.[context.projectName]?.root;

  return projectRoot ? path.resolve(workspaceRoot, projectRoot) : workspaceRoot;
}

function resolveWorkspaceRoot(context: ExecutorContext): string {
  if (typeof context.root === "string" && context.root.length > 0) {
    let current = path.resolve(context.root);

    while (true) {
      if (fs.existsSync(path.join(current, "nx.json"))) {
        return current;
      }

      const parent = path.dirname(current);

      if (parent === current) {
        break;
      }

      current = parent;
    }

    return path.resolve(context.root);
  }

  return path.resolve(process.cwd());
}

function resolveProjectPath(
  projectRoot: string,
  workspaceRoot: string,
  value: string,
): string {
  if (path.isAbsolute(value)) {
    return value;
  }

  const projectRelativePath = path.resolve(projectRoot, value);

  if (fs.existsSync(projectRelativePath)) {
    return projectRelativePath;
  }

  const workspaceRelativePath = path.resolve(workspaceRoot, value);

  if (fs.existsSync(workspaceRelativePath)) {
    return workspaceRelativePath;
  }

  return projectRelativePath;
}

function resolveOutputPath(
  projectRoot: string,
  workspaceRoot: string,
  value: string,
): string {
  const resolved = value
    .replaceAll("{workspaceRoot}", workspaceRoot)
    .replaceAll("{projectRoot}", projectRoot);

  return path.isAbsolute(resolved)
    ? resolved
    : path.resolve(workspaceRoot, resolved);
}

function inferStem(filePath: string): string {
  const ext = path.extname(filePath);
  return path.basename(filePath, ext || undefined);
}

function normalizeEntryPoint(
  input: EntryPointInput,
  projectRoot: string,
  workspaceRoot: string,
): Omit<NormalizedEntryPoint, "shimPath"> {
  if (typeof input === "string") {
    const sourcePath = resolveProjectPath(projectRoot, workspaceRoot, input);
    return {
      name: inferStem(sourcePath),
      sourcePath,
    };
  }

  if (!isNonEmptyString(input.name)) {
    throw new Error(
      '"additionalEntryPoints[].name" must be a non-empty string.',
    );
  }

  if (path.isAbsolute(input.name) || input.name.split(/[\\/]/).includes("..")) {
    throw new Error(
      '"additionalEntryPoints[].name" must be a relative path without ".." segments.',
    );
  }

  if (!isNonEmptyString(input.path)) {
    throw new Error(
      '"additionalEntryPoints[].path" must be a non-empty string.',
    );
  }

  return {
    name: input.name,
    sourcePath: resolveProjectPath(projectRoot, workspaceRoot, input.path),
  };
}

function normalizeEntryPoints(
  options: BuildExecutorOptions,
  projectRoot: string,
  workspaceRoot: string,
): NormalizedEntryPoint[] {
  const normalized: Omit<NormalizedEntryPoint, "shimPath">[] = [
    normalizeEntryPoint(options.entry, projectRoot, workspaceRoot),
    ...(options.additionalEntryPoints ?? []).map((entryPoint) =>
      normalizeEntryPoint(entryPoint, projectRoot, workspaceRoot),
    ),
  ];

  const seen = new Set<string>();

  for (const entryPoint of normalized) {
    if (seen.has(entryPoint.name)) {
      throw new Error(
        `Duplicate normalized entry point name: ${entryPoint.name}`,
      );
    }
    seen.add(entryPoint.name);
  }

  return normalized.map((entryPoint) => ({
    ...entryPoint,
    shimPath: "",
  }));
}

function createEntryShims(
  entryPoints: NormalizedEntryPoint[],
  shimRoot: string,
): NormalizedEntryPoint[] {
  return entryPoints.map((entryPoint) => {
    const extension = path.extname(entryPoint.sourcePath) || ".ts";
    const shimPath = path.join(shimRoot, `${entryPoint.name}${extension}`);
    fs.mkdirSync(path.dirname(shimPath), { recursive: true });

    fs.writeFileSync(
      shimPath,
      `import ${JSON.stringify(entryPoint.sourcePath)};\n`,
      "utf8",
    );

    return {
      ...entryPoint,
      shimPath,
    };
  });
}

function generatePackageJsonIfRequested(
  options: BuildExecutorOptions,
  context: ExecutorContext,
  outputPath: string,
): void {
  if (!options.generatePackageJson) {
    return;
  }

  writeGeneratedPackageJson({
    context,
    outputPath,
    external: options.external,
  });
}

type BuildMode = "transpile" | "bundle" | "compile";

function appendCommonBuildArgs(
  args: string[],
  options: BuildExecutorOptions,
  externalDependencies: string[],
  mode: BuildMode,
): void {
  if (options.watch) {
    args.push("--watch");
  }

  for (const external of externalDependencies) {
    if (external) {
      args.push("--external", external);
    }
  }

  if (mode === "transpile") {
    args.push("--no-bundle");
  } else if (mode === "compile") {
    args.push("--compile");
  }

  if (options.format) {
    args.push("--format", options.format);
  }

  if (options.minify) {
    args.push("--minify");
  }

  if (options.sourcemap !== undefined) {
    args.push("--sourcemap", String(options.sourcemap));
  }

  if (options.splitting) {
    args.push("--splitting");
  }

  if (mode !== "compile" || options.target) {
    args.push("--target", options.target ?? "bun");
  }

  if (options.define) {
    for (const [key, value] of Object.entries(options.define)) {
      args.push("--define", `${key}=${value}`);
    }
  }

  if (options.naming) {
    args.push("--naming", options.naming);
  }

  if (options.publicPath) {
    args.push("--public-path", options.publicPath);
  }

  if (options.cliArgs) {
    args.push(...options.cliArgs);
  }
}

export function resolveBuildExternalDependencies(
  options: BuildExecutorOptions,
  context: ExecutorContext,
): string[] {
  if (options.target === "browser") {
    return options.external ?? [];
  }

  return Array.from(
    collectRuntimeDependencies({
      context,
      external: options.external,
    }).keys(),
  );
}

function resolveExternalDependencies(
  options: BuildExecutorOptions,
  context: ExecutorContext,
): string[] {
  if (options.compile) {
    return options.external ?? [];
  }

  return resolveBuildExternalDependencies(options, context);
}

export function buildCliArgs(
  entryPoint: NormalizedEntryPoint,
  outfile: string,
  options: BuildExecutorOptions,
  externalDependencies: string[],
): string[] {
  const args = ["build", entryPoint.shimPath];

  appendCommonBuildArgs(args, options, externalDependencies, "transpile");

  args.push("--outfile", outfile);

  return args;
}

function buildBundleCliArgs(
  entryPoints: NormalizedEntryPoint[],
  outdir: string,
  options: BuildExecutorOptions,
  externalDependencies: string[],
): string[] {
  const args = [
    "build",
    ...entryPoints.map((entryPoint) => entryPoint.shimPath),
  ];

  appendCommonBuildArgs(args, options, externalDependencies, "bundle");

  args.push("--outdir", outdir);

  return args;
}

export function buildExecutableCliArgs(
  entryPoint: NormalizedEntryPoint,
  outfile: string,
  options: BuildExecutorOptions,
  externalDependencies: string[],
): string[] {
  const args = ["build", entryPoint.shimPath];

  appendCommonBuildArgs(args, options, externalDependencies, "compile");

  args.push("--outfile", outfile);

  return args;
}

async function runCli(
  entryPoints: NormalizedEntryPoint[],
  workspaceRoot: string,
  outputPath: string,
  options: BuildExecutorOptions,
  externalDependencies: string[],
): Promise<boolean> {
  if (options.compile) {
    for (const entryPoint of entryPoints) {
      const outfile = path.join(outputPath, entryPoint.name);
      fs.mkdirSync(path.dirname(outfile), { recursive: true });

      const bun = spawn(
        "bun",
        buildExecutableCliArgs(
          entryPoint,
          outfile,
          options,
          externalDependencies,
        ),
        {
          cwd: workspaceRoot,
          stdio: "inherit",
        },
      );

      const success = await new Promise<boolean>((resolve) => {
        bun.once("error", (error) => {
          console.error(`[nx-bun] failed to start bun build: ${error.message}`);
          resolve(false);
        });

        bun.once("exit", (code) => {
          resolve(code === 0);
        });
      });

      if (!success) {
        return false;
      }
    }

    return true;
  }

  if (options.bundle) {
    const bun = spawn(
      "bun",
      buildBundleCliArgs(
        entryPoints,
        outputPath,
        options,
        externalDependencies,
      ),
      {
        cwd: workspaceRoot,
        stdio: "inherit",
      },
    );

    return new Promise((resolve) => {
      bun.once("error", (error) => {
        console.error(`[nx-bun] failed to start bun build: ${error.message}`);
        resolve(false);
      });

      bun.once("exit", (code) => {
        resolve(code === 0);
      });
    });
  }

  for (const entryPoint of entryPoints) {
    const outfile = path.join(outputPath, `${entryPoint.name}.js`);
    fs.mkdirSync(path.dirname(outfile), { recursive: true });

    const bun = spawn(
      "bun",
      buildCliArgs(entryPoint, outfile, options, externalDependencies),
      {
        cwd: workspaceRoot,
        stdio: "inherit",
      },
    );

    const success = await new Promise<boolean>((resolve) => {
      bun.once("error", (error) => {
        console.error(`[nx-bun] failed to start bun build: ${error.message}`);
        resolve(false);
      });

      bun.once("exit", (code) => {
        resolve(code === 0);
      });
    });

    if (!success) {
      return false;
    }
  }

  return true;
}

export default async function buildExecutor(
  options: BuildExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  validateOptions(options);

  const projectRoot = getProjectRoot(context);
  const workspaceRoot = resolveWorkspaceRoot(context);
  const outputPath = resolveOutputPath(
    projectRoot,
    workspaceRoot,
    options.outputPath,
  );

  const entryPoints = normalizeEntryPoints(options, projectRoot, workspaceRoot);
  const externalDependencies = resolveExternalDependencies(options, context);
  const shimRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nx-bun-build-"));
  const shims = createEntryShims(entryPoints, shimRoot);

  try {
    if (options.generatePackageJson) {
      generatePackageJsonIfRequested(options, context, outputPath);
    }

    return {
      success: await runCli(
        shims,
        workspaceRoot,
        outputPath,
        options,
        externalDependencies,
      ),
    };
  } finally {
    fs.rmSync(shimRoot, { recursive: true, force: true });
  }
}
