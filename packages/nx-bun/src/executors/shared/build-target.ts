import { ExecutorContext, parseTargetString } from '@nx/devkit';
import { runExecutor as runNxExecutor } from 'nx/src/devkit-exports';

export async function runBuildTarget(
    buildTarget: string,
    context: ExecutorContext,
    options: { stopAfterFirstSuccess?: boolean } = {},
): Promise<boolean> {
    const targetDescription = parseTargetString(buildTarget, context);

    try {
        const execution = await runNxExecutor<{ success: boolean }>(targetDescription, {}, context);

        for await (const result of execution) {
            if (!result.success) {
                return false;
            }

            if (options.stopAfterFirstSuccess) {
                await execution.return?.(undefined as never);
                return true;
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
