# SassWave Create CLI

`sasswave-create` is a zero-config scaffolding tool that spins up SassWave-branded React or Next.js apps. It installs Sass, rewrites key entry files with curated layouts, downloads optional assets, and can even drop in a Three.js scene when requested.

## What You Get

- Guided prompts for app name, framework (React via Vite or Next.js), language, package manager, Git init, and optional 3D setup.
- Vite React projects: deletes default CSS, rewrites `App.(t|j)sx`, `App.module.scss`, `main.(t|j)sx`, `styles.scss`, and `index.html` with SassWave-ready markup + branding.
- Next.js projects: runs `create-next-app` with the right flags, removes Tailwind/PostCSS boilerplate, and rebuilds `layout.*`, `page.*`, `globals.scss`, and `page.module.scss` using SassWave defaults.
- Asset manifest integration: ship favicons, fonts, and hero artwork by editing `assets-manifest.json`.
- Optional React 3D mode that installs `three`, `@react-three/fiber`, `@react-three/drei`, and drops in a starter `ThreeScene`.
- Automatic `npm run dev` / `bun dev` launch when scaffolding finishes.

## Install & Run

### Via npm (recommended)

```bash
npm install -g sasswave
sasswave-create
```

### One-off (npx)

```bash
npx sasswave-create
```

Follow the prompts and the CLI will scaffold the requested stack inside the folder you provide.
