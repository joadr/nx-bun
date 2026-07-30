import { expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import buildExecutor from '../src/executors/build/executor';

function makeTempProject(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nx-bun-build-'));
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.writeFileSync(
        path.join(root, 'src', 'main.ts'),
        "console.log('hello from build');\n",
        'utf8',
    );
    return root;
}

function makeContext(root: string) {
    return {
        root,
        projectName: 'temp-project',
        projectsConfigurations: {
            projects: {
                'temp-project': {
                    root: '.',
                },
            },
        },
    } as never;
}

test('build executor uses Bun.build when available', async () => {
    const root = makeTempProject();

    const result = await buildExecutor(
        {
            entrypoints: ['src/main.ts'],
            outputPath: 'dist',
        },
        makeContext(root),
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(root, 'dist', 'main.js'))).toBe(true);
});

test('build executor can be forced to use the CLI', async () => {
    const root = makeTempProject();

    const result = await buildExecutor(
        {
            entrypoints: ['src/main.ts'],
            outputPath: 'dist',
            useCli: true,
        },
        makeContext(root),
    );

    expect(result.success).toBe(true);
    expect(fs.existsSync(path.join(root, 'dist', 'main.js'))).toBe(true);
});
