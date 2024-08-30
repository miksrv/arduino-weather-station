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
import { colors } from '@/tools/colors'
import { formatDate } from '@/tools/helpers'
import { filterRecentData, getMinMaxValues } from '@/tools/weather'
import { IconTypes } from '@/ui/icon/types'

interface IndexPageProps {}

type WidgetType = {
    title?: string
    unit?: string
    color?: keyof typeof colors
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
            color: 'red',
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
            color: 'pink',
            icon: 'Thermometer',
            source: 'dewPoint'
        },
        {
            title: t('humidity'),
            unit: '%',
            color: 'cyan',
            icon: 'Water',
            source: 'humidity'
        },
        {
            title: t('wind-speed'),
            unit: t('meters-per-second'),
            color: 'green',
            icon: 'Wind',
            source: 'windSpeed'
        },
        {
            title: t('wind-gust'),
            unit: t('meters-per-second'),
            color: 'teal',
            icon: 'Wind',
            source: 'windGust'
        },
        {
            title: t('wind-deg'),
            unit: '°',
            color: 'olive',
            icon: 'Compass',
            source: 'windDeg'
        },
        {
            title: t('cloudiness'),
            unit: '%',
            color: 'navy',
            icon: 'Cloud',
            source: 'clouds'
        },
        {
            title: t('precipitation'),
            unit: t('millimeters'),
            color: 'blue',
            icon: 'WaterDrop',
            source: 'precipitation'
        },
        {
            title: t('uv-index'),
            color: 'violet',
            icon: 'Sun',
            source: 'uvIndex'
        },
        {
            title: t('sol-energy'),
            unit: t('mj-m2'),
            color: 'yellow',
            icon: 'SolarPower',
            source: 'solEnergy'
        },
        {
            title: t('sol-radiation'),
            unit: t('w-m2'),
            color: 'lime',
            icon: 'Electric',
            source: 'solRadiation'
        }
    ]

    return (
        <AppLayout>
            <NextSeo
                title={t('weather-sensors')}
                description={t('main-page-description')}
                canonical={'https://meteo.miksoft.pro'}
                openGraph={{
                    description: t('site-description'),
                    images: [
                        {
                            height: 1640,
                            url: '/images/sensors.jpg',
                            width: 2028
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
                                data={filterRecentData(history, 24)}
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