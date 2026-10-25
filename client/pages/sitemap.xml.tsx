import type { GetServerSideProps } from 'next'

import { getCurrentDate } from '@/tools/date'
import { buildSitemap } from '@/tools/sitemap'

import i18Config from '../next-i18next.config'

// The XML is written in getServerSideProps; the page itself never renders
const Sitemap = () => null

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    res.write(buildSitemap(i18Config.i18n.locales, getCurrentDate().format('YYYY-MM-DD')))
    res.end()

    return { props: {} }
}

export default Sitemap
