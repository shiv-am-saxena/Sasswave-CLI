import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

function log(...args) {
    console.log(chalk.blue('[sasswave]'), ...args);
}

async function scaffoldProject(answers) {
    const projectDir = path.resolve(process.cwd(), answers.name);

    if (await fs.pathExists(projectDir)) {
        throw new Error(`Directory ${projectDir} already exists. Please remove or choose another name.`);
    }

    log('Scaffolding', chalk.magenta(answers.name), 'with', chalk.yellow(answers.framework));

    const isTs = answers.language === 'TypeScript';

    if (answers.framework === 'next.js') {
        const nextFlags = [
            isTs ? '--ts' : '--js',
            '--eslint',
            '--tailwind', 'false',
            '--src-dir', 'true',
            '--app', 'true',
            '--import-alias', '@/*',
            '--react-compiler', 'true'
        ];


        if (answers.pkgManager === 'bun') {
            const createArgs = ['create', 'next-app', answers.name, ...nextFlags];
            log('Running', 'bun', createArgs.join(' '));
            await execa('bun', createArgs, { stdio: 'inherit' });
        } else {
            // Use the package manager's create runner: npm -> npx, yarn -> yarn, pnpm -> pnpm
            const runner = answers.pkgManager === 'npm' ? 'npx' : answers.pkgManager;
            const baseArgs = ['create-next-app@latest', answers.name, ...nextFlags];
            log('Running', runner, baseArgs.join(' '));
            await execa(runner, baseArgs, { stdio: 'inherit' });
        }
    } else if (answers.framework === 'react') {
        // React via Vite
        const template = isTs ? 'react-ts' : 'react';
        const useBun = answers.pkgManager === 'bun';
        const baseArgs = ['create-vite@latest', answers.name, '--template', template];

        if (isTs) {
            baseArgs.push('--no-rolldown');
        }

        // Skip follow-up prompts like "Install with <pm> and start now?"
        baseArgs.push('--no-interactive');

        const command = useBun ? 'bun' : 'npx';
        const finalArgs = useBun ? ['x', ...baseArgs] : baseArgs;

        log('Running', command, finalArgs.join(' '));
        await execa(command, finalArgs, { stdio: 'inherit' });
    } else {
        throw new Error(`Unsupported framework: ${answers.framework}`);
    }

    return projectDir;
}

export { scaffoldProject };
