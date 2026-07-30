import { ExecutorContext } from '@nx/devkit';
import { ChildProcess, SpawnOptions, spawn as spawnProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface RunExecutorOptions {
    script?: string;
    entry?: string;
    buildTarget?: string;
    args?: string[];
    runtimeArgs?: string[];
    watch?: boolean;
    cwd?: string;
    bunPath?: string;
    env?: Record<string, string>;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function validateOptions(options: RunExecutorOptions): void {
    const hasScript = isNonEmptyString(options.script);
    const hasEntry = isNonEmptyString(options.entry);
    const hasBuildTarget = isNonEmptyString(options.buildTarget);

    if (hasScript && hasEntry) {
        throw new Error('Only one of "script" or "entry" may be provided.');
    }

    if (!hasScript && !hasEntry && !hasBuildTarget) {
        throw new Error('Provide either "script", "entry", or "buildTarget".');
    }

    if (options.args !== undefined) {
        if (!Array.isArray(options.args) || !options.args.every((arg) => typeof arg === 'string')) {
            throw new Error('"args" must be an array of strings.');
        }
    }

    if (options.runtimeArgs !== undefined) {
        if (!Array.isArray(options.runtimeArgs) || !options.runtimeArgs.every((arg) => typeof arg === 'string')) {
            throw new Error('"runtimeArgs" must be an array of strings.');
        }
    }

    if (options.buildTarget !== undefined && !isNonEmptyString(options.buildTarget)) {
        throw new Error('"buildTarget" must be a non-empty string when provided.');
    }

    if (options.watch !== undefined && typeof options.watch !== 'boolean') {
        throw new Error('"watch" must be a boolean when provided.');
    }

    if (options.cwd !== undefined && !isNonEmptyString(options.cwd)) {
        throw new Error('"cwd" must be a non-empty string when provided.');
    }

    if (options.bunPath !== undefined && !isNonEmptyString(options.bunPath)) {
        throw new Error('"bunPath" must be a non-empty string when provided.');
    }

    if (options.env !== undefined) {
        const entries = Object.entries(options.env);

        if (entries.some(([, value]) => typeof value !== 'string')) {
            throw new Error('"env" values must be strings.');
        }
    }
}

export function buildCommandArguments(options: RunExecutorOptions): string[] {
    const args = options.args ?? [];
    const runtimeArgs = options.watch ? ['--watch', ...(options.runtimeArgs ?? [])] : (options.runtimeArgs ?? []);

    if (isNonEmptyString(options.script)) {
        return [...runtimeArgs, 'run', options.script, ...args];
    }

    if (isNonEmptyString(options.entry)) {
        return [...runtimeArgs, options.entry, ...args];
    }

    throw new Error('Unable to build Bun command arguments.');
}

function getProjectRoot(context: ExecutorContext): string | undefined {
    const projectsConfigurations = (context as {
        projectsConfigurations?: { projects?: Record<string, { root: string }> };
    }).projectsConfigurations;

    if (!context.projectName) {
        return undefined;
    }

    return projectsConfigurations?.projects?.[context.projectName]?.root;
}

function assertExistingDirectory(directory: string): void {
    if (!fs.existsSync(directory)) {
        throw new Error(`The working directory does not exist: ${directory}`);
    }

    const stats = fs.statSync(directory);

    if (!stats.isDirectory()) {
        throw new Error(`The working directory is not a directory: ${directory}`);
    }
}

export function resolveWorkingDirectory(options: RunExecutorOptions, context: ExecutorContext): string {
    const workspaceRoot = path.resolve(context.root ?? '.');

    if (isNonEmptyString(options.cwd)) {
        const resolved = path.isAbsolute(options.cwd) ? options.cwd : path.resolve(workspaceRoot, options.cwd);
        assertExistingDirectory(resolved);
        return resolved;
    }

    const projectRoot = getProjectRoot(context);

    if (isNonEmptyString(projectRoot)) {
        const resolved = path.resolve(workspaceRoot, projectRoot);
        assertExistingDirectory(resolved);
        return resolved;
    }

    assertExistingDirectory(workspaceRoot);
    return workspaceRoot;
}

export function resolveBunBinary(options: RunExecutorOptions): string {
    return isNonEmptyString(options.bunPath) ? options.bunPath : 'bun';
}

export function mergeEnvironment(options: RunExecutorOptions): NodeJS.ProcessEnv {
    return {
        ...process.env,
        ...(options.env ?? {}),
    };
}

export function formatCommand(binary: string, args: string[]): string {
    return [binary, ...args].join(' ');
}

export interface RunProcessOptions {
    cwd: string;
    env: NodeJS.ProcessEnv;
    bunBinary: string;
    commandArguments: string[];
    spawnImpl?: typeof spawnProcess;
}

export async function executeBunCommand({
    cwd,
    env,
    bunBinary,
    commandArguments,
    spawnImpl = spawnProcess,
}: RunProcessOptions): Promise<boolean> {
    return new Promise((resolve) => {
        let child: ChildProcess;

        try {
            child = spawnImpl(bunBinary, commandArguments, {
                cwd,
                env,
                stdio: 'inherit',
            } satisfies SpawnOptions);
        } catch (error) {
            console.error(`[nx-bun] failed to start Bun: ${error instanceof Error ? error.message : String(error)}`);
            resolve(false);
            return;
        }

        child.once('error', (error) => {
            console.error(
                `[nx-bun] failed to start Bun binary "${bunBinary}" in ${cwd}: ${error.message}. ` +
                    'Make sure Bun is installed or pass "bunPath".',
            );
            resolve(false);
        });

        child.once('close', (code, signal) => {
            if (signal) {
                console.error(`[nx-bun] Bun exited because it received signal ${signal}.`);
                resolve(false);
                return;
            }

            if (code !== 0) {
                console.error(`[nx-bun] Bun exited with code ${code}.`);
            }

            resolve(code === 0);
        });
    });
}
