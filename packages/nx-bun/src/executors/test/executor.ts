import { ExecutorContext } from '@nx/devkit';
import {
    executeBunCommand,
    formatCommand,
    mergeEnvironment,
    resolveBunBinary,
    resolveWorkingDirectory,
} from '../run/run-utils';
import { runBuildTarget } from '../shared/build-target';

export interface TestExecutorOptions {
    args?: string[];
    runtimeArgs?: string[];
    buildTarget?: string;
    cwd?: string;
    bunPath?: string;
    env?: Record<string, string>;
    watch?: boolean;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function validateOptions(options: TestExecutorOptions): void {
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

function buildCommandArguments(options: TestExecutorOptions): string[] {
    const runtimeArgs = options.watch ? ['--watch', ...(options.runtimeArgs ?? [])] : (options.runtimeArgs ?? []);
    const args = options.args ?? [];

    return [...runtimeArgs, 'test', ...args];
}

export default async function testExecutor(
    options: TestExecutorOptions,
    context: ExecutorContext,
): Promise<{ success: boolean }> {
    validateOptions(options);

    if (options.buildTarget) {
        const buildSuccess = await runBuildTarget(options.buildTarget, context, { stopAfterFirstSuccess: true });

        if (!buildSuccess) {
            return { success: false };
        }
    }

    const bunBinary = resolveBunBinary(options);
    const commandArgs = buildCommandArguments(options);
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
