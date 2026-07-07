import React, { useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Spinner } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { generateNextSeo } from 'next-seo/pages'

import { API, ApiType, setLocale } from '@/api'
import { urlAPI } from '@/api/api'
import { wrapper } from '@/api/store'
import { Maybe } from '@/api/types'
import AppLayout from '@/components/app-layout'
import WidgetChart from '@/components/widget-chart'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'
import { currentDate, formatDate, getDateTimeFormat, isValidDateString, yesterdayDate } from '@/tools/date'
import { encodeQueryData } from '@/tools/helpers'
import { LocaleType } from '@/tools/types'

interface HistoryPageProps {
    initialStartDate?: string
    initialEndDate?: string
    hasDateParams: boolean
}

const HistoryPage: NextPage<HistoryPageProps> = ({ initialStartDate, initialEndDate, hasDateParams }) => {
    const router = useRouter()
    const { i18n, t } = useTranslation()

    const [period, setPeriod] = useState<[string?, string?]>(() => [initialStartDate, initialEndDate])

    const historyDateParam: Maybe<ApiType.History.Request> = useMemo(
        () => (period?.[0] && period?.[1] ? { end_date: period[1], start_date: period[0] } : undefined),
        [period]
    )

    const {
        data: history,
        isLoading: historyLoading,
        isFetching: historyFetching
    } = API.useGetHistoryQuery(historyDateParam, {
        pollingInterval: POLING_INTERVAL_CURRENT,
        skip: !historyDateParam
    })

    const dateFormat = useMemo(
        () => getDateTimeFormat(period?.[0], period?.[1], i18n.language === 'en'),
        [period, i18n.language]
    )

    useEffect(() => {
        if (!initialStartDate || !initialEndDate) {
            setPeriod([formatDate(yesterdayDate, 'YYYY-MM-DD'), formatDate(currentDate.toDate(), 'YYYY-MM-DD')])
        }
    }, [])

    const handlePeriodSelect = (startDate?: string, endDate?: string) => {
        setPeriod([startDate, endDate])

        if (startDate && endDate) {
            void router.replace(
                { pathname: router.pathname, query: { end_date: endDate, start_date: startDate } },
                undefined,
                { shallow: true }
            )
        }
    }

    return (
        <AppLayout>
            <Head>
                {generateNextSeo({
                    title: t('historical-weather-data'),
                    description: t('history-page-description'),
                    canonical: `${process.env.NEXT_PUBLIC_SITE_LINK}/history`,
                    noindex: hasDateParams,
                    nofollow: false,
                    openGraph: {
                        description: t('history-page-description'),
                        images: [
                            {
                                height: 1292,
                                url: `${process.env.NEXT_PUBLIC_SITE_LINK}/images/history.jpg`,
                                width: 2028
                            }
                        ],
                        locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                        siteName: t('weather-in-orenburg'),
                        title: t('historical-weather-data'),
                        type: 'website',
                        url: `${process.env.NEXT_PUBLIC_SITE_LINK}/history`
                    },
                    twitter: {
                        cardType: 'summary_large_image'
                    }
                })}
            </Head>

            <div className={'toolbar'}>
                <DatePicker
                    disabled={historyLoading || historyFetching}
                    datePeriod={period}
                    locale={i18n.language === 'en' ? 'en' : 'ru'}
                    buttonMode={'secondary'}
                    minDate={'2021-01-01'}
                    maxDate={formatDate(currentDate.toDate(), 'YYYY-MM-DD')}
                    placeholder={t('select-date-range')}
                    onPeriodSelect={handlePeriodSelect}
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
            const translations = await serverSideTranslations(locale, ['common'])

            store.dispatch(setLocale(locale))

            const { end_date, start_date } = context.query
            const hasValidPeriod = isValidDateString(start_date) && isValidDateString(end_date)

            return {
                props: {
                    ...translations,
                    hasDateParams: Boolean(start_date || end_date),
                    ...(hasValidPeriod ? { initialEndDate: end_date, initialStartDate: start_date } : {})
                }
            }
        }
)

export default HistoryPage
