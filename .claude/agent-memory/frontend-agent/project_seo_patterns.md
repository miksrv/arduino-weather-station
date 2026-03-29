---
name: SEO patterns and conventions
description: How SEO is implemented across the Next.js client — next-seo, _document, OG images, sitemap, robots
type: project
---

## SEO implementation

- `next-seo` v6 is installed. Each page uses `<NextSeo>` from `next-seo`.
- Global fallback is `<DefaultSeo>` in `_app.tsx` — sets `openGraph.siteName`, `twitter.cardType`.
- `_document.tsx` exists (created during SEO audit). Plain `<Html>` with no `lang` prop — the Next.js i18n router automatically sets `lang` from the active locale (`ru`/`en`).
- Default locale is `ru`; English is also supported.

## OG images

- OG image URLs must be **absolute**. Use `${process.env.NEXT_PUBLIC_SITE_LINK}/images/filename.jpg`.
- Do NOT use relative paths like `/images/filename.jpg` for OG image URLs — social crawlers cannot resolve them.
- Available OG images in `public/images/`: `main.jpg`, `sensors.jpg`, `history.jpg`, `heatmap.jpg`, `forecast.jpg`.
- Pages without an image (`anomaly`, `precipitation`) skip the `openGraph.images` array.

## Per-page NextSeo convention

- `title`: page-specific translated key
- `description`: page-specific translated key (not the generic `site-description`)
- `canonical`: full absolute URL using `NEXT_PUBLIC_SITE_LINK` + path
- `openGraph.url`: the page-specific absolute URL (not always the root)
- `openGraph.title`: same as the page title (not the generic site name)
- `openGraph.description`: the page-specific description
- `twitter.cardType`: `'summary_large_image'` on every page

## 404 page

`[...not-found].tsx` uses `noindex={true}` on `<NextSeo>` to prevent indexing.
No `canonical` is set on the 404 page.

## Sitemap

`public/sitemap.xml` lists all indexable pages: `/`, `/sensors`, `/forecast`, `/history`, `/heatmap`, `/precipitation`, `/climate`, `/anomaly`.
The sitemap is referenced from `public/robots.txt` at the bottom.

## robots.txt

Located at `public/robots.txt`. Allows all crawlers. References the sitemap. `Host:` directive points to the production domain.

## Footer

GitHub link uses `rel='nofollow noreferrer'` (not `noindex` — that's not a valid link rel value).
