# remontperalnisofia.com

Static Astro rebuild of a dead WordPress site. Bulgarian only, EUR only.

**Read `CLAUDE.md` first** — it carries every settled decision, the design
tokens, the content model and the things that must not be repeated from the old
site. It is written for Claude Code but it is the human brief too.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
```

Node 22+.

## Deploy

Push to `main`. GitHub Actions builds and rsyncs `dist/` to cPanel over SSH.
The server never runs Node — do not use cPanel's Git Version Control.

Repo secrets required (Settings -> Secrets and variables -> Actions):

| Secret | Value |
|---|---|
| `CPANEL_HOST` | hostname or IP |
| `CPANEL_USER` | cPanel SSH user |
| `CPANEL_SSH_KEY` | private key, full PEM including header/footer |
| `CPANEL_PATH` | e.g. `/home/<user>/public_html` |

Generate a deploy key with `ssh-keygen -t ed25519 -C "gh-deploy"` and add the
public half in cPanel -> SSH Access -> Manage SSH Keys -> Authorize.

## Before launch

- [ ] Legacy 301 map — done in `public/.htaccess`; `npm run build && npm run check:redirects` must pass (needs the `/saveti/` articles un-drafted)
- [ ] Real EUR prices, or keep the table off
- [ ] Error-code lists per brand, from the client
- [ ] Legacy posts in `src/content/saveti/` are all `draft: true` — edit, then publish (see the EDITORIAL notes inside)
- [ ] GA4 measurement ID + Search Console token in `src/data/site.ts` (`analytics`); mark `call_click` as a key event in GA4
- [ ] Privacy policy reviewed (controller identity, retention periods) — pages exist but were written from what the code does
