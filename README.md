# SassWave Create CLI

A small CLI to scaffold a SassWave-ready frontend project.

## Features

- Prompts for app name, framework, package manager, git init, and optional 3D stack
- Uses Vite to scaffold React/Preact apps or a minimal vanilla setup
- Installs Sass and wires a starter `styles.scss`
- Optional 3D setup with `three`, `@react-three/fiber`, and `@react-three/drei`
 - Next.js presets with Sass-based hero layout and optional asset downloading via a manifest

## Install (local dev)

```bash
npm install
npm run dev
```

## Install globally (for real use)

From this folder:

```bash
npm install -g .
```

Then run:

```bash
sasswave-create
```

Follow the prompts to generate a new project.

## Downloading custom assets automatically

Place the URLs you want to pull into generated projects inside `assets-manifest.json` at the root of this CLI. Each entry looks like:

```json
[
	{
		"url": "https://example.com/assets/favicon.svg",
		"dest": "public/favicon.svg",
		"frameworks": ["next.js"]
	}
]
```

- `url`: Remote asset to download.
- `dest`: Path inside the generated project (relative to its root).
- `frameworks` / `framework`: Optional filter so you only download specific assets for e.g. `next.js` vs `react`.

By default the manifest is empty—copy `assets-manifest.example.json` to `assets-manifest.json` and edit it with your own files to enable the feature.
