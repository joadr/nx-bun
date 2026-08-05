import fs from "node:fs";
import path from "node:path";
import { ExecutorContext } from "@nx/devkit";

type PackageJson = Record<string, unknown> & {
  name?: string;
  version?: string;
  type?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  private?: boolean;
  license?: string;
  engines?: Record<string, string>;
};

type ProjectGraphLike = {
  nodes?: Record<string, { root?: string }>;
  dependencies?: Record<string, Array<{ target: string }>>;
  externalNodes?: Record<
    string,
    { data?: { packageName?: string; version?: string } }
  >;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPackageSpecifier(value: string): boolean {
  return (
    !value.startsWith(".") &&
    !value.startsWith("/") &&
    !value.startsWith("node:")
  );
}

function sortObjectByKeys(
  value: Record<string, string>,
): Record<string, string> {
  return Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .reduce(
      (sorted, key) => {
        sorted[key] = value[key];
        return sorted;
      },
      {} as Record<string, string>,
    );
}

function readPackageJson(packageJsonPath: string): PackageJson {
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJson;
}

function resolveDependencyVersion(
  rootPackageJson: PackageJson,
  packageName: string,
  versionHint?: string,
): string | undefined {
  return (
    rootPackageJson.dependencies?.[packageName] ??
    rootPackageJson.devDependencies?.[packageName] ??
    versionHint
  );
}

export function collectRuntimeDependencies(options: {
  context: ExecutorContext;
  external?: string[];
}): Map<string, string> {
  const workspaceRoot = path.resolve(options.context.root ?? ".");
  const rootPackageJsonPath = path.join(workspaceRoot, "package.json");
  const rootPackageJson = readPackageJson(rootPackageJsonPath);
  const projectGraph = (options.context as { projectGraph?: ProjectGraphLike })
    .projectGraph;

  const collected = new Map<string, string>();

  if (options.context.projectName && projectGraph) {
    const seenProjects = new Set<string>();

    const visit = (name: string): void => {
      if (seenProjects.has(name)) {
        return;
      }

      seenProjects.add(name);

      for (const dependency of projectGraph.dependencies?.[name] ?? []) {
        const target = dependency.target;
        const externalNode = projectGraph.externalNodes?.[target];

        if (externalNode?.data?.packageName && externalNode.data.version) {
          collected.set(
            externalNode.data.packageName,
            externalNode.data.version,
          );
          continue;
        }

        if (projectGraph.nodes?.[target]) {
          visit(target);
        }
      }
    };

    visit(options.context.projectName);
  } else {
    for (const [packageName, version] of Object.entries(
      rootPackageJson.dependencies ?? {},
    )) {
      collected.set(packageName, version);
    }
  }

  for (const external of collectExplicitExternalDependencies(
    options.external,
  )) {
    const version = resolveDependencyVersion(rootPackageJson, external);

    if (isNonEmptyString(version)) {
      collected.set(external, version);
    }
  }

  return collected;
}

function collectExplicitExternalDependencies(
  optionsExternal: string[] | undefined,
): string[] {
  return (optionsExternal ?? []).filter(isPackageSpecifier);
}

export function writeGeneratedPackageJson(options: {
  context: ExecutorContext;
  outputPath: string;
  external?: string[];
}): void {
  const workspaceRoot = path.resolve(options.context.root ?? ".");
  const rootPackageJsonPath = path.join(workspaceRoot, "package.json");
  const rootPackageJson = readPackageJson(rootPackageJsonPath);
  const runtimeDependencies = collectRuntimeDependencies({
    context: options.context,
    external: options.external,
  });

  const dependencies = sortObjectByKeys(
    Object.fromEntries(runtimeDependencies),
  );
  const generatedPackageJson: PackageJson = {
    name: rootPackageJson.name ?? options.context.projectName ?? "package",
    version: rootPackageJson.version ?? "0.0.1",
    ...(rootPackageJson.type ? { type: rootPackageJson.type } : {}),
    ...(rootPackageJson.packageManager
      ? { packageManager: rootPackageJson.packageManager }
      : {}),
    ...(rootPackageJson.private !== undefined
      ? { private: rootPackageJson.private }
      : {}),
    ...(rootPackageJson.license ? { license: rootPackageJson.license } : {}),
    ...(rootPackageJson.engines ? { engines: rootPackageJson.engines } : {}),
    dependencies,
  };

  const packageJsonPath = path.join(options.outputPath, "package.json");
  fs.mkdirSync(options.outputPath, { recursive: true });
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(generatedPackageJson, null, 2)}\n`,
    "utf8",
  );
}
