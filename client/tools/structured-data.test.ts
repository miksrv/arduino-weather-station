import { SITE_LINK } from './seo'
import { getDatasetSchema, getWebSiteSchema } from './structured-data'

const params = { locale: 'en', siteName: 'Meteo', description: 'Weather data', apiUrl: 'https://api.example.com/' }

describe('structured data', () => {
    it('describes the site in its locale', () => {
        expect(getWebSiteSchema(params)).toMatchObject({
            '@type': 'WebSite',
            name: 'Meteo',
            url: `${SITE_LINK}/en`,
            inLanguage: 'en'
        })
    })

    it('describes the measurements as a dataset with a CSV download', () => {
        const dataset = getDatasetSchema(params)

        expect(dataset).toMatchObject({
            '@type': 'Dataset',
            url: `${SITE_LINK}/en/history`,
            distribution: {
                '@type': 'DataDownload',
                encodingFormat: 'text/csv',
                contentUrl: 'https://api.example.com/history/export'
            }
        })
    })

    it('defaults to Russian', () => {
        expect(getWebSiteSchema({ ...params, locale: undefined }).inLanguage).toBe('ru')
    })
})
