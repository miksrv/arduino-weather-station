import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API } from '@/api'
import { setLocale } from '@/api/applicationSlice'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetChart from '@/components/widget-chart'
import { formatDate, TIME_ZONE } from '@/tools/helpers'
import Calendar from '@/ui/datepicker'
import Popout from '@/ui/popout'

interface HistoryPageProps {}

const HistoryPage: NextPage<HistoryPageProps> = () => {
    const { i18n, t } = useTranslation()

    const dateUTC = dayjs().utc(false).tz(TIME_ZONE)

    const [startDate, setStartDate] = useState<string>()
    const [endDate, setEndDate] = useState<string>()

    const {
        data: history,
        isLoading: historyLoading,
        isFetching: historyFetching
    } = API.useGetHistoryQuery(
        {
            start_date: startDate ?? '',
            end_date: endDate ?? ''
        },
        { pollingInterval: 60 * 1000, skip: !startDate?.length || !endDate?.length }
    )

    useEffect(() => {
        setStartDate(formatDate(dateUTC.subtract(1, 'day').toDate(), 'YYYY-MM-DD'))
        setEndDate(formatDate(dateUTC.toDate(), 'YYYY-MM-DD'))
    }, [])

    return (
        <AppLayout>
            <NextSeo
                title={t('weather-sensors')}
                description={t('sensors-page-description')}
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

            <Popout
                action={
                    <div>
                        {startDate} - {endDate}
                    </div>
                }
                position={'left'}
            >
                <Calendar
                    startDate={startDate}
                    endDate={endDate}
                    onPeriodSelect={(startDate, endDate) => {
                        setStartDate(startDate)
                        setEndDate(endDate)
                    }}
                    minDate={'01-01-2021'}
                    maxDate={formatDate(dateUTC.toDate(), 'YYYY-MM-DD')}
                />
            </Popout>

            <div className={'widgets-list'}>
                <WidgetChart
                    type={'temperature'}
                    loading={historyLoading}
                    fullWidth={true}
                    data={history}
                />

                <WidgetChart
                    type={'clouds'}
                    loading={historyLoading}
                    fullWidth={true}
                    data={history}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<HistoryPageProps>> => {
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

export default HistoryPage
