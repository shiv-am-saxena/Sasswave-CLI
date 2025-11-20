#!/usr/bin/env node

import chalk from 'chalk';
import { execa } from 'execa';
import { askQuestions } from '../src/prompts.js';
import { scaffoldProject } from '../src/scaffold.js';
import { addSassAndThree, initGit } from '../src/postInstall.js';

async function startDevServerIfNeeded(answers, projectDir) {
	const supported = ['next.js', 'react'];
	if (!supported.includes(answers.framework)) return;

	const isNpm = answers.pkgManager === 'npm';
	const command = isNpm ? 'npm' : answers.pkgManager;
	const args = isNpm ? ['run', 'dev'] : ['dev'];
	const label = answers.framework === 'next.js' ? 'Next.js' : 'Vite dev server';

	console.log('\n' + chalk.yellow(`Starting ${label} (Ctrl+C to stop)...`));
	try {
		await execa(command, args, { cwd: projectDir, stdio: 'inherit' });
	} catch (err) {
		console.error('Failed to start dev server automatically:', err.message || err);
	}
}

async function ensureBunInstalled() {
	try {
		await execa('bun', ['--version'], { stdio: 'ignore' });
		return;
	} catch (err) {
		console.log(chalk.yellow('Bun is not installed. Installing Bun globally...'));
	}

	const installScript = 'curl -fsSL https://bun.sh/install | bash';
	try {
		await execa('bash', ['-c', installScript], { stdio: 'inherit' });
		const bunBin = `${process.env.HOME}/.bun/bin`;
		process.env.PATH = `${bunBin}:${process.env.PATH}`;
		console.log(chalk.green('Bun installation complete. Continuing with project setup...'));
	} catch (err) {
		console.error('Failed to install Bun automatically:', err.message || err);
		throw err;
	}
}

async function run() {
	try {
		const answers = await askQuestions();
		if (answers.pkgManager === 'bun') {
			await ensureBunInstalled();
		}
		const projectDir = await scaffoldProject(answers);
		await addSassAndThree(answers, projectDir);
		await initGit(answers, projectDir);

		console.log('\n' + chalk.green.bold('All set! Next steps:'));
		console.log(`  ${chalk.cyan('cd')} ${chalk.magenta(answers.name)}`);
		if (answers.pkgManager === 'npm') console.log(`  ${chalk.cyan('npm run dev')}`);
		if (answers.pkgManager === 'bun') console.log(`  ${chalk.cyan('bun dev')}`);

		await startDevServerIfNeeded(answers, projectDir);
	} catch (err) {
		console.error('Error:', err.message || err);
		process.exit(1);
	}
}

run();
