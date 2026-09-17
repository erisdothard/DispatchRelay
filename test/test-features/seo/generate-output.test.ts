/**
 * End-to-end: run the generator against a scratch dist and inspect what lands.
 *
 * The case that matters most is a rebuild. Vite does not reliably empty `dist`,
 * so the generator can find last run's `app.html` beside a freshly built
 * `index.html` — keeping the old one would serve an app shell pointing at asset
 * hashes that no longer exist.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const generator = resolve(__dirname, '../../../scripts/seo/generate.mjs');

const spaShell = (assetHash: string) =>
  `<!doctype html><html><head><title>App</title></head><body><div id="root"></div>` +
  `<script type="module" src="/assets/index-${assetHash}.js"></script></body></html>`;

let dist: string;

async function generate() {
  return run('node', [generator], { env: { ...process.env, SEO_DIST_DIR: dist } });
}

beforeEach(async () => {
  dist = await mkdtemp(join(tmpdir(), 'seo-dist-'));
});

afterEach(async () => {
  await rm(dist, { recursive: true, force: true });
});

describe('generator output', () => {
  it('moves the SPA entry aside and writes every page', async () => {
    await writeFile(join(dist, 'index.html'), spaShell('AAA'), 'utf8');
    await generate();

    expect(await readFile(join(dist, 'app.html'), 'utf8')).toContain('id="root"');

    const home = await readFile(join(dist, 'index.html'), 'utf8');
    expect(home).not.toContain('id="root"');
    expect(home).toContain('<h1>');

    for (const page of ['for/carriers', 'for/brokers', 'for/shippers']) {
      expect(await readFile(join(dist, page, 'index.html'), 'utf8')).toContain('<h1>');
    }

    const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://dispatchrelay.co/for/carriers</loc>');
  });

  it('replaces a stale app.html left by a previous build', async () => {
    // Previous build's shell, pointing at assets this build no longer emits.
    await writeFile(join(dist, 'app.html'), spaShell('OLD'), 'utf8');
    await writeFile(join(dist, 'index.html'), spaShell('NEW'), 'utf8');

    await generate();

    const shell = await readFile(join(dist, 'app.html'), 'utf8');
    expect(shell).toContain('index-NEW.js');
    expect(shell).not.toContain('index-OLD.js');
  });

  it('is safe to run twice without eating the app shell', async () => {
    await writeFile(join(dist, 'index.html'), spaShell('AAA'), 'utf8');
    await generate();
    await generate();

    expect(await readFile(join(dist, 'app.html'), 'utf8')).toContain('id="root"');
    expect(await readFile(join(dist, 'index.html'), 'utf8')).not.toContain('id="root"');
  });

  it('refuses to run when there is no build output', async () => {
    await expect(generate()).rejects.toThrow(/run the Vite build first/);
  });

  it('refuses to clobber an unrecognisable dist', async () => {
    await writeFile(join(dist, 'index.html'), '<html><body>not the app</body></html>', 'utf8');
    await expect(generate()).rejects.toThrow(/build output looks wrong/);
  });

  it('leaves the rest of the build alone', async () => {
    await mkdir(join(dist, 'assets'), { recursive: true });
    await writeFile(join(dist, 'assets', 'index-AAA.js'), 'console.log(1)', 'utf8');
    await writeFile(join(dist, 'index.html'), spaShell('AAA'), 'utf8');

    await generate();

    expect(await readFile(join(dist, 'assets', 'index-AAA.js'), 'utf8')).toBe('console.log(1)');
  });
});
