import runExecutor from '../src/executors/run/executor';

async function main(): Promise<void> {
    const result = await runExecutor(
        {
            entry: 'tests/selftest-entry.ts',
        },
        {
            root: '.',
            projectName: 'nx-bun',
            projectsConfigurations: {
                projects: {
                    'nx-bun': {
                        root: '.',
                    },
                },
            },
        } as never,
    );

    if (!result.success) {
        throw new Error('Source selftest failed.');
    }
}

await main();
