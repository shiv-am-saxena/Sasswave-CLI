import fs from 'fs-extra';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function requestClient(url) {
    return url.startsWith('https') ? https : http;
}

async function downloadFile(url, destination, redirectCount = 0) {
    const MAX_REDIRECTS = 5;
    await fs.ensureDir(path.dirname(destination));

    return new Promise((resolve, reject) => {
        const client = requestClient(url);
        const req = client.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                if (redirectCount >= MAX_REDIRECTS) {
                    reject(new Error(`Too many redirects while downloading ${url}`));
                    return;
                }
                res.resume();
                downloadFile(res.headers.location, destination, redirectCount + 1).then(resolve).catch(reject);
                return;
            }

            if (res.statusCode !== 200) {
                reject(new Error(`Request for ${url} failed with status ${res.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(destination);
            res.pipe(fileStream);
            fileStream.on('finish', () => fileStream.close(resolve));
            fileStream.on('error', reject);
        });

        req.on('error', reject);
    });
}

async function loadAssetManifest() {
    const manifestPath = path.join(CLI_ROOT, 'assets-manifest.json');
    if (!(await fs.pathExists(manifestPath))) {
        return { entries: [], manifestPath };
    }

    try {
        const raw = await fs.readFile(manifestPath, 'utf8');
        const data = JSON.parse(raw);
        return { entries: Array.isArray(data) ? data : [], manifestPath };
    } catch (err) {
        log(`Unable to parse assets manifest: ${err.message || err}`);
        return { entries: [], manifestPath };
    }
}

/**
 * Pulls remote assets defined in assets-manifest.json into the freshly generated project.
 */
export async function downloadAssets(answers, projectDir) {
    const { entries, manifestPath } = await loadAssetManifest();
    if (!entries.length) {
        log(`No assets to download (assets-manifest.json not found or empty at ${manifestPath})`);
        return;
    }

    const applicable = entries.filter((entry) => {
        if (!entry || !entry.url) return false;
        if (Array.isArray(entry.frameworks)) return entry.frameworks.includes(answers.framework);
        if (entry.framework) return entry.framework === answers.framework;
        return true;
    });

    if (!applicable.length) {
        log('Asset manifest did not include entries for this framework; skipping downloads');
        return;
    }

    for (const entry of applicable) {
        try {
            let destRelative = entry.dest;
            if (!destRelative) {
                const parsed = new URL(entry.url);
                destRelative = path.join('public', path.basename(parsed.pathname) || 'asset');
            }
            const targetPath = path.resolve(projectDir, destRelative);
            if (!targetPath.startsWith(projectDir)) {
                log(`Skipping asset outside project root: ${destRelative}`);
                continue;
            }

            await downloadFile(entry.url, targetPath);
            log(`Downloaded asset -> ${path.relative(projectDir, targetPath)}`);
        } catch (err) {
            log(`Failed to download asset ${entry.url}:`, err.message || err);
        }
    }
}
