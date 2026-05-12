---
name: SEO patterns and conventions
description: How SEO is implemented across the Next.js client — next-seo v7, _document, OG images, sitemap, robots
type: project
---

## SEO implementation

- `next-seo` v7 is installed. **Breaking change from v6**: `NextSeo` and `DefaultSeo` components are gone.
- Each page uses `generateNextSeo({...})` from `next-seo/pages` inside `<Head>`:
  ```tsx
  import Head from 'next/head'
  import { generateNextSeo } from 'next-seo/pages'
  // ...
  <Head>{generateNextSeo({ title: ..., description: ..., canonical: ..., openGraph: {...}, twitter: {...} })}</Head>
  ```
- Global fallback is `generateDefaultSeo({...})` from `next-seo/pages` inside `<Head>` in `_app.tsx` — sets `openGraph.siteName`, `twitter.cardType`.
- `_document.tsx` exists. Plain `<Html>` with no `lang` prop — the Next.js i18n router automatically sets `lang`.
- Default locale is `ru`; English is also supported.

## OG images

- OG image URLs must be **absolute**. Use `${process.env.NEXT_PUBLIC_SITE_LINK}/images/filename.jpg`.
- Do NOT use relative paths like `/images/filename.jpg` for OG image URLs — social crawlers cannot resolve them.
- Available OG images in `public/images/`: `main.jpg`, `sensors.jpg`, `history.jpg`, `heatmap.jpg`, `forecast.jpg`.
- Pages without an image (`anomaly`, `precipitation`) skip the `openGraph.images` array.

## Per-page generateNextSeo convention

- `title`: page-specific translated key
- `description`: page-specific translated key (not the generic `site-description`)
- `canonical`: full absolute URL using `NEXT_PUBLIC_SITE_LINK` + path
- `openGraph.url`: the page-specific absolute URL (not always the root)
- `openGraph.title`: same as the page title (not the generic site name)
- `openGraph.description`: the page-specific description
- `twitter.cardType`: `'summary_large_image'` on every page

## 404 page

`[...not-found].tsx` uses `noindex: true` in `generateNextSeo({...})` to prevent indexing.
No `canonical` is set on the 404 page.

## Sitemap

`public/sitemap.xml` lists all indexable pages: `/`, `/sensors`, `/forecast`, `/history`, `/heatmap`, `/precipitation`, `/climate`, `/anomaly`.
The sitemap is referenced from `public/robots.txt` at the bottom.

## robots.txt

Located at `public/robots.txt`. Allows all crawlers. References the sitemap. `Host:` directive points to the production domain.

## Footer

GitHub link uses `rel='nofollow noreferrer'` (not `noindex` — that's not a valid link rel value).
