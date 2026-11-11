// Every 301 target in public/.htaccess must resolve to a real page in dist/.
// A 301 into a 404 is worse than no redirect (CLAUDE.md §7).
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
console.log(`\n${rules.length - bad}/${rules.length} redirect targets resolve in dist/`);
if (bad) {
  console.error(
    `${bad} target(s) do not exist. Targets under /saveti/ exist only once the article is no longer draft: true.`,
  );
  process.exit(1);
}
