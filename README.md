# 21 Beans — site

Site static pentru **21 Beans**, cafenea de specialitate & cocktails lounge,
Str. 1 Decembrie nr. 104-106, Bloc 1, Parter, City Nord, Tunari, Ilfov 077180.

HTML5 semantic, CSS3 modern, JavaScript vanilla. Fără framework-uri, fără
build obligatoriu, fără dependențe la runtime. Fonturile sunt găzduite local,
deci site-ul nu face nicio cerere către servere terțe.

---

## Structura

```
.
├── index.html              Prima pagină
├── despre-noi.html         Despre 21 Beans
├── meniu.html              Meniul complet (HTML real, indexabil)
├── contact.html            Adresă, telefon, WhatsApp, Instagram, Maps
├── 404.html                Pagină de eroare
├── 21_Beans_Menu.pdf       Meniul PDF (variantă secundară, de descărcat)
├── favicon.ico
├── robots.txt
├── sitemap.xml
├── site.webmanifest
│
├── assets/
│   ├── css/style.css       Toate stilurile, într-un singur fișier comentat
│   ├── js/main.js          Header, meniu mobil, reveal, scrollspy
│   ├── fonts/              Fraunces + Inter (woff2, latin & latin-ext)
│   └── img/                Fotografii responsive (webp + jpg), logo, iconițe
│
├── data/
│   └── menu.json           SURSA DE ADEVĂR pentru meniu
│
└── build/
    ├── build-menu.mjs      Generează meniul din data/menu.json
    ├── build-layout.mjs    Sincronizează header & footer în toate paginile
    └── partials/           header.html, footer.html
```

## Publicare

Site-ul este complet static: se încarcă folderul ca atare pe orice hosting
(inclusiv cel actual). Nu are nevoie de Node, PHP sau bază de date pe server.

Căile sunt absolute (`/assets/...`), deci site-ul trebuie servit **din rădăcina
domeniului**. Pentru testare locală:

```bash
python3 -m http.server 8080
# apoi http://127.0.0.1:8080
```

---

## Cum modifici meniul (cel mai frecvent lucru)

Prețurile, produsele și categoriile **nu se editează direct în `meniu.html`**.
Se editează într-un singur loc, `data/menu.json`, apoi se regenerează pagina:

```bash
node build/build-menu.mjs
```

Scriptul rescrie în `meniu.html`:

- secțiunile de meniu (HTML static, text real — Google îl poate indexa),
- tab-urile de categorii,
- structured data `schema.org/Menu`, cu prețurile.

Exemplu — schimbi prețul la Flat White:

```json
{ "name": "Flat White", "price": 21 }
```

devine

```json
{ "name": "Flat White", "price": 22 }
```

și rulezi `node build/build-menu.mjs`. Atât.

Câmpuri disponibile pentru un produs:

| câmp | rol |
|---|---|
| `name` | denumirea (obligatoriu) |
| `price` | preț numeric, în lei |
| `priceText` | preț ne-numeric, ex. `"15 / 18"` (înlocuiește `price`) |
| `variant` | linie mică sub nume, ex. `"Single Shot / Double Shot"` |
| `description` | descriere / ingrediente |
| `badge` | etichetă, ex. `"Nou"` |
| `footnote` | marcaj, ex. `"*"` |

Doar prețurile numerice ajung în structured data — un preț ambiguu nu se
publică drept ofertă fermă către Google.

## Cum modifici header-ul sau footer-ul

Se editează **o singură dată**, în `build/partials/header.html` și
`build/partials/footer.html`, apoi:

```bash
node build/build-layout.mjs
```

Scriptul le copiază în toate cele 5 pagini și marchează automat pagina
curentă cu `aria-current="page"`. Așa nu se mai întâmplă să schimbi numărul
de telefon în 4 din 5 fișiere.

## Cum schimbi fotografiile

Pune imaginile noi în `assets/img/` păstrând tiparul de nume
(`nume-480`, `nume-800`, `nume-1200`, `nume-1600`, în `.webp` și `.jpg`) și
actualizează `srcset`-urile. Toate `<img>`-urile au deja `width`/`height`,
`loading="lazy"` unde e cazul și `object-fit: cover`, deci nu apar sărituri
de layout și nu se deformează nimic.

---

## Ce s-a păstrat din site-ul vechi

Toate informațiile reale, verificate la sursă:

- poziționarea „Cafenea ziua. Bar seara." și textul de prezentare,
- adresa completă,
- telefonul `0733 279 297` (`tel:+40733279297`),
- linkul WhatsApp cu mesajul precompletat,
- Instagram `@21beansspecialty`,
- linkul Google Maps,
- cele două fotografii reale ale locației,
- logoul 21 Beans,
- meniul PDF, acum ca variantă secundară de descărcat.

