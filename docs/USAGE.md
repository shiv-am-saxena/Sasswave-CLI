# SassWave Create CLI — Usage Guide

This document captures everything you need to know to operate, customize, and extend the SassWave Create CLI.

## 1. What the CLI Does

- Prompts for project metadata (name, framework, language, package manager, Git init, optional 3D stack).
- Scaffolds either a Next.js app (via `create-next-app`) or a Vite React app (via `create-vite`).
- Installs `sass`, rewrites entry files, injects SassWave-branded layouts, and (optionally) adds a ready-made Three.js scene.
- Downloads branded assets declared in `assets-manifest.json` (favicons, fonts, hero artwork, etc.).
- Automatically launches the development server (`npm run dev`, `bun dev`, etc.) for both frameworks once setup is complete.

## 2. Prerequisites

- Node.js 18+ (recommended 20+).
- One of the supported package managers: `npm` or `bun`.
- Git (optional, only if you answer “yes” to the Git prompt).
- Internet access for template downloads and optional asset fetching.

## 3. Installing the CLI

### Local development
```bash
npm install
node sasswave-create-cli.js
```

### Global install (for day-to-day use)
```bash
npm install -g .
```
Then run the binary from anywhere:
```bash
sasswave-create
```

## 4. Prompt Flow

1. **App name** — folder that will hold the generated project.
2. **Framework** — `react` (Vite) or `next.js`.
3. **Language** — `JavaScript` or `TypeScript`.
4. **Package manager** — `npm` or `bun`.
5. **Initialize git repo?** — runs `git init` when enabled.
6. **3D setup?** — for React only. Installs `three`, `@react-three/fiber`, `@react-three/drei` and injects a starter scene.

## 5. Framework-Specific Behavior

### Next.js
- Uses `create-next-app@latest` with flags: `--src-dir`, `--app`, `--react-compiler`, `--eslint`, and `--tailwind false`.
- Removes Tailwind/PostCSS boilerplate and SVGs.
- Rebuilds `src/app/layout.*`, `src/app/page.*`, `globals.scss`, and `page.module.scss` with SassWave hero styles.
- Downloads manifest assets into `src/app` or `public` (e.g., favicon, Urbanist font, hero imagery).

### React (Vite)
- Uses `create-vite@latest`. For TS projects, passes `--no-rolldown`. For all projects, passes `--no-interactive` to skip follow-up prompts.
- Deletes Vite’s default `src/index.css` and `src/App.css`.
- Rewrites `src/App.(t|j)sx`, `src/App.module.scss`, `src/main.(t|j)sx`, `src/styles.scss`, and `index.html` with SassWave-specific content (favicon + title = “SassWave UI”).
- Downloads manifest assets (e.g., wordmark, Urbanist font, React favicon) into `public/`.

## 6. Asset Manifest Workflow

`assets-manifest.json` defines any remote files the CLI should pull into newly scaffolded apps.

```json
[
  {
    "url": "https://example.com/favicon.ico",
    "dest": "public/favicon.ico",
    "frameworks": ["react", "next.js"],
    "description": "Custom brand favicon"
  }
]
```

- `url` — HTTPS (or HTTP) location of the asset.
- `dest` — path inside the scaffolded project (relative to project root).
- `frameworks` / `framework` (optional) — restrict downloads to specific frameworks.
- Entries without the filter apply to every project.

**Tip:** maintain a companion `assets-manifest.example.json` so teammates can copy/modify without committing secrets.

## 7. Optional React 3D Setup

When the user opts in:
- Installs `three`, `@react-three/fiber`, `@react-three/drei` via the chosen package manager.
- Adds `src/ThreeScene.jsx` containing a starter canvas with orbit controls.
- Injects the scene into `src/App.(t|j)sx` (if not already present).

## 8. Automatic Dev Server Launch

After post-install tasks finish, the CLI automatically starts the dev server:
- Next.js → `npm run dev` or `<pm> dev`.
- React (Vite) → `npm run dev` or `bun dev`.

Use `Ctrl+C` to stop when you are ready.

## 9. Troubleshooting

| Issue | Fix |
| --- | --- |
| Directory already exists | Choose a different project name or remove the folder before re-running. |
| `create-next-app` / `create-vite` download errors | Ensure internet access and that `npx`/`bun` can reach npm. |
| Manifest downloads fail | Verify URLs are reachable and `dest` points inside the project (the CLI skips paths outside the root). |
| Dev server fails to start | Run `npm install` (if using npm) or `bun install` manually and retry `npm run dev`. |

## 10. Extending the CLI

- **New frameworks** — add scaffolding logic in `src/scaffold.js`, then create matching post-install helpers.
- **Custom templates** — update `src/lib/nextSetup.js` or `src/lib/reactSetup.js` to tweak generated files.
- **More prompts** — edit `src/prompts.js` and thread the new answer through `sasswave-create-cli.js` and downstream modules.

---
Maintainers: update this guide whenever you add prompts, frameworks, or post-install flows so users have a single authoritative reference.
