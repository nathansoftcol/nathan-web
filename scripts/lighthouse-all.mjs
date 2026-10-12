import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const base = 'http://127.0.0.1:4173';
const pages = [
  ['index', `${base}/`],
  ['servicios', `${base}/servicios.html`],
  ['contacto', `${base}/contacto.html`],
  ['nosotros', `${base}/nosotros.html`],
  ['productos', `${base}/productos.html`],
  ['industrias', `${base}/industrias.html`],
  ['404', `${base}/404.html`],
];

const flags =
  '--only-categories=performance --form-factor=mobile --screenEmulation.mobile --chrome-flags="--headless=new" --quiet --output=json';

for (const [name, url] of pages) {
  const out = path.join(root, `lh-all-${name}.json`);
  process.stderr.write(`Lighthouse móvil: ${name} …\n`);
  execSync(`npx --yes lighthouse "${url}" ${flags} --output-path="${out}"`, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: true,
  });
}

const rows = [];
for (const [name] of pages) {
  const p = path.join(root, `lh-all-${name}.json`);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  rows.push({
    página: name,
    perf_pct: Math.round((j.categories.performance?.score ?? 0) * 100),
    LCP_ms: Math.round(j.audits['largest-contentful-paint']?.numericValue ?? 0),
    FCP_ms: Math.round(j.audits['first-contentful-paint']?.numericValue ?? 0),
    TBT_ms: Math.round(j.audits['total-blocking-time']?.numericValue ?? 0),
    SI_ms: Math.round(j.audits['speed-index']?.numericValue ?? 0),
  });
}
console.table(rows);
