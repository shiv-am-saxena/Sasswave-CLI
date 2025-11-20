import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';
import { downloadAssets } from './assets.js';
import { ensureScssEntry } from './scssEntry.js';

const APP_CANDIDATES = {
    ts: ['src/App.tsx'],
    js: ['src/App.jsx', 'src/App.js']
};

const DEFAULT_CSS_FILES = ['src/index.css', 'src/App.css', 'public/vite.svg', 'src/assets/react.svg'];
const INDEX_HTML = 'index.html';

function resolveAppPath(projectDir, isTs) {
    const candidates = isTs ? APP_CANDIDATES.ts : APP_CANDIDATES.js;
    for (const relPath of candidates) {
        const absolute = path.join(projectDir, relPath);
        if (fs.existsSync(absolute)) return absolute;
    }
    return path.join(projectDir, candidates[0]);
}

function globalsTemplate() {
    return `@use "sass:color";
@font-face {
    font-family: "Urbanist";
    src: url("/Urbanist-Regular.woff") format("woff");
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}

$font-family-base: "Urbanist", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
$body-bg: #f4f6fb;
$body-color: #0d2440;
$muted-color: #5b6c84;

@mixin smooth-font {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    font-family: $font-family-base;
    background-color: $body-bg;
    color: $body-color;
}

html,
body {
    height: 100%;
    width: 100%;
}

body {
    font-family: inherit;
    background-color: inherit;
    color: inherit;
    line-height: 1.5;
    @include smooth-font;
}

img {
    max-width: 100%;
    display: block;
    height: auto;
}

p {
    color: $muted-color;
}
`;
}

function appModuleTemplate() {
    return `@use "sass:color";

$palette-1: #e7f0fa;
$palette-2: #7ba4d0;
$palette-3: #2e5e99;
$palette-4: #0d2440;

$bg: $palette-1;
$panel: #ffffff;
$text-primary: $palette-3;
$text-secondary: #40546a;
$muted: #7a8aa3;

$btn-accent-start: $palette-2;
$btn-accent-end: $palette-3;
$btn-text: #ffffff;
$radius-lg: 12px;
$max-width: 1100px;

@mixin focus-ring($color) {
    outline: 3px solid color.change($color, $alpha: 0.18);
    outline-offset: 2px;
}

.page {
    background: $bg;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 20px;
}

.main {
    width: 100%;
    max-width: $max-width;
    background: linear-gradient(180deg, color.change($panel, $alpha: 0.6), color.change($panel, $alpha: 0.4));
    border-radius: 20px;
    padding: 56px 64px;
    box-shadow: 0 10px 30px color.change($palette-4, $alpha: 0.08);
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
    width: 240px;
    height: auto;
    max-width: 100%;
}

.nav {
    display: flex;
    gap: 20px;
}

.nav a {
    color: $text-primary;
    font-weight: 600;
    text-decoration: none;
    opacity: 0.9;
}

.hero {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.h1 {
    font-size: 44px;
    line-height: 1.05;
    margin: 0;
    color: $text-primary;
    font-weight: 700;
}

.lead {
    max-width: 680px;
    color: $text-secondary;
    font-size: 18px;
    line-height: 1.6;
}

.ctas {
    display: flex;
    gap: 16px;
    margin-top: 8px;
}

a.primary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    border-radius: 999px;
    background: linear-gradient(90deg, $btn-accent-start, $btn-accent-end);
    color: $btn-text;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 6px 18px color.change($palette-3, $alpha: 0.18);
    transition: transform 0.12s ease, box-shadow 0.12s ease;

    &:hover {
        transform: translateY(-2px);
    }

    &:focus {
        @include focus-ring($btn-accent-start);
    }
}

a.secondary {
    display: inline-flex;
    align-items: center;
    padding: 12px 20px;
    border-radius: 999px;
    color: $text-primary;
    border: 1px solid color.change($palette-4, $alpha: 0.25);
    background: transparent;
    text-decoration: none;
    font-weight: 600;
}

.footer {
    color: $muted;
    font-size: 13px;
}

@media (max-width: 880px) {
    .main { padding: 36px; }
    .h1 { font-size: 32px; }
}

@media (max-width: 640px) {
    .page { padding: 36px 16px; }
    .main { padding: 32px; }
    .header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .nav { flex-wrap: wrap; gap: 12px; }
    .logo { width: 200px; }
    .h1 { font-size: 30px; }
    .lead { font-size: 16px; max-width: 100%; }
}

@media (max-width: 480px) {
    .main { padding: 28px 24px; }
    .header { align-items: center; text-align: center; }
    .nav { justify-content: center; width: 100%; }
    .hero { align-items: center; text-align: center; }
    .ctas { flex-direction: column; width: 100%; }
    .ctas a { justify-content: center; width: 100%; }
    .logo { width: 190px; }
}

@media (prefers-color-scheme: dark) {
    .page { background: $palette-4; }
    .main { background: linear-gradient(180deg, color.change(#081424, $alpha: 0.85), color.change(#081424, $alpha: 0.78)); }
    .nav a, .h1, .a.secondary { color: $palette-1; }
    .lead { color: #c7d7ec; }
    a.secondary { border: 1px solid color.change($palette-1, $alpha: 0.25); }
}
`;
}

