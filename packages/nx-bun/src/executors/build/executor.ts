import { ExecutorContext } from '@nx/devkit';
import { spawn } from 'node:child_process';
import path from 'node:path';

export interface BuildExecutorOptions {
    entrypoints: string[];
    outputPath: string;
    external?: string[];
    format?: 'esm' | 'cjs' | 'iife';
    minify?: boolean;
    sourcemap?: boolean | 'inline' | 'external';
    splitting?: boolean;
    target?: string;
    define?: Record<string, string>;
    naming?: string;
    publicPath?: string;
    useCli?: boolean;
    watch?: boolean;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateOptions(options: BuildExecutorOptions): void {
    if (!Array.isArray(options.entrypoints) || options.entrypoints.length === 0 || options.entrypoints.some((v) => !isNonEmptyString(v))) {
        throw new Error('"entrypoints" must be a non-empty array of strings.');
    }

    if (!isNonEmptyString(options.outputPath)) {
        throw new Error('"outputPath" must be a non-empty string.');
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

function resolveOutputPath(options: BuildExecutorOptions, context: ExecutorContext): string {
    const projectRoot = getProjectRoot(context);

    return path.isAbsolute(options.outputPath) ? options.outputPath : path.resolve(projectRoot, options.outputPath);
}

function resolveEntrypoints(options: BuildExecutorOptions, context: ExecutorContext): string[] {
    const projectRoot = getProjectRoot(context);

    return options.entrypoints.map((entrypoint) =>
        path.isAbsolute(entrypoint) ? entrypoint : path.resolve(projectRoot, entrypoint),
    );
}

function buildCliArgs(options: BuildExecutorOptions): string[] {
    const args = ['build', ...options.entrypoints];

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

    if (options.target) {
        args.push('--target', options.target);
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

    args.push('--outdir', options.outputPath);

    return args;
}

async function runCli(options: BuildExecutorOptions, context: ExecutorContext): Promise<boolean> {
    const bun = spawn('bun', buildCliArgs({ ...options, entrypoints: resolveEntrypoints(options, context) }), {
        cwd: getProjectRoot(context),
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

async function runApi(options: BuildExecutorOptions, context: ExecutorContext): Promise<boolean> {
    const bun = (globalThis as { Bun?: { build?: (input: unknown) => Promise<{ success: boolean; logs?: Array<{ message?: string }> }> } }).Bun;

    if (!bun?.build) {
        return false;
    }

    const result = await bun.build({
        entrypoints: resolveEntrypoints(options, context),
        outdir: resolveOutputPath(options, context),
        external: options.external,
        format: options.format,
        minify: options.minify,
        sourcemap: options.sourcemap,
        splitting: options.splitting,
        target: options.target,
        define: options.define,
        naming: options.naming,
        publicPath: options.publicPath,
        watch: options.watch,
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

    const success = options.useCli || options.watch ? await runCli(options, context) : await runApi(options, context);

    if (!success && !options.useCli && !options.watch) {
        return { success: await runCli(options, context) };
    }

    return { success };
}
