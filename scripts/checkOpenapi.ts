/**
 * @file checkOpenapi.ts
 * @description Static consistency check: every Express route mounted by the
 *              app must appear in docs/openapi.json, and vice-versa.
 *              Run: `npm run docs:check`.
 * @author VehicleMarket Backend
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const ROUTES_DIR = path.join(ROOT, 'src', 'routes');
const SPEC_PATH = path.join(ROOT, 'docs', 'openapi.json');

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

/** Express `:param` → OpenAPI `{param}`. */
const toOpenApiPath = (p: string): string =>
  p.replace(/:([A-Za-z0-9_]+)/g, '{$1}').replace(/\/+/g, '/').replace(/\/$/, '') || '/';

/** Collect (METHOD, path) pairs from a router source file. */
const collectFromFile = (file: string): { method: string; sub: string }[] => {
  const src = fs.readFileSync(file, 'utf-8').replace(/\s+/g, ' ');
  const out: { method: string; sub: string }[] = [];
  const re = new RegExp(`router\\.(${METHODS.join('|')})\\(\\s*['"\`]([^'"\`]+)['"\`]`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.push({ method: m[1].toUpperCase(), sub: m[2] });
  return out;
};

const main = (): void => {
  if (!fs.existsSync(SPEC_PATH)) {
    console.error(`✖ Spec not found at ${SPEC_PATH}. Run \`node scripts/generateOpenapi.js\` first.`);
    process.exit(1);
  }
  const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf-8'));
  const documented = new Set<string>();
  for (const [p, ops] of Object.entries(spec.paths as Record<string, Record<string, unknown>>)) {
    for (const method of Object.keys(ops)) documented.add(`${method.toUpperCase()} ${toOpenApiPath(p)}`);
  }

  // Discover prefix map from routes/index.ts: router.use('/auth', authRoutes)
  const indexSrc = fs.readFileSync(path.join(ROUTES_DIR, 'index.ts'), 'utf-8');
  const prefixByFile: Record<string, string> = {};
  const useRe = /router\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*([A-Za-z0-9_]+)/g;
  let um: RegExpExecArray | null;
  const fileByVar: Record<string, string> = {};
  for (const f of fs.readdirSync(ROUTES_DIR)) {
    if (f.endsWith('.routes.ts')) fileByVar[f.replace('.routes.ts', 'Routes')] = f;
  }
  while ((um = useRe.exec(indexSrc))) prefixByFile[fileByVar[um[2]]] = um[1];

  // sitemap.routes is mounted at root in app.ts
  prefixByFile['sitemap.routes.ts'] = '';

  const found = new Set<string>();
  const missing: string[] = [];
  for (const f of fs.readdirSync(ROUTES_DIR)) {
    if (!f.endsWith('.routes.ts')) continue;
    const prefix = prefixByFile[f] ?? '';
    const base = prefix ? `/api/v1${prefix}` : '';
    for (const { method, sub } of collectFromFile(path.join(ROUTES_DIR, f))) {
      const full = toOpenApiPath(`${base}${sub}`);
      found.add(`${method} ${full}`);
      if (!documented.has(`${method} ${full}`)) missing.push(`${method} ${full}  (${f})`);
    }
  }

  const extra = [...documented].filter((d) => !found.has(d));

  console.log(`Documented operations: ${documented.size}`);
  console.log(`Mounted operations:    ${found.size}`);
  if (missing.length) {
    console.error(`\n✖ Routes NOT documented in openapi.json (${missing.length}):`);
    missing.forEach((m) => console.error('   - ' + m));
  }
  if (extra.length) {
    console.warn(`\n⚠ Documented but not mounted (${extra.length}):`);
    extra.forEach((m) => console.warn('   - ' + m));
  }
  if (missing.length) process.exit(1);
  console.log('\n✔ Every mounted route is documented in openapi.json');
};

main();
