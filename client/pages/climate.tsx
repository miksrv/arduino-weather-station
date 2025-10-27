import React, { useEffect, useState } from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetClimate, { ClimateType } from '@/components/widget-climate'
import { LocaleType } from '@/tools/types'

const ClimatePage: NextPage = () => {
    const { i18n, t } = useTranslation()

    const [yearPeriods, setYearPeriods] = useState<string[][]>([])
    const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0)
    const [allData, setAllData] = useState<ClimateType[]>([])

    useEffect(() => {
        const currentYear = new Date().getFullYear()
        const periods: string[][] = []
        for (let year = 2022; year <= currentYear; year++) {
            periods.push([`${year}-01-01`, `${year}-12-31`])
        }

        setYearPeriods(periods)
    }, [])

    const { data: yearHistories, isLoading } = API.useGetHistoryQuery(
        yearPeriods[currentPeriodIndex]
            ? { start_date: yearPeriods[currentPeriodIndex][0], end_date: yearPeriods[currentPeriodIndex][1] }
            : undefined,
        { skip: !yearPeriods[currentPeriodIndex], refetchOnMountOrArgChange: true }
    )

    useEffect(() => {
        if (yearHistories) {
            const currentIndex = currentPeriodIndex

            setAllData((prev) => [
                ...prev,
                {
                    year: yearPeriods[currentIndex][0].split('-')[0],
                    weather: yearHistories
                }
            ])

            if (currentIndex < yearPeriods.length - 1) {
                setTimeout(() => {
                    setCurrentPeriodIndex((prev) => prev + 1)
                }, 500)
            }
        }
    }, [yearHistories])

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

            <div className={'widgets-list'}>
                <WidgetClimate
                    data={allData}
                    loading={isLoading}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<object>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default ClimatePage
