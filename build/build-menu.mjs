#!/usr/bin/env node
/**
 * 21 Beans — generator meniu static
 * -------------------------------------------------------------
 * Citește data/menu.json și scrie, DIRECT ÎN meniu.html, între marcajele:
 *   <!-- MENU:START --> ... <!-- MENU:END -->            (conținutul meniului)
 *   <!-- MENU-NAV:START --> ... <!-- MENU-NAV:END -->    (tab-urile de categorii)
 *   <!-- MENU-LD:START --> ... <!-- MENU-LD:END -->      (structured data schema.org)
 *
 * Rezultatul este HTML real, indexabil de Google — nu se randează din JavaScript.
 *
 * Rulare:  node build/build-menu.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://21beans.ro';

const data = JSON.parse(readFileSync(join(ROOT, 'data/menu.json'), 'utf8'));

/* ---------- utilitare ---------- */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const slug = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Prețul afișat: fie `price` (număr), fie `priceText` (ex. "15 / 18"). */
const priceLabel = (item) => {
  const raw = item.priceText != null ? item.priceText : item.price;
  return `${raw} ${data.currencyLabel}`;
};

/* ---------- randare ---------- */

function renderItem(item) {
  const id = slug(item.name);
  const badge = item.badge
    ? `<span class="menu-item__badge">${esc(item.badge)}</span>`
    : '';
  const footnote = item.footnote
    ? `<span class="menu-item__footnote" aria-hidden="true">${esc(item.footnote)}</span>`
    : '';
  const variant = item.variant
    ? `<span class="menu-item__variant">${esc(item.variant)}</span>`
    : '';
  const description = item.description
    ? `<p class="menu-item__desc">${esc(item.description)}</p>`
    : '';

  return `          <li class="menu-item" id="produs-${id}">
            <div class="menu-item__head">
              <h4 class="menu-item__name">${esc(item.name)}${footnote}${badge}</h4>
              <span class="menu-item__leader" aria-hidden="true"></span>
              <p class="menu-item__price">${esc(priceLabel(item))}</p>
            </div>
            ${variant}${variant && description ? '\n            ' : ''}${description}
          </li>`;
}

function renderGroup(group) {
  const aside = group.aside
    ? `        <aside class="menu-group__aside reveal">
          <p class="menu-group__aside-text">${esc(group.aside.text)}</p>
          <p class="menu-group__aside-meta">${esc(group.aside.meta)}</p>
        </aside>`
    : '';

  return `      <div class="menu-group">
        <h3 class="menu-group__title">${esc(group.title)}</h3>
        <ul class="menu-group__list">
${group.items.map(renderItem).join('\n')}
        </ul>
${aside}
      </div>`;
}

function renderSection(section) {
  const notes = section.notes?.length
    ? `      <p class="menu-section__notes">${section.notes.map(esc).join(' ')}</p>`
    : '';

  return `  <section class="menu-section reveal" id="${esc(section.id)}" aria-labelledby="${esc(section.id)}-title" data-menu-section>
    <header class="menu-section__header">
      <h2 class="menu-section__title" id="${esc(section.id)}-title">${esc(section.title)}</h2>
      <p class="menu-section__tagline">${esc(section.tagline)}</p>
    </header>
    <div class="menu-section__groups">
${section.groups.map(renderGroup).join('\n')}
    </div>
${notes}
  </section>`;
}

function renderNav() {
  const links = data.sections
    .map(
      (s) =>
        `      <li><a class="menu-nav__link" href="#${esc(s.id)}">${esc(s.title)}</a></li>`
    )
    .join('\n');

  return `    <ul class="menu-nav__list">
${links}
      <li><a class="menu-nav__link" href="#alergeni">Alergeni &amp; nutriție</a></li>
    </ul>`;
}

function renderExtras() {
  const a = data.allergens;
  const n = data.nutrition;

  return `  <section class="menu-extras reveal" id="alergeni" aria-labelledby="alergeni-title" data-menu-section>
    <header class="menu-section__header">
      <h2 class="menu-section__title" id="alergeni-title">Alergeni &amp; valori nutriționale</h2>
      <p class="menu-section__tagline">${esc(n.intro)}</p>
    </header>

    <div class="menu-extras__grid">
      <div class="allergens">
        <h3 class="menu-group__title">${esc(a.title)}</h3>
        <p class="allergens__intro">${esc(a.intro)}</p>
        <ul class="allergens__list">
${a.list.map((x) => `          <li>${esc(x)}</li>`).join('\n')}
        </ul>
        <p class="allergens__note">${esc(a.note)}</p>
      </div>

      <div class="nutrition">
        <h3 class="menu-group__title">${esc(n.title)}</h3>
        <table class="nutrition__table">
          <caption class="visually-hidden">Valori nutriționale orientative pentru băuturile și produsele 21 Beans</caption>
          <thead>
            <tr><th scope="col">Produs</th><th scope="col">Energie</th></tr>
          </thead>
          <tbody>
${n.rows
  .map(
    ([name, kcal]) =>
      `            <tr><th scope="row">${esc(name)}</th><td>${esc(kcal)}</td></tr>`
  )
  .join('\n')}
          </tbody>
        </table>
      </div>
    </div>
  </section>`;
}

/* ---------- structured data ---------- */

function renderJsonLd() {
  const menuSections = data.sections.map((section) => ({
    '@type': 'MenuSection',
    name: section.title,
    description: section.tagline,
    hasMenuSection: section.groups.map((group) => ({
      '@type': 'MenuSection',
      name: group.title,
      hasMenuItem: group.items.map((item) => {
        const entry = {
          '@type': 'MenuItem',
          name: item.variant ? `${item.name} (${item.variant})` : item.name
        };
        if (item.description) entry.description = item.description;
        // Doar prețurile numerice, neambigue, ajung în structured data.
        if (typeof item.price === 'number') {
          entry.offers = {
            '@type': 'Offer',
            price: item.price.toFixed(2),
            priceCurrency: data.currency
          };
        }
        return entry;
      })
    }))
  }));

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${SITE_URL}/meniu.html#menu`,
    name: 'Meniu 21 Beans',
    inLanguage: 'ro-RO',
    url: `${SITE_URL}/meniu.html`,
    hasMenuSection: menuSections
  };

  return `  <script type="application/ld+json">\n${JSON.stringify(ld, null, 2)
    .split('\n')
    .map((l) => '  ' + l)
    .join('\n')}\n  </script>`;
}

/* ---------- injectare ---------- */

function inject(html, marker, content) {
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(html)) {
    throw new Error(`Marcajul ${marker} lipsește din meniu.html`);
  }
  return html.replace(re, `${start}\n${content}\n  ${end}`);
}

const target = join(ROOT, 'meniu.html');
let html = readFileSync(target, 'utf8');

html = inject(html, 'MENU-NAV', renderNav());
html = inject(
  html,
  'MENU',
  [...data.sections.map(renderSection), renderExtras()].join('\n\n')
);
html = inject(html, 'MENU-LD', renderJsonLd());

writeFileSync(target, html);

const count = data.sections.reduce(
  (t, s) => t + s.groups.reduce((g, gr) => g + gr.items.length, 0),
  0
);
console.log(`✓ meniu.html regenerat — ${data.sections.length} categorii, ${count} produse.`);
