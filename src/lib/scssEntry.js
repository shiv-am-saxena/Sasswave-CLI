import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';

const ENTRY_CANDIDATES = ['src/main.tsx', 'src/main.ts', 'src/main.jsx', 'src/main.js'];
const DEFAULT_SCSS = "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#fff; }";

function buildEntryTemplate(isTs) {
    const appImport = isTs ? "import App from './App.tsx';" : "import App from './App.jsx';";
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
${appImport}
import './styles.scss';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
`;
}

/**
 * Rewrites the React/Vite main entry to import the SassWave globals.
 */
export async function ensureScssEntry(projectDir, { content = DEFAULT_SCSS, isTs = false } = {}) {
    const scssPath = path.join(projectDir, 'src', 'styles.scss');

    for (const entry of ENTRY_CANDIDATES) {
        const entryPath = path.join(projectDir, entry);
        if (!(await fs.pathExists(entryPath))) continue;

        await fs.outputFile(scssPath, content, 'utf8');
        await fs.outputFile(entryPath, buildEntryTemplate(isTs), 'utf8');
        log(`Rewrote ${entry} with SassWave bootstrap`);
        return;
    }

    await fs.outputFile(scssPath, content, 'utf8');
    log('Created src/styles.scss but did not find a React entry file to rewrite');
}
