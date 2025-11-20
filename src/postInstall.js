import { execa } from 'execa';
import { log } from './lib/logger.js';
import { setupNextProject } from './lib/nextSetup.js';
import { setupReactProject } from './lib/reactSetup.js';
import { setupReactThree } from './lib/reactThree.js';

// --- Main exported function (ESM) ---
export async function addSassAndThree(answers, projectDir) {
    const cwd = projectDir;
    const installCmd = answers.pkgManager;
    const installArgsBase =
        answers.pkgManager === 'npm' ? ['install', '--save-dev'] : answers.pkgManager === 'yarn' ? ['add', '--dev'] : ['add', '-D'];

    log('Installing SCSS support (sass) ...');
    try {
        await execa(installCmd, installArgsBase.concat(['sass']), { cwd, stdio: 'inherit' });
    } catch (err) {
        log('Failed to install sass:', err.message || err);
        throw err;
    }

    // For Next.js: convert all .css -> .scss under src/app and update imports
    if (answers.framework === 'next.js') {
        try {
            await setupNextProject(answers, cwd);
        } catch (err) {
            log('Failed to finalize Next.js project automatically:', err.message || err);
        }
    }

    if (answers.framework === 'react') {
        try {
            await setupReactProject(answers, cwd);
        } catch (err) {
            log('Failed to finalize React project automatically:', err.message || err);
        }
    }

    await setupReactThree(answers, cwd);
}

export async function initGit(answers, projectDir) {
    if (!answers.git) return;

    try {
        await execa('git', ['init'], { cwd: projectDir, stdio: 'inherit' });
        log('Initialized empty git repository');
    } catch (e) {
        log('git init failed (git may not be installed)');
    }
}
