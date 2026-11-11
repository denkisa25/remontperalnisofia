# remontperalnisofia.com — rebuild

Static Astro site replacing a dead WordPress install. Bulgarian only, EUR only.
Read this file fully before writing code. Decisions here are settled — do not
re-open them.

---

## 1. The business

One man, Sofia (based in Банкя), repairs **washing machines and dryers only**,
in people's homes, 20+ years. Phone is the entire sales channel — he takes every
call himself. He is not technical: he barely uses email, a calendar system would
not work, and he will never log into a CMS.

He will **not** appear by name, face or photo. The site has no named owner, no
team page, no "за нас". Where a competitor would put a founder story, this site
puts specialisation: *only washing machines and dryers*.

Lead flow today is almost entirely Google Ads. Organic is negligible. Landing
pages will be wired to ad groups later, so page structure mirrors campaign
structure (section 4).

### Voice
Plain, concrete, no marketing adjectives. Describe faults the way a technician
describes them to a customer standing in their own kitchen. Never "професионален
екип", "висококачествено обслужване", "дългогодишен опит" — that is what every
competitor writes. Prefer specifics: "запушена тръбичка на пресостата",
"износена втулка за семеринга".

Plural "ние" is used throughout even though it is one man. Keep it — it is his
preference and it reads normally in Bulgarian trade copy.

