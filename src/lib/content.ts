import { getCollection } from 'astro:content';

/** Symptoms in display order. Drafts never build. */
export async function getPovredi() {
  const all = await getCollection('povredi', (e) => !e.data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getMarki() {
  const all = await getCollection('marki', (e) => !e.data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Newest first. `draft: true` articles are not published and do not build. */
export async function getSaveti() {
  const all = await getCollection('saveti', (e) => !e.data.draft);
  return all.sort((a, b) => b.data.published.getTime() - a.data.published.getTime());
}

export const categoryLabel = {
  perlani: 'ПЕРАЛНИ',
  sushilni: 'СУШИЛНИ',
  poddrazhka: 'ПОДДРЪЖКА',
  izbor: 'ИЗБОР',
} as const;

/** "25" -> "25 €" — EUR only, mono face applied by the caller. */
export function eur(n: number) {
  return `${n} €`;
}
