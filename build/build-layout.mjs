#!/usr/bin/env node
/**
 * 21 Beans — sincronizare header & footer
 * -------------------------------------------------------------
 * Header-ul și footer-ul se editează O SINGURĂ DATĂ, în
 * build/partials/header.html și build/partials/footer.html.
 * Scriptul le copiază în toate paginile, între marcajele:
 *   <!-- HEADER:START --> ... <!-- HEADER:END -->
 *   <!-- FOOTER:START --> ... <!-- FOOTER:END -->
 *
 * Marchează automat pagina curentă cu aria-current="page".
 *
 * Rulare:  node build/build-layout.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const header = readFileSync(join(ROOT, 'build/partials/header.html'), 'utf8').trim();
const footer = readFileSync(join(ROOT, 'build/partials/footer.html'), 'utf8').trim();

/** fișier → cheia data-page care primește aria-current */
const PAGES = {
  'index.html': 'acasa',
  'despre-noi.html': 'despre',
  'meniu.html': 'meniu',
  'contact.html': 'contact',
  '404.html': null
};

function inject(html, marker, content) {
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(html)) throw new Error(`Marcajul ${marker} lipsește`);
  return html.replace(re, `${start}\n${content}\n${end}`);
}

/** Adaugă aria-current="page" pe link-urile paginii curente. */
function markCurrent(markup, page) {
  if (!page) return markup;
  return markup.replace(
    new RegExp(`(<a\\b[^>]*\\bdata-page="${page}")`, 'g'),
    '$1 aria-current="page"'
  );
}

let touched = 0;

for (const [file, page] of Object.entries(PAGES)) {
  const path = join(ROOT, file);
  let html;

  try {
    html = readFileSync(path, 'utf8');
  } catch {
    console.warn(`· ${file} — inexistent, sărit`);
    continue;
  }

  const next = inject(
    inject(html, 'HEADER', markCurrent(header, page)),
    'FOOTER',
    footer
  );

  if (next !== html) {
    writeFileSync(path, next);
    touched++;
    console.log(`✓ ${file}`);
  } else {
    console.log(`· ${file} — deja la zi`);
  }
}

console.log(`\nLayout sincronizat (${touched} fișier(e) modificate).`);
