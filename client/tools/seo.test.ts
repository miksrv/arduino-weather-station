import { getLanguageAlternates, getPageSeo, getPageUrl, SITE_LINK } from './seo'

describe('seo', () => {
    describe('getPageUrl', () => {
        it('has no prefix for the default locale', () => {
            expect(getPageUrl('/sensors', 'ru')).toBe(`${SITE_LINK}/sensors`)
            expect(getPageUrl('sensors')).toBe(`${SITE_LINK}/sensors`)
        })

        it('prefixes other locales', () => {
            expect(getPageUrl('/sensors', 'en')).toBe(`${SITE_LINK}/en/sensors`)
        })

        it('returns the origin for the home page', () => {
            expect(getPageUrl('/', 'ru')).toBe(SITE_LINK)
            expect(getPageUrl('/', 'en')).toBe(`${SITE_LINK}/en`)
        })
    })

    describe('getLanguageAlternates', () => {
        it('lists every locale and x-default', () => {
            expect(getLanguageAlternates('/forecast')).toStrictEqual([
                { hrefLang: 'ru', href: `${SITE_LINK}/forecast` },
                { hrefLang: 'en', href: `${SITE_LINK}/en/forecast` },
                { hrefLang: 'x-default', href: `${SITE_LINK}/forecast` }
            ])
        })
    })

    describe('getPageSeo', () => {
        const params = { path: '/sensors', title: 'Sensors', description: 'Live readings', siteName: 'Meteo' }

        it('uses the canonical URL of the page locale', () => {
            expect(getPageSeo({ ...params, locale: 'en' }).canonical).toBe(`${SITE_LINK}/en/sensors`)
            expect(getPageSeo({ ...params, locale: 'ru' }).canonical).toBe(`${SITE_LINK}/sensors`)
        })

        it('builds the Open Graph card with the page image', () => {
            const seo = getPageSeo({ ...params, locale: 'en', image: 'sensors' })

            expect(seo.openGraph).toMatchObject({
                url: `${SITE_LINK}/en/sensors`,
                locale: 'en_US',
                images: [{ url: `${SITE_LINK}/images/og/sensors.jpg`, width: 1200, height: 630 }]
            })
        })

        it('defaults to the main image and the Russian Open Graph locale', () => {
            const seo = getPageSeo(params)

            expect(seo.openGraph?.locale).toBe('ru_RU')
            expect(seo.openGraph?.images?.[0].url).toBe(`${SITE_LINK}/images/og/main.jpg`)
        })
    })
})
