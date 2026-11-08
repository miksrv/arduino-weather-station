---
name: SEO patterns and conventions
description: How SEO is implemented across the Next.js client — getPageSeo + next-seo v7, _document, OG images, sitemap, robots
type: project
---

## SEO implementation

- `next-seo` v7 is installed. **Breaking change from v6**: `NextSeo` and `DefaultSeo` components are gone.
- Each page builds its tags with `getPageSeo({ path, locale, title, description, siteName, image })` (`tools/seo.ts`) and passes the result to `generateNextSeo` from `next-seo/pages` inside `<Head>`:
  ```tsx
  import Head from 'next/head'
  import { generateNextSeo } from 'next-seo/pages'
  import { getPageSeo } from '@/tools/seo'
  // ...
  <Head>{generateNextSeo(getPageSeo({ path: '/sensors', locale, title, description, siteName, image: 'sensors' }))}</Head>
  ```
- Global fallback is `generateDefaultSeo({...})` from `next-seo/pages` inside `<Head>` in `_app.tsx` — sets `openGraph.siteName` and `openGraph.type`.
- `_document.tsx` exists. Plain `<Html>` with no `lang` prop — the Next.js i18n router automatically sets `lang`.
- Default locale is `ru`; English is also supported.

## OG images

- OG image URLs must be **absolute**. `getPageSeo` builds them as `${SITE_LINK}/images/og/<image>.jpg` (1200×630).
- Do NOT use relative paths like `/images/og/main.jpg` for OG image URLs — social crawlers cannot resolve them.
- Available OG images in `public/images/og/`: `main`, `sensors`, `forecast`, `history`, `heatmap`, `climate`, `anomaly`, `precipitation` (the `OgImage` type); `image` defaults to `'main'`.

## Per-page getPageSeo convention

- `title`: page-specific translated key
- `description`: page-specific translated key (not the generic `site-description`)
- `canonical` and `openGraph.url`: the page's absolute URL in its own locale (`getPageUrl(path, locale)`: no prefix for `ru`, `/en/...` for English), plus hreflang `languageAlternates` (each locale + `x-default`)
- `openGraph.title` / `openGraph.description`: the page's own title and description
- `twitter.cardType`: `'summary_large_image'` on every page

## 404 page

`[...not-found].tsx` calls `generateNextSeo({...})` directly (not `getPageSeo`) with `noindex: true` to prevent indexing.
No `canonical` is set on the 404 page.

## Sitemap

`pages/sitemap.xml.tsx` serves the sitemap built by `buildSitemap()` in `tools/sitemap.ts` from `SITEMAP_PAGES`: `/`, `/sensors`, `/forecast`, `/history`, `/heatmap`, `/precipitation`, `/climate`, `/anomaly`, each in every locale with `xhtml:link` alternates. A new indexable page goes into `SITEMAP_PAGES`.
The sitemap is referenced from `public/robots.txt` at the bottom.

## robots.txt

Located at `public/robots.txt`. Allows all crawlers. References the sitemap (production URL).

## Footer

GitHub link uses `rel='nofollow noreferrer'` (not `noindex` — that's not a valid link rel value).
