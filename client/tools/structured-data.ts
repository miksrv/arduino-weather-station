import type { Dataset, WebSite, WithContext } from 'schema-dts'

import { getPageUrl } from './seo'

interface StructuredDataParams {
    locale?: string
    siteName: string
    description: string
    apiUrl: string
}

/** The site itself */
export const getWebSiteSchema = ({ locale, siteName, description }: StructuredDataParams): WithContext<WebSite> => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description,
    url: getPageUrl('/', locale),
    inLanguage: locale ?? 'ru'
})

/**
 * The station's measurements as a dataset (Google Dataset Search): what is measured, where, since when,
 * and the CSV export of the archive.
 */
export const getDatasetSchema = ({
    locale,
    siteName,
    description,
    apiUrl
}: StructuredDataParams): WithContext<Dataset> => ({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: siteName,
    description,
    url: getPageUrl('/history', locale),
    inLanguage: locale ?? 'ru',
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    creator: {
        '@type': 'Person',
        name: 'Mik',
        url: 'https://miksoft.pro'
    },
    temporalCoverage: '2021-01-01/..',
    spatialCoverage: {
        '@type': 'Place',
        name: 'Orenburg, Russia'
    },
    variableMeasured: [
        'Air temperature',
        'Relative humidity',
        'Atmospheric pressure',
        'Wind speed',
        'Wind direction',
        'Precipitation',
        'UV index',
        'Solar radiation'
    ],
    distribution: {
        '@type': 'DataDownload',
        encodingFormat: 'text/csv',
        contentUrl: `${apiUrl.replace(/\/+$/, '')}/history/export`
    }
})
