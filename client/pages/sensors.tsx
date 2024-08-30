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
import WidgetSensor from '@/components/widget-sensor'
import WeatherChart from '@/components/widget-sensor/WeatherChart'
import { formatDate } from '@/tools/helpers'
import { getMinMaxValues } from '@/tools/weather'
import { IconTypes } from '@/ui/icon/types'

interface IndexPageProps {}

const filterRecentData = (data?: ApiModel.Weather[], hours: number = 24): ApiModel.Weather[] | [] => {
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
            title: t('feels-like'),
            unit: '°C',
            color: 'orange',
            icon: 'Thermometer',
            source: 'feelsLike'
        },
        {
            title: t('dew-point'),
            unit: '°C',
            color: 'peach',
            icon: 'Thermometer',
            source: 'dewPoint'
        },
        {
            title: t('humidity'),
            unit: '%',
            color: 'seal',
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
            title: t('wind-speed'),
            unit: 'м/с',
            color: 'violet',
            icon: 'Wind',
            source: 'windGust'
        },
        {
            title: t('wind-deg'),
            unit: '°',
            color: 'raspberry',
            icon: 'Compass',
            source: 'windDeg'
        },
        {
            title: t('cloudiness'),
            unit: '%',
            color: 'violet',
            icon: 'Cloud',
            source: 'clouds'
        },
        {
            title: t('precipitation'),
            unit: 'мм.',
            color: 'raspberry',
            icon: 'WaterDrop',
            source: 'precipitation'
        },
        {
            title: t('uv-index'),
            color: 'raspberry',
            icon: 'Sun',
            source: 'uvIndex'
        },
        {
            title: t('sol-energy'),
            unit: 'MJ /m2',
            color: 'raspberry',
            icon: 'SolarPower',
            source: 'solEnergy'
        },
        {
            title: t('sol-radiation'),
            unit: 'W/m2',
            color: 'raspberry',
            icon: 'Electric',
            source: 'solRadiation'
        }
    ]

    return (
        <AppLayout>
            <NextSeo
                title={t('weather-orenburg-now', { date: formatDate(current?.date || new Date()) })}
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
                    <WidgetSensor
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
