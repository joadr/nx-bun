import { ExecutorContext } from "@nx/devkit";
import { parseTargetString } from "@nx/devkit";
import fs from "node:fs";
import path from "node:path";
import { runBuildTarget } from "../shared/build-target";
import {
  buildCommandArguments,
  executeBunCommand,
  formatCommand,
  mergeEnvironment,
  resolveBunBinary,
  resolveWorkingDirectory,
  RunExecutorOptions,
  validateOptions,
} from "./run-utils";

export function resolveEntryFromBuildTarget(
  buildTarget: string,
  context: ExecutorContext,
): string | undefined {
  const targetDescription = parseTargetString(buildTarget, context);
  const projectsConfigurations = (
    context as {
      projectsConfigurations?: {
        projects?: Record<
          string,
          {
            root: string;
            targets?: Record<
              string,
              { outputs?: string[]; options?: { outputPath?: string } }
            >;
          }
        >;
      };
    }
  ).projectsConfigurations;
  const project = projectsConfigurations?.projects?.[targetDescription.project];
  const target = project?.targets?.[targetDescription.target];
  const outputs = target?.outputs ?? [];

  if (outputs.length === 0) {
    return undefined;
  }

  const workspaceRoot = path.resolve(context.root ?? ".");
  const projectRoot = path.resolve(workspaceRoot, project?.root ?? ".");
  const outputPath = target?.options?.outputPath;

  for (const output of outputs) {
    const resolved = output
      .replaceAll("{workspaceRoot}", workspaceRoot)
      .replaceAll("{projectRoot}", projectRoot)
      .replaceAll("{options.outputPath}", outputPath ?? "");
    const candidate = path.isAbsolute(resolved)
      ? resolved
      : path.resolve(workspaceRoot, resolved);

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      const mainJs = path.join(candidate, "main.js");
      const indexJs = path.join(candidate, "index.js");

      if (fs.existsSync(mainJs)) {
        return mainJs;
      }

      if (fs.existsSync(indexJs)) {
        return indexJs;
      }
    }

    if (
      candidate.endsWith(".js") ||
      candidate.endsWith(".mjs") ||
      candidate.endsWith(".cjs")
    ) {
      return candidate;
    }
  }

  return undefined;
}

async function waitForEntryFromBuildTarget(
  buildTarget: string,
  context: ExecutorContext,
  timeoutMs = 30000,
): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const resolvedEntry = resolveEntryFromBuildTarget(buildTarget, context);

    if (resolvedEntry) {
      return resolvedEntry;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return undefined;
}

export default async function runExecutor(
  options: RunExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  validateOptions(options);

  if (options.buildTarget && !options.watch) {
    const buildSuccess = await runBuildTarget(options.buildTarget, context);

    if (!buildSuccess) {
      return { success: false };
    }
  }

  const resolvedEntry = options.entry
    ? options.entry
    : options.buildTarget
      ? options.watch
        ? await waitForEntryFromBuildTarget(options.buildTarget, context)
        : resolveEntryFromBuildTarget(options.buildTarget, context)
      : undefined;

  if (!options.script && !resolvedEntry) {
    throw new Error(
      options.buildTarget
        ? `Unable to infer a Bun entry point from build target "${options.buildTarget}" outputs.`
        : "A Bun entry point could not be resolved.",
    );
  }

  const bunBinary = resolveBunBinary(options);
  const commandArgs = buildCommandArguments({
    ...options,
    entry: resolvedEntry,
  });
  const cwd = resolveWorkingDirectory(options, context);
  const env = mergeEnvironment(options);

  console.log(`[nx-bun] running: ${formatCommand(bunBinary, commandArgs)}`);
  console.log(`[nx-bun] cwd: ${cwd}`);

  const success = await executeBunCommand({
    bunBinary,
    commandArguments: commandArgs,
    cwd,
    env,
  });

  return { success };
}
