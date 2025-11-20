import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';
import { downloadAssets } from './assets.js';

const layoutCandidates = {
    ts: ['layout.tsx', 'layout.ts'],
    js: ['layout.js', 'layout.jsx']
};

const pageCandidates = {
    ts: ['page.tsx', 'page.ts'],
    js: ['page.js', 'page.jsx']
};

const tailwindArtifacts = [
    'tailwind.config.js',
    'tailwind.config.cjs',
    'tailwind.config.mjs',
    'postcss.config.js',
    'postcss.config.cjs',
    'postcss.config.mjs',
    'src/app/globals.css',
    'src/app/globals.scss',
    'src/app/page.module.css',
    'public/file.svg',
    'public/globe.svg',
    'public/next.svg',
    'public/vercel.svg',
    'public/window.svg'
];

async function resolveTargetFile(baseDir, candidates) {
    for (const candidate of candidates) {
        const full = path.join(baseDir, candidate);
        if (await fs.pathExists(full)) return full;
    }
    return path.join(baseDir, candidates[0]);
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

p {
    color: $muted-color;

    a {
        color: inherit;
        text-decoration: none;
        transition: color 0.15s ease;

        &:hover {
            color: color.adjust($body-color, $lightness: -10%);
        }

        &:focus-visible {
            outline: 2px solid color.adjust($body-color, $lightness: 20%);
            outline-offset: 3px;
        }
    }
}

img {
    max-width: 100%;
    display: block;
    height: auto;
}
`;
}

function pageModuleTemplate() {
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
    .page { padding: 28px 24px; }
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

function layoutTemplate(isTs) {
    if (isTs) {
        return `import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.scss';

export const metadata: Metadata = {
  title: 'SassWave UI',
  description: 'Generated by SassWave'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
    }

    return `import './globals.scss';

export const metadata = {
  title: 'SassWave UI',
  description: 'Generated by SassWave'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

function pageTemplate() {
    return `"use client";
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.scss';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <Image src="/wordmark.png" alt="SassWave logo" width={240} height={56} className={styles.logo} priority />
          <nav className={styles.nav} aria-label="Primary">
            <Link href="https://sasswave.in/components/" target="_blank" rel="noopener noreferrer">Components</Link>
            <Link href="https://sasswave.in/docs/" target="_blank" rel="noopener noreferrer">Docs</Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <h1 className={styles.h1}>Design-ready React + Next.js components - built with SCSS</h1>
          <p className={styles.lead}>
            SassWave is a small, focused UI library that prefers SCSS and accessible, animated components.
            Ship faster with prebuilt building blocks.
          </p>
          <div className={styles.ctas}>
            <Link className={styles.primary} href="https://sasswave.in/docs/get-started/installation/" target="_blank" rel="noopener noreferrer">
              Get Started
            </Link>
            <Link className={styles.secondary} href="https://sasswave.in/components/" target="_blank" rel="noopener noreferrer">
              Browse Components
            </Link>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>© {new Date().getFullYear()} SassWave -- Built with SCSS</p>
        </footer>
      </main>
    </div>
  );
}
`;
}

async function removeTailwindArtifacts(projectDir) {
    for (const rel of tailwindArtifacts) {
        const full = path.join(projectDir, rel);
        if (await fs.pathExists(full)) {
            await fs.remove(full);
            log(`Removed Tailwind file: ${rel}`);
        }
    }

    const pkgPath = path.join(projectDir, 'package.json');
    if (!(await fs.pathExists(pkgPath))) return;

    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    const twDeps = ['tailwindcss', '@tailwindcss/postcss'];
    const sections = ['dependencies', 'devDependencies'];
    let changed = false;

    for (const sect of sections) {
        if (!pkg[sect]) continue;
        for (const dep of twDeps) {
            if (pkg[sect][dep]) {
                delete pkg[sect][dep];
                changed = true;
                log(`Removed Tailwind dependency: ${dep} from ${sect}`);
            }
        }
    }

    if (changed) await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
}

/**
 * Applies SassWave defaults to freshly created Next.js apps.
 */
export async function setupNextProject(answers, projectDir) {
    const appDir = path.join(projectDir, 'src', 'app');
    await removeTailwindArtifacts(projectDir);
    await fs.ensureDir(appDir);

    const isTs = answers.language === 'TypeScript';
    const globalsPath = path.join(appDir, 'globals.scss');
    const modulePath = path.join(appDir, 'page.module.scss');
    const layoutPath = await resolveTargetFile(appDir, isTs ? layoutCandidates.ts : layoutCandidates.js);
    const pagePath = await resolveTargetFile(appDir, isTs ? pageCandidates.ts : pageCandidates.js);

    await fs.outputFile(globalsPath, globalsTemplate(), 'utf8');
    await fs.outputFile(modulePath, pageModuleTemplate(), 'utf8');
    await fs.outputFile(layoutPath, layoutTemplate(isTs), 'utf8');
    await fs.outputFile(pagePath, pageTemplate(), 'utf8');

    log('Rebuilt Next.js entry files (layout & page) with SassWave defaults');
    await downloadAssets(answers, projectDir);
}
