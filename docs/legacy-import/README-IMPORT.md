# Import bundle — from the old WordPress database

Everything here was extracted from `kickstic_peralni.sql` (the UpdraftPlus dump
of the dead install). Nothing is invented.

## What's in here

```
posts/                   6 recovered posts, converted to markdown
url-map.json             every published URL, decoded, with its new target
redirects.htaccess       ready-to-paste 301 block
site.ts                  REPLACES src/data/site.ts — adds placeholder prices
```

## Where each file goes

| File | Destination |
|---|---|
| `posts/*.md` | `src/content/saveti/` (except `legacy-ne-iztochva-voda.md`, see below) |
| `redirects.htaccess` | paste into `public/.htaccess`, section 1 |
| `site.ts` | overwrite `src/data/site.ts` |
| `url-map.json` | `docs/` — keep it, it is the audit trail |

## Facts recovered from the database

- `permalink_structure` was `/%postname%/` — so every post lived at
  `/<percent-encoded-cyrillic-slug>/`. That is why the redirect map matters:
  nobody will ever guess those URLs.
- `show_on_front` = `page`, `page_on_front` = 3736 — the homepage was a static
  page, not the blog index.
- **6 published posts, not 5.** The sixth is a symptom article, not an advice
  article (see below).
- The 8 other `post` rows are all `private` and all Lorem ipsum theme demo
  content ("Voluptas Sadips Ipsums Sits", "Blog Video Post"). Nothing of value
  was lost — confirmed, not assumed.
- 283 attachment rows exist, so the uploads folder has far more imagery than
  the seven brand logos on the live page. Worth a look for article photos.

## Two things that need a decision

**1. The phone number.** `blogdescription` in the database is **0879 473 988**.
The live page copy says **0886 473 988**. One is stale. Every call to action on
the site depends on this — confirm with the client, then set it once in
`src/data/site.ts`.

**2. `legacy-ne-iztochva-voda.md`** is the post *"Пералнята не изхвърля водата
– какъв е проблемът"*. It is a symptom page, not an advice article, and its
content overlaps the `povredi/ne-iztochva-voda` entry already in the scaffold.

Merge it into that entry rather than publishing both — two pages competing for
the same query is the cannibalisation problem the whole URL structure was
designed to avoid. The redirect already points its old URL at
`/povredi/ne-iztochva-voda/`. Use the old text where it is better than the
placeholder prose; it is the client's own wording.

## The posts need work before they ship

Each file has `draft: true` and `summary: TODO`. They are 2014–2015 copy run
through an HTML-to-markdown conversion, so:

- WPBakery shortcodes are stripped but the paragraph rhythm is rough
- `summary` must be written (it becomes the meta description and the card text)
- `category` is set to `poddrazhka` for all of them — fix per article
- any dishwasher references need re-scoping or removing; dishwashers are out
  of scope now
- `readingMinutes` is unset

Keep the client's voice. Do not rewrite these into marketing copy — the plain
technician phrasing is the reason they read as credible.
