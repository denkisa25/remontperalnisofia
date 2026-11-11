import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * povredi — one entry per symptom.
 *
 * `symptom` is the sentence a caller says on the phone. It is shown in the
 * homepage picker under "Кажете това по телефона" and must read as spoken
 * Bulgarian, not as a heading.
 */
const povredi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/povredi' }),
  schema: z.object({
    title: z.string(),
    // short label for the homepage chip, e.g. "Не източва вода"
    chip: z.string(),
    // card title on the homepage grid; defaults to `title`
    cardTitle: z.string().optional(),
    // what the caller says, e.g. "Пералнята спира с вода в барабана..."
    symptom: z.string(),
    // one-line likely cause, shown in the picker before the call button
    cause: z.string(),
    // meta description + card text on the homepage grid
    summary: z.string(),
    order: z.number(),
    appliance: z.enum(['peralnya', 'sushilnya', 'oba']).default('peralnya'),
    causes: z
      .array(z.object({ title: z.string(), body: z.string() }))
      .default([]),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
    related: z.array(z.string()).default([]),
    image: z.string().optional(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * marki — one entry per brand. Error codes are anchored sections inside the
 * page (#e18), never separate pages.
 *
 * Codes must come from the client. Do not generate them from general
 * knowledge — a wrong code on a repair site misleads someone standing in
 * front of a broken machine.
 */
const marki = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/marki' }),
  schema: z.object({
    title: z.string(),
    // display name as the manufacturer writes it, e.g. "Bosch"
    brand: z.string(),
    summary: z.string(),
    order: z.number(),
    // optional: brand cards render the name as a wordmark until proper logo files exist
    logo: z.string().optional(),
    codes: z
      .array(
        z.object({
          code: z.string(),
          title: z.string(),
          body: z.string(),
          // optional slug of a povredi entry to link through to
          povreda: z.string().optional(),
        }),
      )
      .default([]),
    commonFaults: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/**
 * saveti — articles. The five posts on the dead WordPress install are still
 * indexed; migrate them rather than rewriting, and keep `legacyUrl` so the
 * redirect map can be generated from the content itself.
 */
const saveti = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/saveti' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['perlani', 'sushilni', 'poddrazhka', 'izbor']),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    readingMinutes: z.number().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    // original WordPress URL, Cyrillic slug included — drives the 301 map
    legacyUrl: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { povredi, marki, saveti };
