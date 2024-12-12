import React from 'react'
import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'
import { ColumnProps } from 'simple-react-ui-kit'

import { API, ApiModel } from '@/api'
import { setLocale } from '@/api/applicationSlice'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WeatherIcon from '@/components/weather-icon'
import WidgetForecastTable from '@/components/widget-forecast-table'
import styles from '@/components/widget-forecast-table/styles.module.sass'
import WidgetMeteogram from '@/components/widget-meteogram'
import WindDirectionIcon from '@/components/wind-direction-icon'
import { POLING_INTERVAL_FORECAST } from '@/pages/_app'
import { getWeatherI18nKey } from '@/tools/conditions'
import { formatDate } from '@/tools/date'
import { round } from '@/tools/helpers'
import { convertHpaToMmHg, getCloudinessColor, getTemperatureColor } from '@/tools/weather'
import ComparisonIcon from '@/ui/comparison-icon'

type IndexPageProps = object

const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n, t } = useTranslation()

    const { data: forecastHourly, isLoading: hourlyLoading } = API.useGetForecastQuery('hourly', {
        pollingInterval: POLING_INTERVAL_FORECAST
    })

    const { data: forecastDaily, isLoading: dailyLoading } = API.useGetForecastQuery('daily', {
        pollingInterval: POLING_INTERVAL_FORECAST
    })

    const tableColumnsDaily: ColumnProps<ApiModel.Weather>[] = [
        {
            header: t('date'),
            accessor: 'date',
            className: styles.cellDate,
            isSortable: true,
            formatter: (date) => formatDate(date as string, 'dd, MMM D')
        },
        {
            header: t('weather'),
            accessor: 'weatherId',
            className: styles.cellCondition,
            formatter: (weatherId) => (
                <>
                    <WeatherIcon weatherId={weatherId as number} />
                    {t(getWeatherI18nKey(weatherId || ''))}
                </>
            )
        },
        {
            header: t('temperature-short'),
            accessor: 'temperature',
            className: styles.cellTemperature,
            isSortable: true,
            background: (temperature) => getTemperatureColor(temperature),
            formatter: (temperature) => <>{round(Number(temperature), 1)} °C</>
        },
        {
            header: t('clouds'),
            accessor: 'clouds',
            className: styles.cellClouds,
            isSortable: true,
            background: (clouds) => getCloudinessColor(clouds),
            formatter: (clouds) => <>{clouds}%</>
        },
        {
            header: t('pressure'),
            accessor: 'pressure',
            className: styles.cellPressure,
            isSortable: true,
            formatter: (pressure, data, i) => (
                <>
                    <span>{convertHpaToMmHg(pressure)}</span>
                    <ComparisonIcon
                        currentValue={pressure}
                        previousValue={data[i - 1]?.pressure}
                    />
                </>
            )
        },
        {
            header: t('precipitation'),
            accessor: 'precipitation',
            className: styles.cellClouds,
            isSortable: true,
            formatter: (precipitation) =>
                precipitation ? (
                    <>
                        {precipitation} {t('millimeters')}
                    </>
                ) : (
                    ''
                )
        },
        {
            header: t('wind'),
            accessor: 'windSpeed',
            className: styles.cellWind,
            isSortable: true,
            formatter: (windSpeed, data, i) => (
                <>
                    <WindDirectionIcon direction={Number(data[i]?.windDeg)} />
                    {round(Number(windSpeed), 1)} {t('meters-per-second')}
                </>
            )
        }
    ]

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
                    columns={tableColumnsDaily}
                    data={forecastDaily}
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
