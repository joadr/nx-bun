import { ExecutorContext } from '@nx/devkit';
import { parseTargetString } from '@nx/devkit';
import {
    buildCommandArguments,
    executeBunCommand,
    formatCommand,
    mergeEnvironment,
    resolveBunBinary,
    resolveWorkingDirectory,
    RunExecutorOptions,
    validateOptions,
} from './run-utils';
import { runExecutor as runNxExecutor } from 'nx/src/devkit-exports';

async function runBuildTarget(buildTarget: string, context: ExecutorContext): Promise<boolean> {
    const targetDescription = parseTargetString(buildTarget, context);

    try {
        const execution = await runNxExecutor<{ success: boolean }>(targetDescription, {}, context);

        for await (const result of execution) {
            if (!result.success) {
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error(
            `[nx-bun] failed to run build target "${buildTarget}": ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
    }
}

export default async function runExecutor(
    options: RunExecutorOptions,
    context: ExecutorContext,
): Promise<{ success: boolean }> {
    validateOptions(options);

    if (options.buildTarget) {
        const buildSuccess = await runBuildTarget(options.buildTarget, context);

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
