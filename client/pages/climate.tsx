import React, { useEffect, useMemo, useState } from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetAnomalyBars from '@/components/widget-anomaly-bars'
import WidgetClimate, { ClimateType } from '@/components/widget-climate'
import WidgetMonthlyNormals from '@/components/widget-monthly-normals'
import WidgetWarmingStripes from '@/components/widget-warming-stripes'
import { LocaleType } from '@/tools/types'

const START_YEAR = 2022

const ClimatePage: NextPage = () => {
    const { i18n, t } = useTranslation()

    const [yearPeriods, setYearPeriods] = useState<string[][]>([])
    const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0)
    const [allData, setAllData] = useState<ClimateType[]>([])

    useEffect(() => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const today = now.toISOString().split('T')[0]
        const periods: string[][] = []

        for (let year = START_YEAR; year <= currentYear; year++) {
            const endDate = year === currentYear ? today : `${year}-12-31`
            periods.push([`${year}-01-01`, endDate])
        }

        setYearPeriods(periods)
    }, [])

    const isFetchingComplete = yearPeriods.length > 0 && currentPeriodIndex >= yearPeriods.length

    const { data: yearHistories, isLoading } = API.useGetHistoryQuery(
        yearPeriods[currentPeriodIndex]
            ? { start_date: yearPeriods[currentPeriodIndex][0], end_date: yearPeriods[currentPeriodIndex][1] }
            : undefined,
        { skip: !yearPeriods[currentPeriodIndex] || isFetchingComplete, refetchOnMountOrArgChange: true }
    )

    useEffect(() => {
        if (yearHistories && yearPeriods[currentPeriodIndex]) {
            const year = yearPeriods[currentPeriodIndex][0].split('-')[0]

            setAllData((prev) => {
                return prev.some((d) => d.year === year) ? prev : [...prev, { year, weather: yearHistories }]
            })

            if (currentPeriodIndex < yearPeriods.length - 1) {
                const timerId = setTimeout(() => {
                    setCurrentPeriodIndex((prev) => prev + 1)
                }, 500)

                return () => clearTimeout(timerId)
            }
        }
    }, [yearHistories])

    const { data: climateData, isLoading: climateLoading } = API.useGetClimateQuery()

    const isStillLoading = !isFetchingComplete && (isLoading || currentPeriodIndex < yearPeriods.length)

    const loadedYears = allData.length
    const totalYears = yearPeriods.length

    const currentYearMonthly = useMemo(() => {
        if (!allData.length) {
            return undefined
        }

        const currentYear = String(new Date().getFullYear())
        const yearEntry = allData.find((d) => d.year === currentYear)
        if (!yearEntry?.weather?.length) {
            return undefined
        }

        const byMonth: Record<number, { sum: number; count: number }> = {}
        for (const row of yearEntry.weather) {
            if (!row.date || row.temperature == null) {
                continue
            }

            const month = new Date(row.date).getMonth() + 1
            if (!byMonth[month]) {
                byMonth[month] = { count: 0, sum: 0 }
            }

            byMonth[month].sum += Number(row.temperature)
            byMonth[month].count += 1
        }

        return Object.entries(byMonth).map(([m, { sum, count }]) => ({
            avgTemp: Math.round((sum / count) * 100) / 100,
            month: Number(m)
        }))
    }, [allData])

    return (
        <AppLayout>
            <NextSeo
                title={t('climate-page-title')}
                description={t('climate-page-description')}
                canonical={`${process.env.NEXT_PUBLIC_SITE_LINK}/climate`}
                openGraph={{
                    description: t('climate-page-description'),
                    images: [
                        {
                            height: 1292,
                            url: `${process.env.NEXT_PUBLIC_SITE_LINK}/images/history.jpg`,
                            width: 2028
                        }
                    ],
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: t('weather-in-orenburg'),
                    title: t('climate-page-title'),
                    type: 'website',
                    url: `${process.env.NEXT_PUBLIC_SITE_LINK}/climate`
                }}
                twitter={{
                    cardType: 'summary_large_image'
                }}
            />

            <div className={'widgets-list'}>
                <WidgetClimate
                    data={allData}
                    loading={isStillLoading}
                    loadedYears={loadedYears}
                    totalYears={totalYears}
                />

                <WidgetWarmingStripes
                    data={climateData?.years}
                    loading={climateLoading}
                />

                <WidgetAnomalyBars
                    data={climateData?.years}
                    baselineAvgTemp={climateData?.baselineAvgTemp}
                    loading={climateLoading}
                />

                <WidgetMonthlyNormals
                    normals={climateData?.monthlyNormals}
                    currentYearMonthly={currentYearMonthly}
                    loading={climateLoading}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<object>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale, ['common'])

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default ClimatePage
