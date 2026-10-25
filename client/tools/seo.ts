import type { NextSeoProps } from 'next-seo/pages'

import i18Config from '../next-i18next.config'

export const SITE_LINK = (process.env.NEXT_PUBLIC_SITE_LINK ?? 'http://localhost:3000').replace(/\/+$/, '')

const DEFAULT_LOCALE: string = i18Config.i18n.defaultLocale
const LOCALES: string[] = i18Config.i18n.locales

/** Open Graph pictures of the pages: `public/images/og/<name>.jpg`, 1200×630 */
export type OgImage = 'main' | 'sensors' | 'forecast' | 'history' | 'heatmap' | 'climate' | 'anomaly' | 'precipitation'

/**
 * The absolute URL of a page in a locale: the default locale has no prefix ("/sensors"),
 * the others do ("/en/sensors"). The home page is the bare origin.
 */
export const getPageUrl = (path: string, locale?: string): string => {
    const cleanPath = path === '/' ? '' : `/${path.replace(/^\/+/, '')}`
    const prefix = locale && locale !== DEFAULT_LOCALE ? `/${locale}` : ''

    return `${SITE_LINK}${prefix}${cleanPath}` || SITE_LINK
}

/** hreflang links for every locale plus x-default (the default locale) */
export const getLanguageAlternates = (path: string): NonNullable<NextSeoProps['languageAlternates']> => [
    ...LOCALES.map((locale) => ({ hrefLang: locale, href: getPageUrl(path, locale) })),
    { hrefLang: 'x-default', href: getPageUrl(path, DEFAULT_LOCALE) }
]

interface PageSeoParams {
    path: string
    locale?: string
    title: string
    description: string
    siteName: string
    image?: OgImage
    noindex?: boolean
}

/**
 * SEO tags of a page: a canonical URL of its own locale, hreflang alternates, Open Graph and Twitter
 * cards. Pass the result to `generateNextSeo` of `next-seo/pages`.
 */
export const getPageSeo = ({
    path,
    locale,
    title,
    description,
    siteName,
    image = 'main',
    noindex
}: PageSeoParams): NextSeoProps => {
    const url = getPageUrl(path, locale)

    return {
        title,
        description,
        canonical: url,
        noindex,
        languageAlternates: getLanguageAlternates(path),
        openGraph: {
            title,
            description,
            url,
            siteName,
            type: 'website',
            locale: locale === 'en' ? 'en_US' : 'ru_RU',
            images: [
                {
                    url: `${SITE_LINK}/images/og/${image}.jpg`,
                    width: 1200,
                    height: 630,
                    alt: title
                }
            ]
        },
        twitter: {
            cardType: 'summary_large_image'
        }
    }
}
