import React, { useMemo } from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiModel, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetSensor, { WidgetSensorProps } from '@/components/widget-sensor'
import WeatherChart from '@/components/widget-sensor/WeatherChart'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'
import { currentDate, formatDate, yesterdayDate } from '@/tools/date'
import { LocaleType } from '@/tools/types'
import { convertHpaToMmHg, filterRecentData, getMinMaxValues } from '@/tools/weather'

type IndexPageProps = object

type WidgetType = Pick<WidgetSensorProps, 'title' | 'unit' | 'icon' | 'formatter' | 'size' | 'link'> & {
    source: keyof ApiModel.Sensors
}

const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n, t } = useTranslation()

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
            title: t('temperature'),
            unit: '°C',
            icon: 'Thermometer',
            source: 'temperature',
            size: 'x2',
            link: { href: '/history' }
        },
        {
            title: t('feels-like'),
            unit: '°C',
            icon: 'Thermometer',
            source: 'feelsLike',
            link: { href: '/history' }
        },
        {
            title: t('dew-point'),
            unit: '°C',
            icon: 'Thermometer',
            source: 'dewPoint',
            link: { href: '/history' }
        },
        {
            title: t('pressure'),
            unit: t('mm-hg'),
            icon: 'Pressure',
            source: 'pressure',
            formatter: convertHpaToMmHg,
            size: 'x2',
            link: { href: '/history' }
        },
        {
            title: t('cloudiness'),
            unit: '%',
            icon: 'Cloud',
            source: 'clouds',
            link: { href: '/history' }
        },
        {
            title: t('visibility'),
            unit: t('meters_short'),
            icon: 'Eye',
            source: 'visibility'
        },
        {
            title: t('humidity'),
            unit: '%',
            icon: 'Water',
            source: 'humidity',
            link: { href: '/history' }
        },
        {
            title: t('wind-speed'),
            unit: t('meters-per-second'),
            icon: 'Wind',
            source: 'windSpeed',
            link: { href: '/history' }
        },
        {
            title: t('wind-gust'),
            unit: t('meters-per-second'),
            icon: 'Wind',
            source: 'windGust'
        },
        {
            title: t('wind-deg'),
            unit: '°',
            icon: 'Compass',
            source: 'windDeg',
            link: { href: '/history' }
        },
        {
            title: t('precipitation'),
            unit: t('millimeters'),
            icon: 'WaterDrop',
            source: 'precipitation',
            link: { href: '/history' }
        },
        {
            title: t('uv-index'),
            icon: 'Sun',
            source: 'uvIndex'
        },
        {
            title: t('sol-energy'),
            unit: t('mj-m2'),
            icon: 'SolarPower',
            source: 'solEnergy'
        },
        {
            title: t('sol-radiation'),
            unit: t('w-m2'),
            icon: 'Lightning',
            source: 'solRadiation'
        }
    ]

    return (
        <AppLayout>
            <NextSeo
                title={t('weather-sensors')}
                description={t('sensors-page-description')}
                canonical={`${process.env.NEXT_PUBLIC_SITE_LINK}/sensors`}
                openGraph={{
                    description: t('site-description'),
                    images: [
                        {
                            height: 1480,
                            url: '/images/sensors.jpg',
                            width: 2026
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
                        {...widget}
                        key={`widget-${widget.source}`}
                        loading={currentLoading}
                        chartLoading={historyLoading}
                        minMax={getMinMaxValues(history12HoursData, widget.source)}
                        currentValue={current?.[widget.source]}
                        formatter={widget?.formatter}
                        chart={
                            <WeatherChart
                                source={widget.source}
                                data={history24HoursData}
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
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default IndexPage
