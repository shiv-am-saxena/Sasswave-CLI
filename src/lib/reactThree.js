import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';

const THREE_PACKAGES = ['three', '@react-three/fiber', '@react-three/drei'];
const REACT_APP_CANDIDATES = ['src/App.tsx', 'src/App.jsx', 'src/App.js'];
const NEXT_PAGE_CANDIDATES = {
    ts: ['page.tsx', 'page.ts'],
    js: ['page.jsx', 'page.js']
};

function buildSceneTemplate({ useClient }) {
    const clientDirective = useClient ? "'use client';\n\n" : '';
    return `${clientDirective}import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function ThreeScene() {
  return (
    <Canvas style={{ height: '100vh' }} shadows>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}
`;
}

function sceneStyles() {
    return `
.scene {
    margin-top: 32px;
    border-radius: 18px;
    overflow: hidden;
    min-height: 320px;
    background: linear-gradient(120deg, #050e2d, #0c1a3f);
    box-shadow: 0 20px 40px rgba(5, 14, 45, 0.45);
}

.scene canvas {
    width: 100%;
    height: 100%;
    display: block;
}
`;
}

function resolveInstallArgs(pkgManager) {
    if (pkgManager === 'npm') return ['install'];
    return ['add'];
}

async function installThreeDependencies(answers, projectDir) {
    if (process.env.CI_SKIP_THREE_INSTALL === 'true') {
        log('Skipping 3D package install (CI_SKIP_THREE_INSTALL=true)');
        return;
    }

    log('Installing 3D packages: three, @react-three/fiber, @react-three/drei');
    await execa(answers.pkgManager, resolveInstallArgs(answers.pkgManager).concat(THREE_PACKAGES), {
        cwd: projectDir,
        stdio: 'inherit'
    });
}

async function resolveExistingFile(baseDir, candidates) {
    for (const relative of candidates) {
        const absolute = path.join(baseDir, relative);
        if (await fs.pathExists(absolute)) return absolute;
    }
    return null;
}

function insertImport(content, importLine) {
    if (content.includes(importLine)) return content;

    if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
        const firstNewline = content.indexOf('\n');
        return content.slice(0, firstNewline + 1) + importLine + '\n' + content.slice(firstNewline + 1);
    }

    return `${importLine}\n${content}`;
}

function insertSceneSection(content) {
    if (content.includes('<ThreeScene')) return content;
    const section = `
        <section className={styles.scene} aria-label="Interactive 3D preview">
          <ThreeScene />
        </section>
`;
    const footerIndex = content.indexOf('<footer');
    if (footerIndex === -1) return content + section;
    return content.slice(0, footerIndex) + section + content.slice(footerIndex);
}

async function ensureStyles(modulePath) {
    if (!(await fs.pathExists(modulePath))) return;
    let styles = await fs.readFile(modulePath, 'utf8');
    if (!styles.includes('.scene')) {
        styles = `${styles}\n${sceneStyles()}`;
        await fs.writeFile(modulePath, styles, 'utf8');
    }
}

async function setupReactScene(answers, projectDir) {
    const appPath = await resolveExistingFile(projectDir, REACT_APP_CANDIDATES);
    if (!appPath) return;

    const isTs = appPath.endsWith('.tsx') || appPath.endsWith('.ts');
    const sceneExt = isTs ? 'tsx' : 'jsx';
    const scenePath = path.join(projectDir, 'src', `ThreeScene.${sceneExt}`);
    await fs.outputFile(scenePath, buildSceneTemplate({ useClient: false }), 'utf8');
    log(`Wrote ThreeScene example to ${path.relative(projectDir, scenePath)}`);

    let appContent = await fs.readFile(appPath, 'utf8');
    appContent = insertImport(appContent, "import ThreeScene from './ThreeScene';");
    appContent = insertSceneSection(appContent);
    await fs.writeFile(appPath, appContent, 'utf8');

    await ensureStyles(path.join(projectDir, 'src', 'App.module.scss'));
}

async function setupNextScene(answers, projectDir) {
    const appDir = path.join(projectDir, 'src', 'app');
    const isTs = answers.language === 'TypeScript';
    const pagePath = await resolveExistingFile(appDir, isTs ? NEXT_PAGE_CANDIDATES.ts : NEXT_PAGE_CANDIDATES.js);
    if (!pagePath) return;

    const sceneExt = isTs ? 'tsx' : 'jsx';
    const scenePath = path.join(appDir, `ThreeScene.${sceneExt}`);
    await fs.outputFile(scenePath, buildSceneTemplate({ useClient: true }), 'utf8');
    log(`Wrote ThreeScene example to ${path.relative(projectDir, scenePath)}`);

    let pageContent = await fs.readFile(pagePath, 'utf8');
    pageContent = insertImport(pageContent, "import ThreeScene from './ThreeScene';");
    pageContent = insertSceneSection(pageContent);
    await fs.writeFile(pagePath, pageContent, 'utf8');

    await ensureStyles(path.join(appDir, 'page.module.scss'));
}

/**
 * Installs 3D dependencies and injects demo scene when requested.
 */
export async function setupReactThree(answers, projectDir) {
    if (!answers.want3d) return;

    try {
        await installThreeDependencies(answers, projectDir);
    } catch (err) {
        log('Failed to install 3D packages:', err.message || err);
        throw err;
    }

    try {
        if (answers.framework === 'react') {
            await setupReactScene(answers, projectDir);
        } else if (answers.framework === 'next.js') {
            await setupNextScene(answers, projectDir);
        }
    } catch (err) {
        log('Failed to configure 3D scene:', err.message || err);
    }
}
