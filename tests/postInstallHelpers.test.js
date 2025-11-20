import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.CI_SKIP_THREE_INSTALL = 'true';

import { setupReactProject } from '../src/lib/reactSetup.js';
import { setupNextProject } from '../src/lib/nextSetup.js';
import { setupReactThree } from '../src/lib/reactThree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

async function withTempDir(prefix, fn) {
    const tempPath = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    try {
        return await fn(tempPath);
    } finally {
        await fs.remove(tempPath);
    }
}

async function withManifestDisabled(fn) {
    const manifestPath = path.join(repoRoot, 'assets-manifest.json');
    const backupPath = `${manifestPath}.unit-bak`;
    const hadManifest = await fs.pathExists(manifestPath);

    if (hadManifest) {
        await fs.copy(manifestPath, backupPath);
    }
    await fs.writeFile(manifestPath, '[]', 'utf8');

    try {
        return await fn();
    } finally {
        if (hadManifest) {
            await fs.move(backupPath, manifestPath, { overwrite: true });
        } else {
            await fs.remove(manifestPath);
        }
    }
}

async function createReactFixture(dir) {
    await fs.ensureDir(path.join(dir, 'src'));
    await fs.ensureDir(path.join(dir, 'public'));

    await fs.writeFile(path.join(dir, 'src', 'App.tsx'), "export default function App(){return <div>Hello</div>;}\n");
    await fs.writeFile(path.join(dir, 'src', 'App.css'), 'body { background: pink; }\n');
    await fs.writeFile(path.join(dir, 'src', 'index.css'), ':root { color: red; }\n');
    await fs.writeFile(
        path.join(dir, 'src', 'main.tsx'),
        "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n"
    );
    await fs.writeFile(
        path.join(dir, 'index.html'),
        '<!doctype html>\n<html>\n  <head>\n    <link rel="icon" href="/vite.svg" />\n    <title>Vite App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>\n'
    );
}

async function createNextFixture(dir) {
    const appDir = path.join(dir, 'src', 'app');
    await fs.ensureDir(appDir);
    await fs.ensureDir(path.join(dir, 'public'));

    await fs.writeFile(
        path.join(appDir, 'layout.tsx'),
        "import './globals.css';\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <body>{children}</body>\n    </html>\n  );\n}\n"
    );
    await fs.writeFile(path.join(appDir, 'page.tsx'), 'export default function Page(){ return <main>Hello</main>; }\n');
    await fs.writeFile(path.join(appDir, 'globals.css'), 'body { background: #fff; }\n');
    await fs.writeFile(path.join(appDir, 'page.module.css'), '.main { padding: 2rem; }\n');

    await fs.writeFile(path.join(dir, 'tailwind.config.js'), 'export default {};\n');
    await fs.writeFile(path.join(dir, 'postcss.config.js'), 'export default {};\n');

    await fs.writeFile(
        path.join(dir, 'package.json'),
        JSON.stringify(
            {
                name: 'fixture',
                dependencies: { tailwindcss: '^3.0.0' },
                devDependencies: { '@tailwindcss/postcss': '^8.0.0' }
            },
            null,
            2
        )
    );
}

test('setupReactProject rewrites Vite React entry files', { concurrency: false }, async () => {
    await withManifestDisabled(async () => {
        await withTempDir('sasswave-react-test-', async (dir) => {
            await createReactFixture(dir);

            await setupReactProject(
                { framework: 'react', language: 'TypeScript', pkgManager: 'npm' },
                dir
            );

            const mainContent = await fs.readFile(path.join(dir, 'src', 'main.tsx'), 'utf8');
            const appModuleExists = await fs.pathExists(path.join(dir, 'src', 'App.module.scss'));
            const indexCssExists = await fs.pathExists(path.join(dir, 'src', 'index.css'));
            const appCssExists = await fs.pathExists(path.join(dir, 'src', 'App.css'));
            const title = (await fs.readFile(path.join(dir, 'index.html'), 'utf8')).match(/<title>(.*?)<\/title>/i)?.[1];

            assert.ok(mainContent.includes("import './styles.scss'"), 'main.tsx should import styles.scss');
            assert.ok(appModuleExists, 'App.module.scss should exist');
            assert.equal(indexCssExists, false, 'index.css should be removed');
            assert.equal(appCssExists, false, 'App.css should be removed');
            assert.equal(title, 'SassWave UI');
        });
    });
});

test('setupNextProject removes Tailwind and rebuilds layout', { concurrency: false }, async () => {
    await withManifestDisabled(async () => {
        await withTempDir('sasswave-next-test-', async (dir) => {
            await createNextFixture(dir);

            await setupNextProject(
                { framework: 'next.js', language: 'TypeScript', pkgManager: 'npm' },
                dir
            );

            const layoutContent = await fs.readFile(path.join(dir, 'src', 'app', 'layout.tsx'), 'utf8');
            const globalsExists = await fs.pathExists(path.join(dir, 'src', 'app', 'globals.scss'));
            const tailwindConfigExists = await fs.pathExists(path.join(dir, 'tailwind.config.js'));

            assert.ok(layoutContent.includes('export const metadata'), 'layout.tsx should define metadata');
            assert.equal(globalsExists, true, 'globals.scss should be created');
            assert.equal(tailwindConfigExists, false, 'tailwind.config.js should be removed');
        });
    });
});

test('setupReactThree injects ThreeScene into React template', { concurrency: false }, async () => {
    await withManifestDisabled(async () => {
        await withTempDir('sasswave-react-3d-', async (dir) => {
            await createReactFixture(dir);

            const answers = { framework: 'react', language: 'TypeScript', pkgManager: 'npm', want3d: true };
            await setupReactProject(answers, dir);
            await setupReactThree(answers, dir);

            const sceneExists = await fs.pathExists(path.join(dir, 'src', 'ThreeScene.tsx'));
            const appContent = await fs.readFile(path.join(dir, 'src', 'App.tsx'), 'utf8');
            const moduleContent = await fs.readFile(path.join(dir, 'src', 'App.module.scss'), 'utf8');

            assert.equal(sceneExists, true, 'ThreeScene.tsx should exist');
            assert.ok(appContent.includes("<ThreeScene />"), 'App.tsx should render ThreeScene');
            assert.ok(moduleContent.includes('.scene'), 'App.module.scss should include .scene styles');
        });
    });
});

test('setupReactThree injects ThreeScene into Next.js template', { concurrency: false }, async () => {
    await withManifestDisabled(async () => {
        await withTempDir('sasswave-next-3d-', async (dir) => {
            await createNextFixture(dir);

            const answers = { framework: 'next.js', language: 'TypeScript', pkgManager: 'npm', want3d: true };
            await setupNextProject(answers, dir);
            await setupReactThree(answers, dir);

            const sceneExists = await fs.pathExists(path.join(dir, 'src', 'app', 'ThreeScene.tsx'));
            const pageContent = await fs.readFile(path.join(dir, 'src', 'app', 'page.tsx'), 'utf8');
            const moduleContent = await fs.readFile(path.join(dir, 'src', 'app', 'page.module.scss'), 'utf8');

            assert.equal(sceneExists, true, 'ThreeScene.tsx should exist in app directory');
            assert.ok(pageContent.includes("<ThreeScene />"), 'page.tsx should render ThreeScene');
            assert.ok(moduleContent.includes('.scene'), 'page.module.scss should include .scene styles');
        });
    });
});
