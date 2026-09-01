// `strapi build` only transpiles `src/**/*.ts` into `dist/` — it does not
// copy plain (non-TS) files. The bundled article Markdown that
// `src/bootstrap/articles.ts` reads at runtime (via `readFileSync`,
// relative to its own `__dirname`) would otherwise be silently missing from
// the production image, since `apps/cms/Dockerfile` ships only `dist/`
// (via `pnpm deploy --prod`), never `src/`. Run after every `strapi build`.
const { cpSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const SRC = join(__dirname, '..', 'src', 'bootstrap', 'articles');
const DEST = join(__dirname, '..', 'dist', 'src', 'bootstrap', 'articles');

if (!existsSync(SRC)) {
  throw new Error(`[copy-bootstrap-assets] source directory not found: ${SRC}`);
}

cpSync(SRC, DEST, { recursive: true });

console.log(`[copy-bootstrap-assets] copied ${SRC} -> ${DEST}`);
