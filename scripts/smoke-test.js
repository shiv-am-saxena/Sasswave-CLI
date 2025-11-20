import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupReactProject } from '../src/lib/reactSetup.js';
import { setupNextProject } from '../src/lib/nextSetup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

async function withTempDir(prefix, fn) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    try {
        return await fn(dir);
    } finally {
        await fs.remove(dir);
    }
}

async function withManifestSuppressed(fn) {
    const manifestPath = path.join(repoRoot, 'assets-manifest.json');
    const backupPath = `${manifestPath}.bak-smoke`;
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

    await fs.writeFile(path.join(dir, 'src', 'App.tsx'), "export default function App(){return <div>Hello</div>; }\n");
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

    await fs.writeFile(path.join(appDir, 'layout.tsx'), "import './globals.css'; export default function RootLayout({children}:{children:React.ReactNode}){return <html><body>{children}</body></html>}\n");
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
                dependencies: {
                    tailwindcss: '^3.0.0'
                },
                devDependencies: {
                    '@tailwindcss/postcss': '^8.0.0'
                }
            },
            null,
            2
        )
    );
}

async function runReactTest() {
    return withTempDir('sasswave-react-', async (dir) => {
        await createReactFixture(dir);
        const answers = { framework: 'react', language: 'TypeScript', pkgManager: 'npm' };
        await setupReactProject(answers, dir);

        const rewrittenMain = await fs.readFile(path.join(dir, 'src', 'main.tsx'), 'utf8');
        const hasSCSS = await fs.pathExists(path.join(dir, 'src', 'App.module.scss'));
        const titleSnippet = (await fs.readFile(path.join(dir, 'index.html'), 'utf8')).match(/<title>(.*?)<\/title>/i)?.[1];

        return { rewrittenMain: rewrittenMain.slice(0, 120), hasSCSS, titleSnippet };
    });
}

async function runNextTest() {
    return withTempDir('sasswave-next-', async (dir) => {
        await createNextFixture(dir);
        const answers = { framework: 'next.js', language: 'TypeScript', pkgManager: 'npm' };
        await setupNextProject(answers, dir);

        const layoutContent = await fs.readFile(path.join(dir, 'src', 'app', 'layout.tsx'), 'utf8');
        const tailwindRemoved = !(await fs.pathExists(path.join(dir, 'tailwind.config.js')));
        const globalsContent = await fs.readFile(path.join(dir, 'src', 'app', 'globals.scss'), 'utf8');

        return { layoutSnippet: layoutContent.slice(0, 120), tailwindRemoved, globalsSnippet: globalsContent.slice(0, 80) };
    });
}

async function main() {
    const results = await withManifestSuppressed(async () => {
        const reactResult = await runReactTest();
        const nextResult = await runNextTest();
        return { reactResult, nextResult };
    });

    console.log('React fixture summary:', results.reactResult);
    console.log('Next.js fixture summary:', results.nextResult);
}

main().catch((err) => {
    console.error('Smoke test failed:', err);
    process.exit(1);
});
