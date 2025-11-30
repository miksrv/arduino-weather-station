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
    // const [averageTemperatures, setAverageTemperatures] = useState<Array<{ year: string; avgTemp: number }>>([])

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

            // Calculate average temperature for the year
            // if (Array.isArray(yearHistories) && yearHistories.length > 0) {
            //     const months = Array.from({ length: 12 }, (_, i) => i + 1)
            //     const currentYear = yearPeriods?.[currentIndex]?.[0]?.split('-')[0]
            //     const monthTemps: number[] = []
            //
            //     months.forEach((month) => {
            //         const monthData = yearHistories.filter((item: any) => {
            //             const date = new Date(item.date)
            //             return date.getMonth() + 1 === month
            //         })
            //         if (monthData.length > 0) {
            //             const temps = monthData
            //                 .map((item: any) => item.temperature)
            //                 .filter((t: number) => typeof t === 'number')
            //             const avg = temps.length
            //                 ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length
            //                 : null
            //             if (avg != null) {
            //                 monthTemps.push(avg)
            //             }
            //         } else {
            //             const prevTemps: number[] = []
            //             allData.forEach((yearData) => {
            //                 const prevMonthData = yearData.weather.filter((item: any) => {
            //                     const date = new Date(item.date)
            //                     return date.getMonth() + 1 === month
            //                 })
            //                 prevMonthData.forEach((item: any) => {
            //                     if (typeof item.temperature === 'number') {
            //                         prevTemps.push(item.temperature)
            //                     }
            //                 })
            //             })
            //             const prevAvg = prevTemps.length
            //                 ? prevTemps.reduce((a, b) => a + b, 0) / prevTemps.length
            //                 : null
            //             if (prevAvg != null) {
            //                 monthTemps.push(prevAvg)
            //             }
            //         }
            //     })
            //
            //     const avgTemp = monthTemps.length ? monthTemps.reduce((a, b) => a + b, 0) / monthTemps.length : null
            //     if (avgTemp != null) {
            //         setAverageTemperatures((prev) => {
            //             const existingIndex = prev.findIndex((item) => item.year === currentYear)
            //             if (existingIndex !== -1) {
            //                 // Если год уже существует, не добавляем его повторно
            //                 return prev
            //             }
            //             return [
            //                 ...prev,
            //                 {
            //                     year: currentYear,
            //                     avgTemp: avgTemp
            //                 }
            //             ]
            //         })
            //     }
            // }

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
