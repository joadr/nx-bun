import { expect, test } from 'bun:test';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import {
    buildCommandArguments,
    executeBunCommand,
    formatCommand,
    mergeEnvironment,
    resolveBunBinary,
    resolveWorkingDirectory,
    validateOptions,
} from '../src/executors/run/run-utils';

test('validateOptions accepts one script or entry', () => {
    expect(() => validateOptions({ script: 'dev' })).not.toThrow();
    expect(() => validateOptions({ entry: 'src/main.ts' })).not.toThrow();
});

test('validateOptions accepts buildTarget and runtime args', () => {
    expect(() => validateOptions({ script: 'dev', buildTarget: 'build', runtimeArgs: ['--watch'] })).not.toThrow();
    expect(() => validateOptions({ buildTarget: 'build' })).not.toThrow();
});

test('validateOptions rejects ambiguous options', () => {
    expect(() => validateOptions({})).toThrow('Provide either "script", "entry", or "buildTarget".');
    expect(() => validateOptions({ script: 'dev', entry: 'src/main.ts' })).toThrow(
        'Only one of "script" or "entry" may be provided.',
    );
});

test('buildCommandArguments preserves bun invocation shape', () => {
    expect(buildCommandArguments({ script: 'dev', runtimeArgs: ['--watch'], args: ['--watch'] })).toEqual([
        '--watch',
        'run',
        'dev',
        '--watch',
    ]);
    expect(buildCommandArguments({ entry: 'src/main.ts', runtimeArgs: ['--inspect'], args: ['--foo'] })).toEqual([
        '--inspect',
        'src/main.ts',
        '--foo',
    ]);
    expect(buildCommandArguments({ entry: 'src/main.ts', watch: true })).toEqual([
        '--watch',
        'src/main.ts',
    ]);
});

test('resolveWorkingDirectory prefers project root and explicit cwd', () => {
    const workspaceRoot = path.resolve('.');
    const context = {
        root: '.',
        projectName: 'nx-bun',
        projectsConfigurations: {
            projects: {
                'nx-bun': {
                    root: '.',
                },
            },
        },
    } as never;

    expect(resolveWorkingDirectory({}, context)).toBe(workspaceRoot);
    expect(resolveWorkingDirectory({ cwd: '.' }, context)).toBe(workspaceRoot);
});

test('resolveWorkingDirectory rejects missing directories', () => {
    const context = { root: '.' } as never;

    expect(() => resolveWorkingDirectory({ cwd: './definitely-missing' }, context)).toThrow(
        'The working directory does not exist:',
    );
});

test('mergeEnvironment and bun binary resolution are explicit', () => {
    expect(resolveBunBinary({ bunPath: '/opt/bun/bin/bun' })).toBe('/opt/bun/bin/bun');
    expect(resolveBunBinary({})).toBe('bun');
    expect(mergeEnvironment({ env: { NX_BUN_TEST: '1' } }).NX_BUN_TEST).toBe('1');
});

test('formatCommand is readable', () => {
    expect(formatCommand('bun', ['run', 'dev'])).toBe('bun run dev');
});

test('executeBunCommand returns true on successful exit', async () => {
    const child = new EventEmitter();
    const spawnImpl = () => child as never;

    const promise = executeBunCommand({
        bunBinary: 'bun',
        commandArguments: ['version'],
        cwd: path.resolve('.'),
        env: process.env,
        spawnImpl,
    });

    child.emit('close', 0, null);

    expect(await promise).toBe(true);
});

test('executeBunCommand returns false on start failure', async () => {
    const originalError = console.error;
    console.error = () => {};

    const spawnImpl = () => {
        const child = new EventEmitter();
        queueMicrotask(() => child.emit('error', new Error('missing bun')));
        return child as never;
    };

    try {
        const success = await executeBunCommand({
            bunBinary: 'bun',
            commandArguments: ['version'],
            cwd: path.resolve('.'),
            env: process.env,
            spawnImpl,
        });

        expect(success).toBe(false);
    } finally {
        console.error = originalError;
    }
});
