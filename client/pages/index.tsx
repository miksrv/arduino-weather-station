import React from 'react'
import dayjs from 'dayjs'
import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiModel } from '@/api'
import { setLocale } from '@/api/applicationSlice'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WeatherIcon from '@/components/weather-icon'
import Widget from '@/components/widget'
import WeatherChart from '@/components/widget/WeatherChart'
import WidgetChart from '@/components/widget-chart'
import WidgetForecastTable from '@/components/widget-forecast-table'
import styles from '@/components/widget-forecast-table/styles.module.sass'
import WindDirectionIcon from '@/components/wind-direction-icon'
import { getWeatherI18nKey } from '@/tools/conditions'
import { formatDate, round } from '@/tools/helpers'
import {
    convertHpaToMmHg,
    convertWindDirection,
    getCloudinessColor,
    getMinMaxValues,
    getTemperatureColor
} from '@/tools/weather'
import { IconTypes } from '@/ui/icon/types'
import { Column } from '@/ui/table'

interface IndexPageProps {}

const filterRecentData = (data?: ApiModel.Weather[], hours: number = 12): ApiModel.Weather[] | [] => {
    const now = dayjs.utc()
    const hoursAgo = now.subtract(hours, 'hours')

    return data?.filter((item) => dayjs.utc(item.date).isAfter(hoursAgo)) || []
}

type WidgetType = {
    title?: string
    unit?: string
    color?: string
    icon?: IconTypes
    source: keyof ApiModel.Weather
}

const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n, t } = useTranslation()

    const { data: forecastHourly, isLoading: hourlyLoading } = API.useGetForecastQuery('hourly', {
        pollingInterval: 10 * 60 * 1000
    })
    const { data: forecastDaily, isLoading: dailyLoading } = API.useGetForecastQuery('daily', {
        pollingInterval: 10 * 60 * 1000
    })

    const { data: current, isLoading: currentLoading } = API.useGetCurrentQuery(undefined, {
        pollingInterval: 5 * 60 * 1000
    })
    const { data: history, isLoading: historyLoading } = API.useGetHistoryQuery(
        {
            start_date: formatDate(dayjs().subtract(1, 'day').format(), 'YYYY-MM-DD'),
            end_date: formatDate(new Date(), 'YYYY-MM-DD')
        },
        { pollingInterval: 60 * 1000 }
    )

    const widgets: WidgetType[] = [
        {
            title: t('temperature'),
            unit: '°C',
            color: 'fire',
            icon: 'Thermometer',
            source: 'temperature'
        },
        {
            title: t('humidity'),
            unit: '%',
            color: 'blue',
            icon: 'Water',
            source: 'humidity'
        },
        {
            title: t('wind-speed'),
            unit: 'м/с',
            color: 'purple',
            icon: 'Wind',
            source: 'windSpeed'
        },
        {
            title: t('cloudiness'),
            unit: '%',
            color: 'violet',
            icon: 'Cloud',
            source: 'clouds'
        }
    ]

    const tableColumnsDaily: Column<ApiModel.Weather>[] = [
        { header: t('date'), accessor: 'date', className: styles.cellDate, isSortable: true },
        {
            header: t('weather'),
            accessor: 'weatherId',
            className: styles.cellIcon,
            formatter: (weatherId) => <WeatherIcon weatherId={weatherId as number} />
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
            background: (temperature) => getTemperatureColor(temperature),
            formatter: (temperature) => <>{round(Number(temperature), 1)} °C</>,
            isSortable: true
        },
        {
            header: t('clouds'),
            accessor: 'clouds',
            className: styles.cellClouds,
            background: (clouds) => getCloudinessColor(clouds),
            formatter: (clouds) => <>{clouds}%</>,
            isSortable: true
        }
    ]

    const tableColumnsHourly: Column<ApiModel.Weather>[] = [
        { header: t('time'), accessor: 'date', className: styles.cellDate, isSortable: true },
        {
            header: t('weather'),
            accessor: 'weatherId',
            className: styles.cellIcon,
            formatter: (weatherId) => <WeatherIcon weatherId={weatherId as number} />
        },
        {
            header: t('temperature-short'),
            accessor: 'temperature',
            className: styles.cellTemperature,
            background: (temperature) => getTemperatureColor(temperature),
            formatter: (temperature) => <>{round(Number(temperature), 1)} °C</>,
            isSortable: true
        },
        {
            header: t('clouds'),
            accessor: 'clouds',
            className: styles.cellClouds,
            background: (clouds) => getCloudinessColor(clouds),
            formatter: (clouds) => <>{clouds}%</>,
            isSortable: true
        },
        {
            header: t('pressure'),
            accessor: 'pressure',
            className: styles.cellPressure,
            formatter: (pressure) => round(convertHpaToMmHg(pressure), 1),
            showComparison: true,
            isSortable: true
        },
        {
            header: t('wind'),
            accessor: 'windSpeed',
            className: styles.cellWind,
            formatter: (windSpeed) => <>{round(Number(windSpeed), 1)} м/с</>,
            isSortable: true
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
                title={t('weather-orenburg-now', { date: formatDate(current?.date) })}
                description={t('main-page-description')}
                canonical={'https://meteo.miksoft.pro'}
                openGraph={{
                    description: '',
                    images: [
                        {
                            height: 1538,
                            url: '/images/pages/main.jpg',
                            width: 1768
                        }
                    ],
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: '',
                    title: '',
                    type: 'website',
                    url: ''
                }}
            />

            <div className={'widgets-list'}>
                {widgets?.map((widget) => (
                    <Widget
                        key={`widget-${widget.source}`}
                        unit={widget.unit}
                        title={widget.title}
                        icon={widget.icon}
                        loading={currentLoading}
                        chartLoading={historyLoading}
                        minMax={getMinMaxValues(history, widget.source)}
                        currentValue={current?.[widget.source]}
                        chart={
                            <WeatherChart
                                color={widget.color as any}
                                yAxisField={widget.source}
                                data={filterRecentData(history)}
                            />
                        }
                    />
                ))}

                <WidgetForecastTable
                    title={'Прогноз погоды - По дням'}
                    loading={dailyLoading}
                    columns={tableColumnsDaily}
                    data={forecastDaily?.map((forecast) => ({
                        ...forecast,
                        date: formatDate(forecast.date, 'dd, MMM D')
                    }))}
                />

                <WidgetForecastTable
                    title={'Прогноз погоды - По часам'}
                    loading={hourlyLoading}
                    columns={tableColumnsHourly}
                    data={forecastHourly?.map((forecast) => ({ ...forecast, date: formatDate(forecast.date, 'HH A') }))}
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