**Never write "квалифицирани техници и инжинери"** (the old site's line). It is
false, and `инжинери` is misspelled.

---

## 2. Stack and deployment

- **Astro 5**, static output. Zero JS by default.
- One client island only: the symptom picker (section 9).
- Build in **GitHub Actions**, rsync `dist/` to cPanel `public_html` over SSH.
  The server never runs Node. Do **not** use cPanel's Git Version Control.
- Node 22. npm.
- No database. No PHP except one contact handler (section 7).

Required repo secrets (set by Mladen in GitHub, not by you):
`CPANEL_HOST`, `CPANEL_USER`, `CPANEL_SSH_KEY`, `CPANEL_PATH`.

Local: `npm install && npm run dev`.

### The reference design

`design/index.html` is the **approved design**, as a working single-file
prototype: layout, spacing, type scale, colours, the symptom picker behaviour,
the parallax bands, the districts accordion. Build components that match it.

Treat it as the reference implementation, not as inspiration. Where it and this
file disagree, this file wins — and say so rather than silently picking one.

---

## 3. Design tokens

Defined in `src/styles/tokens.css`. Use the variables, never raw hex in components.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#15181C` | body text, dark sections |
| `--ink-2` | `#3A4048` | secondary text |
| `--ink-3` | `#5C636C` | muted text (min 14px) |
| `--paper` | `#FFFFFF` | |
| `--mist` | `#F3F2EE` | alternating section background |
| `--line` | `#DEDCD5` | borders |
| `--brass` | `#B8860F` | **fills only** (buttons, rules) |
| `--brass-deep` | `#8A6408` | **brass-coloured text on light** |
| `--brass-lite` | `#F0CE7A` | brass text on dark |
| `--brass-wash` | `#FBF3DC` | tinted panels |
| `--brass-line` | `#EFE0B6` | borders inside tinted panels |

**Contrast rule, do not break it:** `--brass` on white is ~3.1:1 and fails for
text. Text that must look brass uses `--brass-deep` on light and `--brass-lite`
on dark. `--brass` is for backgrounds and borders.

### Type
- Display / headings: **Oswald** 500, uppercase, `letter-spacing: -0.01em`
- Body: **Golos Text** 400/500
- Numbers, codes, prices, eyebrows, labels: **JetBrains Mono** 400/500

Self-hosted via Fontsource (`src/styles/fonts.css`, subsets cyrillic, cyrillic-ext, latin) — no requests to Google. The mono face
for numerics is deliberate: every appliance carries a stamped rating plate, so
figures should read as machine data, not marketing.

### Logo
`public/logo.svg` — a perforated drum, flat brass on dark, plus
`logo-mono.svg` (one colour) for the favicon and anywhere on dark.

The mark is a vector reduction of the client's own photograph of a gold drum
interior, uploaded to his site in 2015 and used as his Facebook avatar ever
since. The same photograph is the homepage hero. **Logo and hero are
deliberately the same object** — that is the brand system, not a coincidence.

---

## 4. URL structure

```
/                         homepage (one page, anchor nav)
/povredi/<slug>/          one page per symptom
/marki/<slug>/            one page per brand
/greshki/                 error codes, generic (section 6)
/sushilni/                dryers overview
/raioni/                  coverage, one section per zone
/saveti/                  article index
/saveti/<slug>/           article
/poveritelnost/           privacy policy
/biskvitki/               cookie notice
```

**One page per ad group, never one page per keyword.** When brand-specific error
codes eventually exist, they become anchored sections inside the brand page
(`/marki/bosch/#e18`), never pages of their own — ~30 codes × 7 brands would be
200 near-duplicate thin pages and a cannibalisation problem.

**No page per квартал.** 100+ near-identical neighbourhood pages is the textbook
doorway-page pattern. Geo targeting lives in Ads campaign settings.

---

## 5. Content collections

`src/content.config.ts`. Three collections, all markdown + frontmatter. Adding a
fault later is a new file, not a code change. This is also how the whole thing
gets reused for a second technician or another trade: swap the content
directory, keep the templates.

### `povredi` — symptoms
Seeded from the client's existing "Чести Повреди" dropdown, which is real
technician vocabulary. Do not invent faults.

| slug | title | card |
|---|---|---|
| `ne-iztochva-voda` | Пералнята не източва водата | 01 |
| `ne-centrofugira` | Пералнята не центрофугира | 02 |
| `teche-voda` | Пералнята тече вода | 03 |
| `ne-zagryava` | Пералнята не загрява водата | 04 |
| `shum` | Силен шум при въртене | 05 |
| `blokiral-lyuk` | Люкът не се отваря | 06 |
| `ne-trygva` | Пералнята не тръгва изобщо | 07 |
| `sushilnya-ne-sushi` | Сушилнята не суши | 08 |

`src/content/povredi/ne-iztochva-voda.md` shows the shape; generate the other
seven from it. Every entry needs `symptom` — the sentence the caller says on the
phone — because it feeds the picker.

### `marki` — brands
`bosch`, `indesit`, `beko`, `lg`, `zanussi`, `aeg`, `ariston`.

**v1 brand pages carry common faults only — no error codes.** The schema has a
`codes` array (`{ code, title, body, povreda? }`) but it stays empty until the
client interview produces codes in his own words. `/greshki/` covers code
families generically in the meantime.

Do not compile codes from forums, from manufacturer PDFs, or from general
knowledge. A wrong error code sends someone to open the wrong panel on a machine
that is plugged in.

Every brand page carries the disclaimer in its footer: *"<Марка> е търговска
марка на съответния производител. Не сме оторизиран сервиз на производителя."*

### `saveti` — articles
Six posts recovered from the old database, in `docs/legacy-import/posts/`:
extending a washing machine's life, cleaning the filter, choosing a dryer, dryer
maintenance, 5 maintenance tips, and one on water not draining.

All arrive `draft: true` with `summary: TODO` and `category` set to
`poddrazhka` — fix the category per article and write the summaries.

The drainage one (`legacy-ne-iztochva-voda.md`) is a symptom article, not
advice: **merge it into `povredi/ne-iztochva-voda` rather than publishing
both.** Its old URL already redirects there. Use its wording where it beats the
placeholder prose — it is the client's own.

Migrate, don't rewrite. The plain technician phrasing is why these read as
credible. Any dishwasher references get re-scoped or cut; dishwashers are out of
scope.

---

## 6. Error codes — `/greshki/`

One generic page. Codes across all brands cluster into groups: drainage, water
intake, heating, motor and drum, door lock, electronics. One section per group,
each linking to the matching `/povredi/` page, plus guidance to quote the code
and the model on the phone and where to find the model plate.

**No brand-specific codes on this page**, and none on brand pages either, until
the client supplies them. This page is honest and still useful: what a caller
needs is to know which family of problem they are in and whether to touch
anything.

---

## 7. Redirects — blocking requirement

The old site's post URLs are Cyrillic-slugged and carry nine years of indexing.
Losing them loses the only organic traffic that exists.

Already extracted. `docs/legacy-import/redirects.htaccess` holds the complete
301 map, generated from `wp_posts`; paste it into `public/.htaccess` section 1.
Audit trail in `docs/legacy-import/url-map.json`.

Permalink structure was `/%postname%/` with percent-encoded Cyrillic slugs — so
nobody would ever guess these URLs. Verify every target resolves in `dist/`
before cutover: a 301 into a 404 is worse than no redirect.

---

## 8. Contact form

`public/contact.php` — the only PHP on the site. cPanel provides it, so there is
no reason to add a third-party form service (and no GDPR processor agreement to
sign).

Must have: honeypot field, submission-timestamp check (reject < 3s), simple
per-IP rate limit, server-side validation, `mail()` to
`info@remontperalnisofia.com`. Never echo user input back into the page. Log
send failures — the old form died silently for years and nobody noticed.

The form is a backup channel. **The phone is the conversion.** Every page keeps
a `tel:` call to action above the fold, and mobile gets a sticky bottom call bar.

---

## 9. Page-by-page

`design/index.html` is the reference (section 2). Match its structure and copy.

### Homepage, in order
1. Sticky header — logo, anchor nav, phone button
2. **Photo hero** — full-bleed `src/assets/hero-drum.jpg` (the gold drum
   interior), dark gradient weighted left so the headline holds, h1, lede,
   call button. See section 16.
3. **Symptom picker** on `--brass-wash` — chips; selecting one reveals the
   likely cause plus the sentence to say on the phone, a call button, and a link
   to the full `/povredi/` page. The one interactive island.
4. Stats plate (dark): `20` години · `2 500+` домакинства · `10 000` уреда ·
   `6 мес.` гаранция. **These four are real. Do not add a fifth or invent any.**
   The old site had six counters that rendered blank.
5. Dark band — "Повредата не чака до следващата седмица", with parallax drum-ring
   texture (section 10)
6. Чести повреди — 9 cards linking to `/povredi/`
7. Dark band — pricing principles, plus the price table with its placeholder
   banner (section 11)
8. Марки — 7 brand cards linking to `/marki/`
9. Райони — zone wheel + accordion (section 12)
10. Съвети — 3 latest articles, link to `/saveti/`
11. Контакти — phone, email, form
12. Footer
13. Sticky mobile call bar below 860px

---

## 10. Parallax bands

Two dark sections carry a two-layer field of drum-door rings. Far layer drifts
up, near layer drifts down.

Use **transform-based** parallax driven by scroll through `requestAnimationFrame`.
Do **not** use `background-attachment: fixed` — it is broken on iOS Safari and
most traffic is mobile. Disable entirely under `prefers-reduced-motion: reduce`.

---

## 11. Prices

**v1 ships a price table with placeholder figures.** Every row is a flat €25
standing in for the real number, with `pricing.placeholder: true` in
`src/data/site.ts` rendering an amber "ПРИМЕРНИ СТОЙНОСТИ — ПОДЛЕЖАТ НА
АКТУАЛИЗАЦИЯ" banner above the table.

The banner must stay wired to that flag. When real figures land, update the rows
and flip the one boolean. **Never remove the banner while the €25 values are
still there** — that is the single way this ships a lie.

The three pricing principles sit alongside the table and stay regardless:
diagnostics free when a repair is carried out, price confirmed on site before
work starts, 6 months warranty on every replaced part.

**EUR only.** Bulgaria adopted the euro on 1 January 2026, the euro has been
sole legal tender since 1 February 2026, and the dual-display window closed on
8 August 2026. No лв. anywhere.

---

## 12. Coverage / райони

People search by **квартал**, not by administrative район — "ремонт перални
Горубляне", not "район Младост". Горубляне is a квартал inside Младост; the old
site's 24-район list missed the words customers actually type.

Zone wheel (schematic, not geographic) beside an accordion: Център, Запад, Изток,
Юг, Север, Околни села. One zone open at a time. Data in `src/data/raioni.ts`.

Build the accordion with `<details>`/`<summary>` so it needs **no JavaScript**.
Collapsed content is still in the HTML and indexes normally.

`/raioni/` gets a real paragraph per zone — that page, not the homepage chips,
is what can rank for neighbourhood terms.

---

## 13. SEO and markup

- `lang="bg"`, `og:locale` `bg_BG` (the old site shipped `en_US`)
- JSON-LD: `LocalBusiness` as a **service-area business** — no street address,
  `areaServed` from the zone data; `Service` on symptom pages; `FAQPage` on
  symptom pages
- Real `<button>`, `<a href>`, `<label>` — never `role`/`onclick` on a div
- `alt` on every image, including brand logos (the old site had none)
- Touch targets ≥ 44px
- Sitemap + robots.txt

---

## 14. Analytics — install with the build, not later

Nothing exists today: no GA4, no Search Console. The agency has been running ads
into a site with no conversion tracking, which means Google's bidding has never
known which clicks became jobs.

- GA4, with a conversion event on **every `tel:` click**
- Search Console verification
- Cookie consent gate before any analytics script fires

This is a prerequisite for the Ads takeover, so it ships with v1.

---

## 15. Things the old site shipped broken — do not repeat

- Contact form dead (`Really Simple CAPTCHA` missing) — every email lead lost, silently
- Blog posts live and indexed but not rendering on the homepage
- All six stat counters rendering blank
- Four social links pointing at `https://remontperalnisofia.com/twitter link here`
- The owner's personal `abv.bg` address in the header as plain text
- Footer stuck on 2017
- No privacy policy, no cookie notice, no consent on the form

**Ship only validated content.** Where a real value is missing, omit the element
rather than filling it.

The €25 price placeholders are the single deliberate exception, and only because
the banner makes them visibly provisional. That is the bar: a placeholder ships
only if a user can see it is one.

---

## 16. Settled — do not revisit

- **Hero photo** — `src/assets/hero-drum.jpg`, the gold drum interior the client
  has used since 2015. The logo is a vector reduction of the same object, so the
  mark and the hero are one thing. Deliberate. Do not swap it for stock, and do
  not "improve" it with a photo of a smiling technician.
- **Phone number** — 0886 473 988, confirmed. The old database's
  `blogdescription` held 0879 473 988; that is stale. One source of truth:
  `src/data/site.ts`.
- **No CMS, no admin.** Posts are markdown in the repo. The client will never
  log in; content goes through Mladen or Claude Code. An out-of-support CMS is
  what killed the previous site.
- **Legacy URLs** — recovered and mapped (section 7). Nothing else was
  published: the other 8 post rows in the old database were private Lorem ipsum
  theme demos, verified not assumed.

---

## 17. Open — do not invent answers

- **Price figures** — the only genuine blocker. See section 11. Real EUR figures
  expected 12 Nov 2026.
- **Error codes per brand** — pending a client interview. See sections 5 and 6.
- **Article photos** — the recovered posts have no imagery. 283 attachment rows
  exist in the old database, so the uploads folder likely has usable photos;
  nobody has looked yet.
- **Brand logo files** — the 2017 PNGs are small and have no alt text. Larger or
  SVG versions wanted before the brand grid ships at full size.

When one of these blocks you, say so and move on. Do not fill the gap.
