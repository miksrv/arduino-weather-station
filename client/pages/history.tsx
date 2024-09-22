import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiType } from '@/api'
import { urlAPI } from '@/api/api'
import { setLocale } from '@/api/applicationSlice'
import { wrapper } from '@/api/store'
import { Maybe } from '@/api/types'
import AppLayout from '@/components/app-layout'
import WidgetChart from '@/components/widget-chart'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'
import { currentDate, formatDate, getDateTimeFormat, yesterdayDate } from '@/tools/date'
import { encodeQueryData } from '@/tools/helpers'
import Button from '@/ui/button'
import Datepicker from '@/ui/datepicker'
import { findPresetByDate } from '@/ui/datepicker/Datepicker'
import Popout from '@/ui/popout'
import { PopoutHandle } from '@/ui/popout/Popout'
import Spinner from '@/ui/spinner'

type HistoryPageProps = object

const MIN_DATE = '2021-01-01'

const HistoryPage: NextPage<HistoryPageProps> = () => {
    const { i18n, t } = useTranslation()

    const popoutRef = useRef<PopoutHandle>(null)

    const [startDate, setStartDate] = useState<string>()
    const [endDate, setEndDate] = useState<string>()

    const historyDateParam: Maybe<ApiType.History.Request> = useMemo(
        () => ({
            start_date: startDate ?? '',
            end_date: endDate ?? ''
        }),
        [startDate, endDate]
    )

    const {
        data: history,
        isLoading: historyLoading,
        isFetching: historyFetching
    } = API.useGetHistoryQuery(historyDateParam, {
        pollingInterval: POLING_INTERVAL_CURRENT,
        skip: !startDate?.length || !endDate?.length
    })

    const currentDatePreset = useMemo((): string => {
        const preset = findPresetByDate(startDate, endDate, i18n.language)

        return preset ? preset : startDate && endDate ? `${startDate} - ${endDate}` : ''
    }, [startDate, endDate, i18n.language])

    const dateFormat = useMemo(
        () => getDateTimeFormat(startDate, endDate, i18n.language === 'en'),
        [startDate, endDate, i18n.language]
    )

    useEffect(() => {
        setStartDate(formatDate(yesterdayDate, 'YYYY-MM-DD'))
        setEndDate(formatDate(currentDate.toDate(), 'YYYY-MM-DD'))
    }, [])

    return (
        <AppLayout>
            <NextSeo
                title={t('historical-weather-data')}
                description={t('history-page-description')}
                canonical={'https://meteo.miksoft.pro'}
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
                <Popout
                    ref={popoutRef}
                    action={currentDatePreset}
                    mode={'secondary'}
                    position={'left'}
                >
                    <Datepicker
                        locale={i18n.language}
                        startDate={startDate}
                        endDate={endDate}
                        minDate={MIN_DATE}
                        maxDate={formatDate(currentDate.toDate(), 'YYYY-MM-DD')}
                        onPeriodSelect={(startDate, endDate) => {
                            setStartDate(startDate)
                            setEndDate(endDate)

                            if (popoutRef.current) {
                                popoutRef.current.close()
                            }
                        }}
                    />
                </Popout>

                <Button
                    mode={'secondary'}
                    icon={'Download'}
                    disabled={historyLoading || historyFetching}
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
