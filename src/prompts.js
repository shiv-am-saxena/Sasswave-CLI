import enquirer from 'enquirer';
import chalk from 'chalk';

const { prompt } = enquirer;

async function askQuestions() {
    console.log(chalk.cyan.bold('\nSassWave Create CLI'));
    console.log(chalk.gray('Scaffold a SassWave-ready frontend project.\n'));

    return prompt([
        { type: 'input', name: 'name', message: chalk.white('App name'), initial: 'sasswave-app' },
        {
            type: 'select',
            name: 'framework',
            message: chalk.white('Choose framework'),
            choices: ['react', 'next.js']
        },
        {
            type: 'select',
            name: 'language',
            message: chalk.white('Language'),
            choices: ['JavaScript', 'TypeScript'],
            initial: 'TypeScript'
        },
        {
            type: 'select',
            name: 'pkgManager',
            message: chalk.white('Package manager'),
            choices: ['npm', 'bun']
        },
        {
            type: 'confirm',
            name: 'git',
            message: chalk.white('Initialize git repository?'),
            initial: true
        },
        {
            type: 'confirm',
            name: 'want3d',
            message: chalk.white('Do you want 3D/three.js setup ?'),
            initial: false
        }
    ]);
}

export { askQuestions };
