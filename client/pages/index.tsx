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
import Widget from '@/components/widget'
import WeatherChart from '@/components/widget/WeatherChart'
import { formatDate } from '@/tools/helpers'
import { getMinMaxValues } from '@/tools/weather'
import { IconTypes } from '@/ui/icon/types'

interface IndexPageProps {}

const filterRecentData = (data?: ApiModel.History[]): ApiModel.History[] | [] => {
    const now = dayjs.utc()
    const twelveHoursAgo = now.subtract(12, 'hours')

    return (
        data?.filter((item) => {
            const itemDate = dayjs.utc(item.date.date)
            return itemDate.isAfter(twelveHoursAgo)
        }) || []
    )
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

    const { data: current } = API.useGetCurrentQuery(undefined, { pollingInterval: 60 * 1000 })
    const { data: history } = API.useGetHistoryQuery(
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
            color: 'orange',
            icon: 'Thermometer',
            source: 'temperature'
        },
        {
            title: t('dewPoint'),
            unit: '°C',
            color: 'peach',
            icon: 'Thermometer',
            source: 'dewPoint'
        },
        {
            title: t('humidity'),
            unit: '%',
            color: 'blue',
            icon: 'Water',
            source: 'humidity'
        },
        {
            title: t('windSpeed'),
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

    return (
        <AppLayout>
            <NextSeo
                title={''}
                description={''}
                canonical={''}
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
                        minMax={getMinMaxValues(history, widget.source)}
                        currentValue={current?.conditions?.[widget.source]}
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
