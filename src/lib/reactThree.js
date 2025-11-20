import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';

const THREE_PACKAGES = ['three', '@react-three/fiber', '@react-three/drei'];
const THREE_SCENE_FILE = 'src/ThreeScene.jsx';
const APP_ENTRY_CANDIDATES = ['src/App.jsx', 'src/App.tsx'];

const THREE_SCENE_TEMPLATE = `import React from 'react';
import { Canvas } from '@react-three/fiber';
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

function resolveInstallArgs(pkgManager) {
    if (pkgManager === 'npm') return ['install'];
    return ['add'];
}

async function injectSceneImport(appPath) {
    let content = await fs.readFile(appPath, 'utf8');
    if (content.includes('ThreeScene')) return false;

    content = "import ThreeScene from './ThreeScene'\n" + content;
    content += "\n// appended by sasswave-create-cli\nexport default function AppWrapper(){ return (<div><ThreeScene/></div>) }";
    await fs.writeFile(appPath, content, 'utf8');
    return true;
}

/**
 * Installs 3D dependencies + example when React users opt-in.
 */
export async function setupReactThree(answers, projectDir) {
    if (answers.framework !== 'react' || !answers.want3d) return;

    log('Installing 3D packages: three, @react-three/fiber, @react-three/drei');
    try {
        await execa(answers.pkgManager, resolveInstallArgs(answers.pkgManager).concat(THREE_PACKAGES), {
            cwd: projectDir,
            stdio: 'inherit'
        });
    } catch (err) {
        log('Failed to install 3D packages:', err.message || err);
        throw err;
    }

    const scenePath = path.join(projectDir, THREE_SCENE_FILE);
    try {
        await fs.outputFile(scenePath, THREE_SCENE_TEMPLATE, 'utf8');
        log('Wrote ThreeScene example to src/ThreeScene.jsx');
    } catch (err) {
        log('Failed to write ThreeScene example:', err.message || err);
    }

    for (const entry of APP_ENTRY_CANDIDATES) {
        const resolved = path.join(projectDir, entry);
        if (await fs.pathExists(resolved)) {
            try {
                const injected = await injectSceneImport(resolved);
                if (injected) log(`Injected ThreeScene into ${entry}`);
            } catch (err) {
                log(`Failed to inject ThreeScene into ${entry}:`, err.message || err);
            }
            break;
        }
    }
}
