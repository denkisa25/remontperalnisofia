// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// /saveti/ is noindex while no article is published — keep it out of the sitemap too
const hasPublishedArticles = readdirSync('./src/content/saveti')
  .filter((f) => f.endsWith('.md'))
  .some((f) => !/^draft:\s*true\s*$/m.test(readFileSync(`./src/content/saveti/${f}`, 'utf8')));

// Editorial notes live in markdown as <!-- comments -->; they must not reach public HTML.
function remarkStripComments() {
  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.filter(
      (c) => !(c.type === 'html' && /^\s*<!--[\s\S]*-->\s*$/.test(c.value)),
    );
    node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://remontperalnisofia.com',
  output: 'static',
  trailingSlash: 'always',
  markdown: { remarkPlugins: [remarkStripComments] },
  integrations: [
    sitemap({
      // contact.php is a handler, not a page
      filter: (page) =>
        !page.includes('/contact.php') && (hasPublishedArticles || !page.endsWith('/saveti/')),
    }),
  ],
  build: {
    // /povredi/ne-iztochva-voda/index.html — matches trailingSlash and keeps
    // Apache serving clean URLs on cPanel without rewrite gymnastics
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  image: {
    // hero photo is large; let sharp produce webp/avif at build time
    responsiveStyles: true,
  },
  vite: {
    build: {
      assetsInlineLimit: 2048,
    },
  },
});