Nu au fost inventate produse, prețuri, ingrediente, program, recenzii sau
fotografii.

## Meniul: din PDF în HTML

Meniul a fost extras din `21_Beans_Menu.pdf` (text + verificare vizuală a
fiecărei pagini) și rescris ca HTML real: **41 de produse**, 4 categorii,
plus alergeni și valori nutriționale. PDF-ul rămâne disponibil ca
„Descarcă meniul PDF", dar nu mai este modul principal de afișare.

### Două corecturi față de PDF

PDF-ul are, în secțiunea Espresso, 6 rânduri de preț pentru 5 produse, iar
coloanele nu se mai potrivesc. Corecturile confirmate:

1. `Espresso 12 lei` / `Espresso Double 15 lei`
   (în PDF apar inversate: dublul mai ieftin decât simplul).
2. `Espresso Cold Brew Tonic — 25 lei`
   (denumirea se rupe pe două rânduri în PDF și are două prețuri alăturate,
   15 și 25).

Restul valorilor sunt preluate exact. Diacriticele au fost normalizate
(`Bere artizanală`, `prăjitură cu ciocolată și vișine`).

## Program de funcționare

Nu este publicat în niciun material 21 Beans, deci nu a fost inventat.
Structura e pregătită în `contact.html` (blocul comentat `PROGRAM`) și
instrucțiunile pentru `openingHoursSpecification` sunt în comentariul din
`<head>`-ul aceleiași pagini. Se completează în două minute.

---

## SEO

- HTML semantic, un singur `<h1>` pe pagină, ierarhie corectă `h1 → h2 → h3`.
- `<title>` și `meta description` unice, în limitele recomandate.
- Open Graph + Twitter Card, cu imagine 1200×630 generată din fotografia reală.
- `canonical` pe fiecare pagină, `lang="ro"`.
- `alt` descriptiv pe toate imaginile de conținut; imaginile decorative sunt
  marcate `aria-hidden`.
- `robots.txt` + `sitemap.xml`.
- Structured data:
  - `CafeOrCoffeeShop` (nume, adresă, telefon, Instagram, hartă, link meniu),
  - `Menu` cu toate secțiunile și prețurile,
  - `BreadcrumbList` pe paginile interioare,
  - `ContactPage`, `WebSite`.
- Meniul este text real în pagină — produsele și prețurile pot fi găsite prin
  căutare.

## Performanță

Prima încărcare a paginii principale: **~350 KB** (HTML + CSS + JS + 2 fonturi
+ fotografia hero în WebP + logo). Zero librării externe, zero cereri către
alte domenii.

- Fonturi variabile woff2, găzduite local, `font-display: swap`, `preload` pe
  subsetul latin.
- Imagini responsive `webp` + `jpg` fallback, cu `srcset`/`sizes`.
- `loading="lazy"` sub prima vizualizare, `fetchpriority="high"` pe hero.
- `width`/`height` peste tot → fără layout shift.
- JavaScript: un singur fișier de ~8 KB, `defer`, un `IntersectionObserver`
  pentru reveal și un handler de scroll cu `requestAnimationFrame`.
- Textura de film e un SVG inline în CSS, nu o imagine.

## Accesibilitate

- Tot textul trece pragul WCAG AA (verificat programatic, inclusiv textul de
  peste fotografii, măsurat pe pixelii reali ai imaginii).
- Skip link, focus vizibil peste tot, navigare completă cu tastatura.
- Meniul mobil: `aria-expanded`, `aria-hidden`, focus trap, închidere cu
  `Escape`, focusul revine pe buton.
- `prefers-reduced-motion` respectat integral — animațiile se opresc, iar
  conținutul rămâne vizibil.
- Fără JavaScript, site-ul rămâne complet lizibil și navigabil.
- Nicio dimensiune de text sub 11,5 px.

## Testare

Testele au rulat în Chromium real (Playwright), pe 5 pagini × 6 dimensiuni de
ecran (1440, 1280, 768, 390, 360 și 320 px):

- erori de consolă și cereri eșuate: **0**
- link-uri și ancore moarte: **0**
- overflow orizontal: **0**
- imagini care nu se încarcă sau se deformează: **0**
- meniul mobil: deschidere, închidere, `Escape`, focus, navigare — toate
  verificate prin click real
- tab-urile de meniu: ancore, poziția titlului sub bara lipită și tab-ul activ,
  verificate la încărcare, la click și la ambele capete ale paginii
- contrast WCAG AA pe tot site-ul: trecut

Scriptul de audit e păstrat separat de site (nu se publică).
