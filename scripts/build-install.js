import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const output = path.join(root, 'dist');
const plugin = JSON.parse(fs.readFileSync(path.join(root, 'plugin.json'), 'utf8'));
const pluginName = plugin.name;

function run(command, args, env = process.env) {
    console.log(`\n> ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, {
        cwd: root,
        env,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

function resolvePnpm() {
    const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    const probe = spawnSync(command, ['--version'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' });
    if (!probe.error && probe.status === 0) return command;
    const corepack = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';
    const corepackProbe = spawnSync(corepack, ['pnpm', '--version'], { cwd: root, stdio: 'ignore', shell: process.platform === 'win32' });
    if (!corepackProbe.error && corepackProbe.status === 0) return { command: corepack, prefix: ['pnpm'] };
    throw new Error('pnpm was not found. Install Node.js with Corepack or install pnpm, then retry.');
}

async function chooseInstallDirectory() {
    try {
        const response = await fetch('http://127.0.0.1:6806/api/system/getWorkspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`SiYuan API returned HTTP ${response.status}`);
        const json = await response.json();
        const workspaces = Array.isArray(json?.data) ? json.data : [];
        if (workspaces.length === 1 && workspaces[0]?.path) {
            return path.join(workspaces[0].path, 'data', 'plugins');
        }
        if (workspaces.length > 1) {
            console.log('\nDetected SiYuan workspaces:');
            workspaces.forEach((workspace, index) => console.log(`  [${index}] ${workspace.path}`));
            const rl = readline.createInterface({ input: stdin, output: stdout });
            const answer = await rl.question(`Select workspace [0-${workspaces.length - 1}]: `);
            rl.close();
            const index = Number(answer);
            if (Number.isInteger(index) && workspaces[index]?.path) {
                return path.join(workspaces[index].path, 'data', 'plugins');
            }
        }
    } catch (error) {
        console.warn(`Could not detect SiYuan automatically: ${error.message}`);
    }

    const rl = readline.createInterface({ input: stdin, output: stdout });
    const answer = await rl.question('Enter the SiYuan data/plugins directory path: ');
    rl.close();
    if (!answer.trim()) throw new Error('No plugin installation directory was provided.');
    return answer.trim().replace(/^"|"$/g, '');
}

try {
    const pnpm = resolvePnpm();
    const call = (args, env) => Array.isArray(pnpm)
        ? run(pnpm.command, [...pnpm.prefix, ...args], env)
        : (typeof pnpm === 'string'
            ? run(pnpm, args, env)
            : run(pnpm.command, [...pnpm.prefix, ...args], env));

    if (!fs.existsSync(path.join(root, 'node_modules'))) {
        call(['install']);
    }

    call(['exec', 'vite', 'build'], { ...process.env, SKIP_SIYUAN_AUTO_COPY: '1', NODE_ENV: 'production' });
    if (!fs.existsSync(path.join(output, 'plugin.json'))) {
        throw new Error('Build finished but dist/plugin.json was not created.');
    }

    const pluginDir = await chooseInstallDirectory();
    const target = path.join(pluginDir, pluginName);
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(output, target, { recursive: true, force: true });

    console.log('\n========================================');
    console.log(`Built SiYuan plugin ${plugin.name} ${plugin.version}`);
    console.log(`Installed files to: ${target}`);
    console.log('In SiYuan, refresh the plugin list (or restart SiYuan), then enable/update the plugin.');
    console.log('The distributable archive is also written to package.zip in the project root.');
    console.log('========================================\n');
} catch (error) {
    console.error('\nBuild/install failed:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
