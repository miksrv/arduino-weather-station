import React from 'react'
import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiModel } from '@/api'
import { setLocale } from '@/api/applicationSlice'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WeatherIcon from '@/components/weather-icon'
import WidgetChart from '@/components/widget-chart'
import WidgetForecastTable from '@/components/widget-forecast-table'
import styles from '@/components/widget-forecast-table/styles.module.sass'
import WidgetSensor, { WidgetSensorProps } from '@/components/widget-sensor'
import WeatherChart from '@/components/widget-sensor/WeatherChart'
import WidgetSummary from '@/components/widget-summary'
import WindDirectionIcon from '@/components/wind-direction-icon'
import { POLING_INTERVAL_CURRENT, POLING_INTERVAL_FORECAST } from '@/pages/_app'
import { getWeatherI18nKey } from '@/tools/conditions'
import { currentDate, formatDate, yesterdayDate } from '@/tools/date'
import { round } from '@/tools/helpers'
import {
    convertHpaToMmHg,
    convertWindDirection,
    filterRecentData,
    getCloudinessColor,
    getMinMaxValues,
    getTemperatureColor
} from '@/tools/weather'
import { Column } from '@/ui/table'

type IndexPageProps = object

type WidgetType = Pick<WidgetSensorProps, 'title' | 'unit' | 'icon'> & {
    source: keyof ApiModel.Sensors
}

const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n, t } = useTranslation()

    const { data: forecastHourly, isLoading: hourlyLoading } = API.useGetForecastQuery('hourly', {
        pollingInterval: POLING_INTERVAL_FORECAST
    })

    const { data: forecastDaily, isLoading: dailyLoading } = API.useGetForecastQuery('daily', {
        pollingInterval: POLING_INTERVAL_FORECAST
    })

    const { data: current, isLoading: currentLoading } = API.useGetCurrentQuery(undefined, {
        pollingInterval: POLING_INTERVAL_CURRENT
    })

    const { data: history, isLoading: historyLoading } = API.useGetHistoryQuery(
        {
            start_date: formatDate(yesterdayDate, 'YYYY-MM-DD'),
            end_date: formatDate(currentDate.toDate(), 'YYYY-MM-DD')
        },
        { pollingInterval: POLING_INTERVAL_CURRENT }
    )

    const widgets: WidgetType[] = [
        {
            title: t('humidity'),
            unit: '%',
            icon: 'Water',
            source: 'humidity'
        },
        {
            title: t('temperature'),
            unit: '°C',
            icon: 'Thermometer',
            source: 'temperature'
        }
    ]

    const tableColumnsDaily: Column<ApiModel.Weather>[] = [
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
            className: styles.cellIcon,
            formatter: (weatherId, { date }) => (
                <WeatherIcon
                    weatherId={weatherId as number}
                    date={date}
                />
            )
        },
        {
            header: t('weather-conditions'),
            accessor: 'weatherId',
            className: styles.cellConditions,
            formatter: (weatherId) => t(getWeatherI18nKey(weatherId || ''))
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
        }
    ]

    const tableColumnsHourly: Column<ApiModel.Weather>[] = [
        {
            header: t('time'),
            accessor: 'date',
            className: styles.cellDate,
            isSortable: true,
            formatter: (date) => formatDate(date as string, t('date-only-hour'))
        },
        {
            header: t('weather'),
            accessor: 'weatherId',
            className: styles.cellIcon,
            formatter: (weatherId, { date }) => (
                <WeatherIcon
                    weatherId={weatherId as number}
                    date={date}
                />
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
            showComparison: true,
            isSortable: true,
            formatter: (pressure) => convertHpaToMmHg(pressure)
        },
        {
            header: t('wind'),
            accessor: 'windSpeed',
            className: styles.cellWind,
            isSortable: true,
            formatter: (windSpeed) => <>{round(Number(windSpeed), 1)} м/с</>
        },
        {
            header: '',
            accessor: 'windDeg',
            className: styles.windDeg,
            formatter: (windDeg) => <WindDirectionIcon direction={convertWindDirection(Number(windDeg))} />
        }
    ]

    return (
        <AppLayout>
            <NextSeo
                title={t('weather-orenburg-now', { date: formatDate(current?.date ?? new Date()) })}
                description={t('main-page-description')}
                canonical={'https://meteo.miksoft.pro'}
                openGraph={{
                    description: t('site-description'),
                    images: [
                        {
                            height: 1640,
                            url: '/images/main.jpg',
                            width: 2024
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
                <WidgetSummary
                    loading={currentLoading}
                    weather={current}
                />

                {widgets?.map((widget) => (
                    <WidgetSensor
                        key={`widget-${widget.source}`}
                        link={{ href: '/sensors', title: t('weather-sensors') + ' - ' + widget.title }}
                        unit={widget.unit}
                        title={widget.title}
                        icon={widget.icon}
                        loading={currentLoading}
                        chartLoading={historyLoading}
                        minMax={getMinMaxValues(history, widget.source)}
                        currentValue={current?.[widget.source]}
                        chart={
                            <WeatherChart
                                source={widget.source}
                                data={filterRecentData(history, 12)}
                            />
                        }
                    />
                ))}

                <WidgetForecastTable
                    title={t('weather-forecast-by-days')}
                    loading={dailyLoading}
                    columns={tableColumnsDaily}
                    data={forecastDaily}
                />

                <WidgetForecastTable
                    title={t('weather-forecast-hourly')}
                    loading={hourlyLoading}
                    columns={tableColumnsHourly}
                    data={forecastHourly}
                />

                <WidgetChart
                    type={'temperature'}
                    loading={historyLoading}
                    data={filterRecentData(history, 24)}
                />

                <WidgetChart
                    type={'clouds'}
                    loading={historyLoading}
                    data={filterRecentData(history, 24)}
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
