// 1. Every 301 target in public/.htaccess must resolve to a real page in dist/.
//    A 301 into a 404 is worse than no redirect (CLAUDE.md §7).
// 2. docs/legacy-import/url-map.json (the audit trail) must agree with the rules:
//    for each entry the effective target is `currentTarget` when present, else
//    `target`; the matching RedirectMatch rule must point there, and it must resolve.
//   npm run build && npm run check:redirects
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const htaccess = readFileSync(new URL('../public/.htaccess', import.meta.url), 'utf8');

const rules = [...htaccess.matchAll(/^(Redirect|RedirectMatch)\s+301\s+(\S+)\s+(\S+)\s*$/gm)].map(
  (m) => ({ kind: m[1], from: m[2], to: m[3] }),
);
if (rules.length === 0) {
  console.error('No 301 rules found in public/.htaccess — refusing to pass.');
  process.exit(1);
}

const resolves = (target) => {
  const path = decodeURIComponent(target.split('#')[0]);
  const candidates = path.endsWith('/') ? [join(dist, path, 'index.html')] : [join(dist, path), join(dist, path, 'index.html')];
  return candidates.some((c) => existsSync(c));
};

let bad = 0;
for (const r of rules) {
  const ok = resolves(r.to);
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${decodeURIComponent(r.from).padEnd(56)} -> ${r.to}`);
}
const ruleBad = bad;
console.log(`\n${rules.length - ruleBad}/${rules.length} .htaccess redirect targets resolve in dist/`);
// ---- url-map.json vs .htaccess ----
const map = JSON.parse(readFileSync(new URL('../docs/legacy-import/url-map.json', import.meta.url), 'utf8'));
let mapBad = 0;
console.log('\nurl-map.json vs .htaccess:');
for (const e of map) {
  const effective = e.currentTarget ?? e.target;
  const slug = decodeURIComponent(e.old_url).replace(/^\/|\/$/g, '');
  const rule = rules.find((r) => r.kind === 'RedirectMatch' && decodeURIComponent(r.from) === `^/${slug}/?$`);
  let problem = '';
  if (!rule) problem = 'no RedirectMatch rule for this old URL';
  else if (rule.to !== effective) problem = `rule points to ${rule.to}, map says ${effective}`;
  else if (!resolves(effective)) problem = `${effective} does not exist in dist/`;
  if (problem) mapBad++;
  const tag = e.currentTarget ? `  (currentTarget; original ${e.target})` : '';
  console.log(`${problem ? 'FAIL' : 'ok  '}  ${slug.padEnd(48)} -> ${effective}${tag}${problem ? '   !! ' + problem : ''}`);
}
console.log(`${map.length - mapBad}/${map.length} url-map entries agree with .htaccess and resolve`);
bad += mapBad;

if (bad) {
  console.error(
    `${bad} problem(s). Targets under /saveti/ exist only once the article is no longer draft: true.`,
  );
  process.exit(1);
}
