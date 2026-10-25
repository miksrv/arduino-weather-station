import React, { useMemo } from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import Head from 'next/head'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { generateNextSeo } from 'next-seo/pages'

import { API, setLocale } from '@/api'
import { prefetchQueries } from '@/api/ssr'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import { POLLING_INTERVAL_CURRENT, POLLING_INTERVAL_FORECAST } from '@/tools/constants'
import { findToday } from '@/tools/forecast'
import { getPageSeo } from '@/tools/seo'
import { LocaleType } from '@/tools/types'
import WidgetForecastDaily from '@/widgets/widget-forecast-daily'
import WidgetForecastDetails from '@/widgets/widget-forecast-details'
import WidgetForecastHourly from '@/widgets/widget-forecast-hourly'
import WidgetForecastToday from '@/widgets/widget-forecast-today'

import styles from './forecast.module.sass'

type ForecastPageProps = object

/**
 * The forecast page answers, top to bottom: what is it like now and today → the details of today →
 * how the next two days go hour by hour → the week ahead.
 */
const ForecastPage: NextPage<ForecastPageProps> = () => {
    const { i18n, t } = useTranslation()

    const { data: current, isLoading: currentLoading } = API.useGetCurrentQuery(undefined, {
        pollingInterval: POLLING_INTERVAL_CURRENT
    })

    const { data: forecastHourly, isLoading: hourlyLoading } = API.useGetForecastQuery('hourly', {
        pollingInterval: POLLING_INTERVAL_FORECAST
    })

    const { data: forecastDaily, isLoading: dailyLoading } = API.useGetForecastQuery('daily', {
        pollingInterval: POLLING_INTERVAL_FORECAST
    })

    const today = useMemo(() => findToday(forecastDaily) ?? forecastDaily?.[0], [forecastDaily])

    return (
        <AppLayout>
            <Head>
                {generateNextSeo(
                    getPageSeo({
                        path: '/forecast',
                        locale: i18n.language,
                        title: t('forecast-weather-in-orenburg'),
                        description: t('forecast-page-description'),
                        siteName: t('weather-in-orenburg'),
                        image: 'forecast'
                    })
                )}
            </Head>

            <PageHeader
                title={t('forecast-weather-in-orenburg')}
                description={t('forecast-page-description')}
            />

            <div className={'widgets-list'}>
                <WidgetForecastToday
                    current={current}
                    today={today}
                    loading={currentLoading && dailyLoading}
                />

                <WidgetForecastDetails
                    today={today}
                    loading={dailyLoading}
                />

                <WidgetForecastHourly
                    hours={forecastHourly}
                    loading={hourlyLoading}
                />

                <WidgetForecastDaily
                    days={forecastDaily}
                    loading={dailyLoading}
                />
            </div>

            <p className={styles.sources}>{t('forecast-sources')}</p>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<ForecastPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale, ['common'])

            store.dispatch(setLocale(locale))

            await prefetchQueries(store, [
                API.endpoints.getCurrent.initiate(),
                API.endpoints.getForecast.initiate('hourly'),
                API.endpoints.getForecast.initiate('daily')
            ])

            return { props: { ...translations } }
        }
)

export default ForecastPage
