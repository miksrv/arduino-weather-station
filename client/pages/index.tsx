import React, { useMemo } from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiModel, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetChart from '@/components/widget-chart'
import WidgetForecastTable from '@/components/widget-forecast-table'
import WidgetSensor, { WidgetSensorProps } from '@/components/widget-sensor'
import WeatherChart from '@/components/widget-sensor/WeatherChart'
import WidgetSummary from '@/components/widget-summary'
import { POLING_INTERVAL_CURRENT, POLING_INTERVAL_FORECAST } from '@/pages/_app'
import { currentDate, formatDate, yesterdayDate } from '@/tools/date'
import { LocaleType } from '@/tools/types'
import { filterRecentData, getMinMaxValues } from '@/tools/weather'

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

    const history12HoursData = useMemo(() => filterRecentData(history, 12), [history])
    const history24HoursData = useMemo(() => filterRecentData(history, 24), [history])

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

    return (
        <AppLayout>
            <NextSeo
                title={t('weather-orenburg-now', { date: formatDate(current?.date ?? new Date()) })}
                description={t('main-page-description')}
                canonical={process.env.NEXT_PUBLIC_SITE_LINK}
                openGraph={{
                    description: t('site-description'),
                    images: [
                        {
                            height: 1642,
                            url: '/images/main.jpg',
                            width: 2032
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
                        minMax={getMinMaxValues(history12HoursData, widget.source)}
                        currentValue={current?.[widget.source]}
                        chart={
                            <WeatherChart
                                source={widget.source}
                                data={history12HoursData}
                            />
                        }
                    />
                ))}

                <WidgetForecastTable
                    title={t('weather-forecast-by-days')}
                    link={{ href: '/forecast', title: t('forecast') }}
                    columnsPreset={['date', 'weather', 'temperature', 'clouds']}
                    loading={dailyLoading}
                    data={forecastDaily}
                    defaultSort={{ key: 'date', direction: 'asc' }}
                    stickyHeader={true}
                />

                <WidgetForecastTable
                    title={t('weather-forecast-hourly')}
                    link={{ href: '/forecast', title: t('forecast') }}
                    columnsPreset={['time', 'weatherIcon', 'temperature', 'clouds', 'pressure', 'wind']}
                    loading={hourlyLoading}
                    data={forecastHourly}
                    defaultSort={{ key: 'date', direction: 'asc' }}
                    stickyHeader={true}
                />

                <WidgetChart
                    type={'temperature'}
                    loading={historyLoading}
                    data={history24HoursData}
                />

                <WidgetChart
                    type={'clouds'}
                    loading={historyLoading}
                    data={history24HoursData}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<IndexPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default IndexPage
