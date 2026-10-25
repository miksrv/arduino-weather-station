import React, { useEffect, useMemo, useState } from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import Head from 'next/head'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { generateNextSeo } from 'next-seo/pages'

import { API, setLocale } from '@/api'
import { prefetchQueries } from '@/api/ssr'
import { useAppDispatch, wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import WidgetAnomalyBars from '@/components/widget-anomaly-bars'
import WidgetClimate, { ClimateType } from '@/components/widget-climate'
import WidgetMonthlyNormals from '@/components/widget-monthly-normals'
import WidgetWarmingStripes from '@/components/widget-warming-stripes'
import { getCurrentDate } from '@/tools/date'
import { getPageSeo } from '@/tools/seo'
import { LocaleType } from '@/tools/types'

const START_YEAR = 2022

const ClimatePage: NextPage = () => {
    const { i18n, t } = useTranslation()

    const dispatch = useAppDispatch()

    const [allData, setAllData] = useState<ClimateType[]>([])
    const [loadedYears, setLoadedYears] = useState(0)
    const [isStillLoading, setIsStillLoading] = useState(true)

    const yearPeriods = useMemo(() => {
        const now = getCurrentDate()
        const periods: Array<[string, string]> = []

        for (let year = START_YEAR; year <= now.year(); year++) {
            periods.push([`${year}-01-01`, year === now.year() ? now.format('YYYY-MM-DD') : `${year}-12-31`])
        }

        return periods
    }, [])

    const totalYears = yearPeriods.length

    // All years are requested at once; a failed year is left out instead of stalling the chart
    useEffect(() => {
        const requests = yearPeriods.map(([startDate, endDate]) =>
            dispatch(API.endpoints.getHistory.initiate({ start_date: startDate, end_date: endDate }))
        )

        void Promise.allSettled(
            requests.map((request) =>
                request.unwrap().finally(() => {
                    setLoadedYears((count) => count + 1)
                })
            )
        ).then((results) => {
            setAllData(
                results.flatMap((result, index) =>
                    result.status === 'fulfilled'
                        ? [{ year: yearPeriods[index][0].slice(0, 4), weather: result.value }]
                        : []
                )
            )
            setIsStillLoading(false)
        })

        return () => requests.forEach((request) => request.unsubscribe())
    }, [dispatch, yearPeriods])

    const { data: climateData, isLoading: climateLoading } = API.useGetClimateQuery()

    const currentYearMonthly = useMemo(() => {
        if (!allData.length) {
            return undefined
        }

        const currentYear = String(getCurrentDate().year())
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
            <Head>
                {generateNextSeo(
                    getPageSeo({
                        path: '/climate',
                        locale: i18n.language,
                        title: t('climate-page-title'),
                        description: t('climate-page-description'),
                        siteName: t('weather-in-orenburg'),
                        image: 'climate'
                    })
                )}
            </Head>

            <PageHeader
                title={t('climate-page-title')}
                description={t('climate-page-description')}
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

            await prefetchQueries(store, [API.endpoints.getClimate.initiate()])

            return { props: { ...translations } }
        }
)

export default ClimatePage
