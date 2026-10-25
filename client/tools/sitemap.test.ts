import { SITE_LINK } from './seo'
import { buildSitemap } from './sitemap'

describe('buildSitemap', () => {
    const xml = buildSitemap(['ru', 'en'], '2026-10-24', [{ path: '/sensors', changefreq: 'hourly', priority: 0.9 }])

    it('lists the page in every locale', () => {
        expect(xml).toContain(`<loc>${SITE_LINK}/sensors</loc>`)
        expect(xml).toContain(`<loc>${SITE_LINK}/en/sensors</loc>`)
    })

    it('declares the language alternates', () => {
        expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="en" href="${SITE_LINK}/en/sensors"/>`)
        expect(xml).toContain(`<xhtml:link rel="alternate" hreflang="x-default" href="${SITE_LINK}/sensors"/>`)
    })

    it('writes lastmod, changefreq and priority', () => {
        expect(xml).toContain('<lastmod>2026-10-24</lastmod>')
        expect(xml).toContain('<changefreq>hourly</changefreq>')
        expect(xml).toContain('<priority>0.9</priority>')
    })

    it('is a urlset with the xhtml namespace', () => {
        expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
        expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
        expect(xml.match(/<url>/g)).toHaveLength(2)
    })
})
