import React from 'react'
import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API } from '@/api'
import { setLocale } from '@/api/applicationSlice'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetForecastTable from '@/components/widget-forecast-table'
import WidgetMeteogram from '@/components/widget-meteogram'
import { POLING_INTERVAL_FORECAST } from '@/pages/_app'
type IndexPageProps = object

const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n, t } = useTranslation()

    const { data: forecastHourly, isLoading: hourlyLoading } = API.useGetForecastQuery('hourly', {
        pollingInterval: POLING_INTERVAL_FORECAST
    })

    const { data: forecastDaily, isLoading: dailyLoading } = API.useGetForecastQuery('daily', {
        pollingInterval: POLING_INTERVAL_FORECAST
    })

    return (
        <AppLayout>
            <NextSeo
                title={t('forecast-weather-in-orenburg')}
                description={t('forecast-page-description')}
                canonical={process.env.NEXT_PUBLIC_SITE_LINK}
                openGraph={{
                    description: t('site-description'),
                    images: [
                        {
                            height: 1368,
                            url: '/images/forecast.jpg',
                            width: 2040
                        }
                    ],
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: t('weather-in-orenburg'),
                    title: t('weather-in-orenburg'),
                    type: 'website',
                    url: process.env.NEXT_PUBLIC_SITE_LINK
                }}
            />

            <div className={'widgets-list'}>
                <WidgetMeteogram
                    loading={hourlyLoading}
                    data={forecastHourly}
                />

                <WidgetForecastTable
                    title={t('weather-forecast-by-days')}
                    loading={dailyLoading}
                    data={forecastDaily}
                    columnsPreset={['date', 'weather', 'temperature', 'clouds', 'pressure', 'precipitation', 'wind']}
                    defaultSort={{ key: 'date', direction: 'asc' }}
                    fullWidth={true}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<IndexPageProps>> => {
            const locale = context.locale ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return {
                props: {
                    ...translations
                }
            }
        }
)

export default IndexPage