function appComponentTemplate(isTs) {
    const header = "import styles from './App.module.scss';\n";
    const body = `export default function App() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <img src="/wordmark.png" alt="SassWave wordmark" className={styles.logo} />
          <nav className={styles.nav} aria-label="Primary">
            <a href="https://sasswave.in/components/" target="_blank" rel="noopener noreferrer">Components</a>
            <a href="https://sasswave.in/docs/" target="_blank" rel="noopener noreferrer">Docs</a>
          </nav>
        </header>

        <section className={styles.hero}>
          <h1 className={styles.h1}>Design-ready React + Next.js components built with SCSS</h1>
          <p className={styles.lead}>
            SassWave is a focused UI kit with SCSS-first styling and accessible, animated components.
            Ship faster with curated building blocks.
          </p>
          <div className={styles.ctas}>
            <a className={styles.primary} href="https://sasswave.in/docs/get-started/installation/" target="_blank" rel="noopener noreferrer">
              Get Started
            </a>
            <a className={styles.secondary} href="https://sasswave.in/components/" target="_blank" rel="noopener noreferrer">
              Browse Components
            </a>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>&copy; {new Date().getFullYear()} SassWave -- Built with SCSS</p>
        </footer>
      </main>
    </div>
  );
}
`;
    if (isTs) {
        return `${header}${body}`;
    }
    return `${header}${body}`;
}

async function removeDefaultCss(projectDir) {
    for (const rel of DEFAULT_CSS_FILES) {
        const target = path.join(projectDir, rel);
        if (await fs.pathExists(target)) {
            await fs.remove(target);
            log(`Removed default React CSS file: ${rel}`);
        }
    }
}

async function tweakIndexHtml(projectDir) {
    const htmlPath = path.join(projectDir, INDEX_HTML);
    if (!(await fs.pathExists(htmlPath))) return;

    let content = await fs.readFile(htmlPath, 'utf8');
    const faviconPattern = /<link[^>]+rel=["']icon["'][^>]*>/i;
    const titlePattern = /<title>.*?<\/title>/i;

    if (faviconPattern.test(content)) {
        content = content.replace(faviconPattern, '<link rel="shortcut icon" href="favicon.png" type="image/x-icon">');
    }

    if (titlePattern.test(content)) {
        content = content.replace(titlePattern, '<title>SassWave UI</title>');
    }

    await fs.writeFile(htmlPath, content, 'utf8');
    log('Updated index.html with SassWave favicon and title');
}

/**
 * Applies SassWave defaults to freshly created Vite React apps.
 */
export async function setupReactProject(answers, projectDir) {
    if (answers.framework !== 'react') return;

    const isTs = answers.language === 'TypeScript';
    const appPath = resolveAppPath(projectDir, isTs);
    const modulePath = path.join(projectDir, 'src', 'App.module.scss');

    await removeDefaultCss(projectDir);
    await fs.ensureDir(path.dirname(appPath));
    await fs.outputFile(modulePath, appModuleTemplate(), 'utf8');
    await fs.outputFile(appPath, appComponentTemplate(isTs), 'utf8');

    await ensureScssEntry(projectDir, { content: globalsTemplate(), isTs });
    await downloadAssets(answers, projectDir);
    await tweakIndexHtml(projectDir);

    log('Applied SassWave defaults to Vite React project');
}
