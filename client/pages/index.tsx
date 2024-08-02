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

interface IndexPageProps {

}

const filterRecentData = (data?: ApiModel.History[]): ApiModel.History[] | [] => {
    const now = dayjs.utc()
    const twelveHoursAgo = now.subtract(12, 'hours')

    return data?.filter(item => {
        const itemDate = dayjs.utc(item.date.date)
        return itemDate.isAfter(twelveHoursAgo)
    }) || []
}


const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n } = useTranslation()

    const { data: current } = API.useGetCurrentQuery(undefined, {pollingInterval: 60 * 1000})
    const { data: history } = API.useGetHistoryQuery({
        start_date: formatDate(dayjs().subtract(1, 'day').format(), 'YYYY-MM-DD'),
        end_date: formatDate(new Date(), 'YYYY-MM-DD')
    }, {pollingInterval: 60 * 1000})

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

            <Widget
                title={'Температура'}
                unit={'C'}
                currentValue={current?.conditions?.temperature}
                chart={
                    <WeatherChart
                        data={filterRecentData(history)}
                        yAxisField='temperature'
                    />
                }
            />

            <Widget
                title={'Влажность'}
                unit={'%'}
                currentValue={current?.conditions?.humidity}
                chart={
                    <WeatherChart
                        data={filterRecentData(history)}
                        yAxisField='humidity'
                    />
                }
            />
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<IndexPageProps>> => {
            const locale = (context.locale ?? 'en')
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
