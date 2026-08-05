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
  useCli?: boolean;
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
}

function getProjectRoot(context: ExecutorContext): string {
  const workspaceRoot = path.resolve(context.root ?? ".");
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

export function buildCliArgs(
  entryPoints: NormalizedEntryPoint[],
  outputPath: string,
  options: BuildExecutorOptions,
  externalDependencies: string[],
): string[] {
  const args = [
    "build",
    ...entryPoints.map((entryPoint) => entryPoint.shimPath),
  ];

  if (options.watch) {
    args.push("--watch");
  }

  for (const external of externalDependencies) {
    if (external) {
      args.push("--external", external);
    }
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

  args.push("--target", options.target ?? "bun");

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

  args.push("--outdir", outputPath);

  return args;
}

async function runCli(
  entryPoints: NormalizedEntryPoint[],
  outputPath: string,
  options: BuildExecutorOptions,
  projectRoot: string,
  externalDependencies: string[],
): Promise<boolean> {
  const bun = spawn(
    "bun",
    buildCliArgs(entryPoints, outputPath, options, externalDependencies),
    {
      cwd: projectRoot,
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

async function runApi(
  entryPoints: NormalizedEntryPoint[],
  outputPath: string,
  options: BuildExecutorOptions,
  context: ExecutorContext,
): Promise<boolean> {
  const bun = (
    globalThis as {
      Bun?: {
        build?: (
          input: unknown,
        ) => Promise<{ success: boolean; logs?: Array<{ message?: string }> }>;
      };
    }
  ).Bun;

  if (!bun?.build) {
    return false;
  }

  const result = await bun.build({
    entrypoints: entryPoints.map((entryPoint) => entryPoint.shimPath),
    outdir: outputPath,
    external: resolveBuildExternalDependencies(options, context),
    format: options.format,
    minify: options.minify,
    sourcemap: options.sourcemap,
    splitting: options.splitting,
    target: options.target ?? "bun",
    define: options.define,
    naming: options.naming,
    publicPath: options.publicPath,
  });

  for (const log of result.logs ?? []) {
    if (log?.message) {
      console.log(log.message);
    }
  }

  return Boolean((result as { success?: boolean }).success ?? true);
}

export default async function buildExecutor(
  options: BuildExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  validateOptions(options);

  const projectRoot = getProjectRoot(context);
  const outputPath = path.isAbsolute(options.outputPath)
    ? options.outputPath
    : path.resolve(projectRoot, options.outputPath);
  const entryPoints = normalizeEntryPoints(
    options,
    projectRoot,
    path.resolve(context.root ?? "."),
  );
  const externalDependencies = resolveBuildExternalDependencies(
    options,
    context,
  );
  const shimRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nx-bun-build-"));
  const shims = createEntryShims(entryPoints, shimRoot);

  try {
    if (options.generatePackageJson) {
      generatePackageJsonIfRequested(options, context, outputPath);
    }

    if (options.useCli || options.watch) {
      return {
        success: await runCli(
          shims,
          outputPath,
          options,
          projectRoot,
          externalDependencies,
        ),
      };
    }

    const success = await runApi(shims, outputPath, options, context);

    if (!success && !options.useCli) {
      return {
        success: await runCli(
          shims,
          outputPath,
          options,
          projectRoot,
          externalDependencies,
        ),
      };
    }

    return { success };
  } finally {
    fs.rmSync(shimRoot, { recursive: true, force: true });
  }
}
