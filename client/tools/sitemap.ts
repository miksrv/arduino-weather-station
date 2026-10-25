import { getLanguageAlternates, getPageUrl } from './seo'

export interface SitemapPage {
    path: string
    changefreq: 'hourly' | 'daily' | 'weekly' | 'monthly'
    priority: number
}

/** Every indexable page of the site; each is listed in every locale with its hreflang alternates */
export const SITEMAP_PAGES: SitemapPage[] = [
    { path: '/', changefreq: 'hourly', priority: 1 },
    { path: '/sensors', changefreq: 'hourly', priority: 0.9 },
    { path: '/forecast', changefreq: 'hourly', priority: 0.9 },
    { path: '/history', changefreq: 'daily', priority: 0.8 },
    { path: '/heatmap', changefreq: 'weekly', priority: 0.7 },
    { path: '/precipitation', changefreq: 'daily', priority: 0.7 },
    { path: '/climate', changefreq: 'monthly', priority: 0.6 },
    { path: '/anomaly', changefreq: 'hourly', priority: 0.6 }
]

/**
 * Builds sitemap.xml: one `<url>` per page and locale, `xhtml:link` alternates for every language
 * (Google's way to declare translations), `lastmod` of the given day.
 */
export const buildSitemap = (locales: string[], lastmod: string, pages: SitemapPage[] = SITEMAP_PAGES): string => {
    const urls = pages.flatMap((page) =>
        locales.map((locale) => {
            const alternates = getLanguageAlternates(page.path)
                .map(({ hrefLang, href }) => `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${href}"/>`)
                .join('\n')

            return [
                '  <url>',
                `    <loc>${getPageUrl(page.path, locale)}</loc>`,
                alternates,
                `    <lastmod>${lastmod}</lastmod>`,
                `    <changefreq>${page.changefreq}</changefreq>`,
                `    <priority>${page.priority.toFixed(1)}</priority>`,
                '  </url>'
            ].join('\n')
        })
    )

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...urls,
        '</urlset>'
    ].join('\n')
}
