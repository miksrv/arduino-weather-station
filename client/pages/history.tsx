import React, { useEffect, useMemo, useState } from 'react'
import { Button, Spinner } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiType, setLocale } from '@/api'
import { urlAPI } from '@/api/api'
import { wrapper } from '@/api/store'
import { Maybe } from '@/api/types'
import AppLayout from '@/components/app-layout'
import PeriodSelector from '@/components/period-selector'
import WidgetChart from '@/components/widget-chart'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'
import { currentDate, formatDate, getDateTimeFormat, yesterdayDate } from '@/tools/date'
import { encodeQueryData } from '@/tools/helpers'
import { LocaleType } from '@/tools/types'

type HistoryPageProps = object

const HistoryPage: NextPage<HistoryPageProps> = () => {
    const { i18n, t } = useTranslation()

    const [period, setPeriod] = useState<string[]>()

    const historyDateParam: Maybe<ApiType.History.Request> = useMemo(
        () => ({
            start_date: period?.[0] ?? '',
            end_date: period?.[1] ?? ''
        }),
        [period]
    )

    const {
        data: history,
        isLoading: historyLoading,
        isFetching: historyFetching
    } = API.useGetHistoryQuery(historyDateParam, {
        pollingInterval: POLING_INTERVAL_CURRENT,
        skip: !period?.[0] || !period?.[1]
    })

    const dateFormat = useMemo(
        () => getDateTimeFormat(period?.[0], period?.[1], i18n.language === 'en'),
        [period, i18n.language]
    )

    useEffect(() => {
        setPeriod([formatDate(yesterdayDate, 'YYYY-MM-DD'), formatDate(currentDate.toDate(), 'YYYY-MM-DD')])
    }, [])

    return (
        <AppLayout>
            <NextSeo
                title={t('historical-weather-data')}
                description={t('history-page-description')}
                canonical={`${process.env.NEXT_PUBLIC_SITE_LINK}/history`}
                openGraph={{
                    description: t('site-description'),
                    images: [
                        {
                            height: 1292,
                            url: '/images/history.jpg',
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

            <div className={'toolbar'}>
                <PeriodSelector
                    disabled={historyLoading || historyFetching}
                    periodDates={period}
                    onSetPeriod={setPeriod}
                />

                <Button
                    mode={'secondary'}
                    icon={'Download'}
                    link={`${urlAPI}history/export${encodeQueryData(historyDateParam)}`}
                >
                    {t('download-csv')}
                </Button>

                {historyFetching && !historyLoading && (
                    <div className={'loading'}>
                        <Spinner /> <span>{t('please-wait-loading')}</span>
                    </div>
                )}
            </div>

            <div className={'widgets-list'}>
                <WidgetChart
                    fullWidth={true}
                    type={'temperature'}
                    data={history}
                    loading={historyLoading}
                    dateFormat={dateFormat}
                />

                <WidgetChart
                    fullWidth={true}
                    type={'clouds'}
                    data={history}
                    loading={historyLoading}
                    dateFormat={dateFormat}
                />

                <WidgetChart
                    fullWidth={true}
                    type={'pressure'}
                    data={history}
                    loading={historyLoading}
                    dateFormat={dateFormat}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<HistoryPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default HistoryPage
