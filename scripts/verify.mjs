// Verification harness for brendantscoggin.com.
// Checks, for every page, in both color schemes and at two widths:
//   1. no console errors
//   2. every internal link resolves, and every #fragment exists in its target
//   3. the page is actually styled (catches a missing/broken stylesheet)
//   4. no horizontal overflow at 375px
// Screenshots land in .verify-shots/ for eyeballing.
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.verify-shots');

const DEFAULT_PAGES = [
  'index.html',
  'work.html',
  'who-i-am.html',
  'what-ive-done.html',
  'what-im-doing.html',
  'resume.html',
  'tools/mac-maid/index.html',
  'tools/judge-moody/index.html',
];

const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;
const SCHEMES = ['dark', 'light'];
const WIDTHS = [375, 1440];

const failures = [];
const fail = (msg) => { failures.push(msg); console.error('FAIL ' + msg); };
const pass = (msg) => console.log('  ok  ' + msg);

// --- static check: links and anchors resolve -------------------------------
function checkLinks(pageFile) {
  const abs = path.join(ROOT, pageFile);
  if (!existsSync(abs)) { fail(`${pageFile}: file does not exist`); return; }
  const html = readFileSync(abs, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (/^(https?:|mailto:|tel:|data:|#|\/)/.test(href)) continue;
    const [file, frag] = href.split('#');
    if (!file) continue;
    const target = path.join(path.dirname(abs), file);
    if (!existsSync(target)) { fail(`${pageFile}: link target missing -> ${href}`); continue; }
    if (frag) {
      const targetHtml = readFileSync(target, 'utf8');
      if (!targetHtml.includes(`id="${frag}"`)) {
        fail(`${pageFile}: anchor #${frag} not found in ${file}`);
      } else {
        pass(`${pageFile}: ${href}`);
      }
    }
  }
}

// --- browser checks --------------------------------------------------------
async function checkRendered(browser, pageFile, scheme, width) {
  const ctx = await browser.newContext({
    colorScheme: scheme,
    viewport: { width, height: 900 },
  });
  const page = await ctx.newPage();
  const errors = [];
  // Third-party hosts (e.g. web.archive.org hotlinks) go down intermittently and are
  // outside this site's control, so their failures are reported but do not fail the run.
  // A MISSING LOCAL ASSET is a real bug and does fail.
  const externalFailures = [];
  page.on('requestfailed', (r) => {
    const url = r.url();
    if (url.startsWith('file://')) {
      errors.push(`missing local asset: ${url}`);
    } else {
      externalFailures.push(`${new URL(url).host} (${(r.failure() || {}).errorText})`);
    }
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Suppress the generic message that accompanies a third-party request failure.
    if (/Failed to load resource/i.test(m.text())) return;
    errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(pathToFileURL(path.join(ROOT, pageFile)).href, { waitUntil: 'load' });

  const label = `${pageFile} [${scheme} ${width}px]`;

  if (errors.length) fail(`${label}: ${errors.join(' | ')}`);
  if (externalFailures.length) {
    console.log(`  note ${label}: third-party resource unavailable -> ${[...new Set(externalFailures)].join(', ')}`);
  }

  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const unstyled = bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
  if (unstyled) fail(`${label}: page is UNSTYLED (body background is ${bg})`);

  if (width === 375) {
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) fail(`${label}: horizontal overflow of ${overflow}px`);
  }

  mkdirSync(OUT, { recursive: true });
  const shot = `${pageFile.replace(/[\/.]/g, '_')}-${scheme}-${width}.png`;
  await page.screenshot({ path: path.join(OUT, shot), fullPage: width === 1440 });

  if (!errors.length && !unstyled) pass(label);
  await ctx.close();
}

// --- run -------------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
console.log('Checking links and anchors...');
for (const p of pages) checkLinks(p);

console.log('Checking rendered pages...');
const browser = await chromium.launch();
for (const p of pages) {
  if (!existsSync(path.join(ROOT, p))) continue;
  for (const scheme of SCHEMES) {
    for (const width of WIDTHS) {
      await checkRendered(browser, p, scheme, width);
    }
  }
}
await browser.close();

console.log('');
if (failures.length) {
  console.error(`${failures.length} failure(s).`);
  process.exit(1);
}
console.log(`All checks passed. Screenshots in ${path.relative(ROOT, OUT)}/`);
