import { ExecutorContext } from '@nx/devkit';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type EntryPointInput = string | { name: string; path: string };

export interface BuildExecutorOptions {
    entry: string;
    outputPath: string;
    additionalEntryPoints?: EntryPointInput[];
    external?: string[];
    format?: 'esm' | 'cjs' | 'iife';
    minify?: boolean;
    sourcemap?: boolean | 'inline' | 'external';
    splitting?: boolean;
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
    return typeof value === 'string' && value.trim().length > 0;
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
            throw new Error('"additionalEntryPoints" must be an array when provided.');
        }
    }
}

function getProjectRoot(context: ExecutorContext): string {
    const workspaceRoot = path.resolve(context.root ?? '.');
    const projectsConfigurations = (context as {
        projectsConfigurations?: { projects?: Record<string, { root: string }> };
    }).projectsConfigurations;

    if (!context.projectName) {
        return workspaceRoot;
    }

    const projectRoot = projectsConfigurations?.projects?.[context.projectName]?.root;

    return projectRoot ? path.resolve(workspaceRoot, projectRoot) : workspaceRoot;
}

function resolveProjectPath(projectRoot: string, value: string): string {
    return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

function inferStem(filePath: string): string {
    const ext = path.extname(filePath);
    return path.basename(filePath, ext || undefined);
}

function normalizeEntryPoint(input: EntryPointInput, projectRoot: string): Omit<NormalizedEntryPoint, 'shimPath'> {
    if (typeof input === 'string') {
        const sourcePath = resolveProjectPath(projectRoot, input);
        return {
            name: inferStem(sourcePath),
            sourcePath,
        };
    }

    if (!isNonEmptyString(input.name)) {
        throw new Error('"additionalEntryPoints[].name" must be a non-empty string.');
    }

    if (path.isAbsolute(input.name) || input.name.split(/[\\/]/).includes('..')) {
        throw new Error('"additionalEntryPoints[].name" must be a relative path without ".." segments.');
    }

    if (!isNonEmptyString(input.path)) {
        throw new Error('"additionalEntryPoints[].path" must be a non-empty string.');
    }

    return {
        name: input.name,
        sourcePath: resolveProjectPath(projectRoot, input.path),
    };
}

function normalizeEntryPoints(options: BuildExecutorOptions, projectRoot: string): NormalizedEntryPoint[] {
    const normalized: Omit<NormalizedEntryPoint, 'shimPath'>[] = [
        normalizeEntryPoint(options.entry, projectRoot),
        ...((options.additionalEntryPoints ?? []).map((entryPoint) => normalizeEntryPoint(entryPoint, projectRoot))),
    ];

    const seen = new Set<string>();

    for (const entryPoint of normalized) {
        if (seen.has(entryPoint.name)) {
            throw new Error(`Duplicate normalized entry point name: ${entryPoint.name}`);
        }
        seen.add(entryPoint.name);
    }

    return normalized.map((entryPoint) => ({
        ...entryPoint,
        shimPath: '',
    }));
}

function createEntryShims(entryPoints: NormalizedEntryPoint[], shimRoot: string): NormalizedEntryPoint[] {
    return entryPoints.map((entryPoint) => {
        const extension = path.extname(entryPoint.sourcePath) || '.ts';
        const shimPath = path.join(shimRoot, `${entryPoint.name}${extension}`);
        fs.mkdirSync(path.dirname(shimPath), { recursive: true });

        fs.writeFileSync(shimPath, `import ${JSON.stringify(entryPoint.sourcePath)};\n`, 'utf8');

        return {
            ...entryPoint,
            shimPath,
        };
    });
}

function buildCliArgs(entryPoints: NormalizedEntryPoint[], outputPath: string, options: BuildExecutorOptions): string[] {
    const args = ['build', ...entryPoints.map((entryPoint) => entryPoint.shimPath)];

    if (options.watch) {
        args.push('--watch');
    }

    if (options.external) {
        for (const external of options.external) {
            args.push('--external', external);
        }
    }

    if (options.format) {
        args.push('--format', options.format);
    }

    if (options.minify) {
        args.push('--minify');
    }

    if (options.sourcemap !== undefined) {
        args.push('--sourcemap', String(options.sourcemap));
    }

    if (options.splitting) {
        args.push('--splitting');
    }

    if (options.define) {
        for (const [key, value] of Object.entries(options.define)) {
            args.push('--define', `${key}=${value}`);
        }
    }

    if (options.naming) {
        args.push('--naming', options.naming);
    }

    if (options.publicPath) {
        args.push('--public-path', options.publicPath);
    }

    args.push('--outdir', outputPath);

    return args;
}

async function runCli(entryPoints: NormalizedEntryPoint[], outputPath: string, options: BuildExecutorOptions, projectRoot: string): Promise<boolean> {
    const bun = spawn('bun', buildCliArgs(entryPoints, outputPath, options), {
        cwd: projectRoot,
        stdio: 'inherit',
    });

    return new Promise((resolve) => {
        bun.once('error', (error) => {
            console.error(`[nx-bun] failed to start bun build: ${error.message}`);
            resolve(false);
        });

        bun.once('exit', (code) => {
            resolve(code === 0);
        });
    });
}

async function runApi(entryPoints: NormalizedEntryPoint[], outputPath: string, options: BuildExecutorOptions): Promise<boolean> {
    const bun = (globalThis as { Bun?: { build?: (input: unknown) => Promise<{ success: boolean; logs?: Array<{ message?: string }> }> } }).Bun;

    if (!bun?.build) {
        return false;
    }

    const result = await bun.build({
        entrypoints: entryPoints.map((entryPoint) => entryPoint.shimPath),
        outdir: outputPath,
        external: options.external,
        format: options.format,
        minify: options.minify,
        sourcemap: options.sourcemap,
        splitting: options.splitting,
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
    const outputPath = path.isAbsolute(options.outputPath) ? options.outputPath : path.resolve(projectRoot, options.outputPath);
    const entryPoints = normalizeEntryPoints(options, projectRoot);
    const shimRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-bun-build-'));
    const shims = createEntryShims(entryPoints, shimRoot);

    try {
        if (options.useCli || options.watch) {
            return { success: await runCli(shims, outputPath, options, projectRoot) };
        }

        const success = await runApi(shims, outputPath, options);

        if (!success && !options.useCli) {
            return { success: await runCli(shims, outputPath, options, projectRoot) };
        }

        return { success };
    } finally {
        fs.rmSync(shimRoot, { recursive: true, force: true });
    }
}
