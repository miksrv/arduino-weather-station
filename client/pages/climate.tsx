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

const CLIMATE_CACHE_KEY = 'climate_data_cache'
const START_YEAR = 2022

const readSessionCache = (): ClimateType[] | null => {
    if (typeof window === 'undefined') {
        return null
    }

    try {
        const raw = sessionStorage.getItem(CLIMATE_CACHE_KEY)
        if (!raw) {
            return null
        }

        const parsed: unknown = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
            return null
        }

        return parsed as ClimateType[]
    } catch {
        return null
    }
}

const writeSessionCache = (data: ClimateType[]): void => {
    if (typeof window === 'undefined') {
        return
    }

    try {
        sessionStorage.setItem(CLIMATE_CACHE_KEY, JSON.stringify(data))
    } catch {
        // sessionStorage may be unavailable (private mode quota exceeded etc.)
    }
}

const ClimatePage: NextPage = () => {
    const { i18n, t } = useTranslation()

    const [yearPeriods, setYearPeriods] = useState<string[][]>([])
    const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0)
    const [allData, setAllData] = useState<ClimateType[]>([])
    const [isCacheRestored, setIsCacheRestored] = useState(false)

    useEffect(() => {
        const currentYear = new Date().getFullYear()
        const periods: string[][] = []
        for (let year = START_YEAR; year <= currentYear; year++) {
            periods.push([`${year}-01-01`, `${year}-12-31`])
        }

        const cached = readSessionCache()
        if (cached && cached.length > 0) {
            const cachedYears = new Set(cached.map((d) => d.year))
            const allYearsCovered = periods.every((p) => cachedYears.has(p[0].split('-')[0]))

            if (allYearsCovered) {
                setAllData(cached)
                setIsCacheRestored(true)
                setYearPeriods(periods)
                setCurrentPeriodIndex(periods.length)
                return
            }
        }

        setYearPeriods(periods)
    }, [])

    const isFetchingComplete = isCacheRestored || (yearPeriods.length > 0 && currentPeriodIndex >= yearPeriods.length)

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
                const next = prev.some((d) => d.year === year) ? prev : [...prev, { year, weather: yearHistories }]

                if (currentPeriodIndex === yearPeriods.length - 1) {
                    writeSessionCache(next)
                }

                return next
            })

            if (currentPeriodIndex < yearPeriods.length - 1) {
                const timerId = setTimeout(() => {
                    setCurrentPeriodIndex((prev) => prev + 1)
                }, 500)

                return () => clearTimeout(timerId)
            }
        }
    }, [yearHistories])

    const isStillLoading = !isFetchingComplete && (isLoading || currentPeriodIndex < yearPeriods.length)

    const loadedYears = isCacheRestored ? yearPeriods.length : allData.length
    const totalYears = yearPeriods.length

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
