import React, { useMemo, useState } from 'react'
import { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Skeleton } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetPrecipCalendar from '@/components/widget-precip-calendar'
import WidgetStreakCard from '@/components/widget-streak-card'
import { LocaleType } from '@/tools/types'

import styles from './precipitation.module.sass'

type PrecipitationPageProps = object

interface StatCardProps {
    loading: boolean
    title: string
    value: string | number
    sub?: string
}

const StatCard: React.FC<StatCardProps> = ({ loading, title, value, sub }) => (
    <div className={styles.statCard}>
        {loading ? (
            <Skeleton style={{ width: '100%', height: 80 }} />
        ) : (
            <>
                <div className={styles.statTitle}>{title}</div>
                <div className={styles.statValue}>{value}</div>
                {sub && <div className={styles.statSub}>{sub}</div>}
            </>
        )}
    </div>
)

const MONTH_KEYS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]

const PrecipitationPage: NextPage<PrecipitationPageProps> = () => {
    const { i18n, t } = useTranslation()

    const [year, setYear] = useState<number>(new Date().getFullYear())

    const { data, isLoading } = API.useGetPrecipitationQuery({ year })

    const availableYears = data?.availableYears ?? []

    const monthlyChartOption: EChartsOption = useMemo(() => {
        const monthlyTotals = data?.stats.monthlyTotals ?? []
        const values = MONTH_KEYS.map((_, idx) => {
            const entry = monthlyTotals.find((m) => m.month === idx + 1)
            return entry ? entry.total : 0
        })
        const labels = MONTH_KEYS.map((_, idx) =>
            new Date(2000, idx, 1).toLocaleString(i18n.language, { month: 'short' })
        )
        return {
            grid: { bottom: 20, containLabel: true, left: 0, right: 0, top: 10 },
            series: [
                {
                    barMaxWidth: 32,
                    data: values,
                    itemStyle: { borderRadius: [3, 3, 0, 0], color: '#1a7fd4' },
                    type: 'bar'
                }
            ],
            tooltip: { formatter: '{b}: {c} mm', trigger: 'axis' },
            xAxis: {
                axisLabel: { fontSize: 11 },
                axisLine: { show: false },
                axisTick: { show: false },
                data: labels,
                type: 'category'
            },
            yAxis: {
                axisLabel: { fontSize: 11 },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { opacity: 0.3 } },
                type: 'value'
            }
        }
    }, [data?.stats.monthlyTotals, i18n.language])

    const rainyDaysPct = useMemo(() => {
        if (!data?.stats.rainyDays) return '0'
        const total = data.stats.dryDays + data.stats.rainyDays
        return total > 0 ? ((data.stats.rainyDays / total) * 100).toFixed(0) : '0'
    }, [data?.stats])

    return (
        <AppLayout>
            <NextSeo
                title={t('precipitation-calendar')}
                description={t('precipitation-page-description', { location: 'Orenburg' })}
                canonical={`${process.env.NEXT_PUBLIC_SITE_LINK}/precipitation`}
                openGraph={{
                    description: t('site-description'),
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: t('weather-in-orenburg'),
                    title: t('weather-in-orenburg'),
                    type: 'website',
                    url: process.env.NEXT_PUBLIC_SITE_LINK
                }}
            />

            {availableYears.length > 0 && (
                <div className={styles.yearSelector}>
                    {availableYears.map((y) => (
                        <button
                            key={y}
                            className={y === year ? styles.yearButtonActive : styles.yearButton}
                            onClick={() => setYear(y)}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            )}

            <div className={'widgets-list'}>
                <WidgetPrecipCalendar
                    loading={isLoading}
                    year={year}
                    days={data?.days}
                />

                <StatCard
                    loading={isLoading}
                    title={t('total-precipitation')}
                    value={`${(data?.stats.totalYear ?? 0).toFixed(1)} ${t('millimeters')}`}
                />

                <StatCard
                    loading={isLoading}
                    title={t('rainy-days')}
                    value={data?.stats.rainyDays ?? 0}
                    sub={`${rainyDaysPct}%`}
                />

                <WidgetStreakCard
                    loading={isLoading}
                    type={'dry'}
                    days={data?.stats.longestDryStreak.days ?? 0}
                    start={data?.stats.longestDryStreak.start ?? ''}
                    end={data?.stats.longestDryStreak.end ?? ''}
                />

                <div className={styles.chartWidget}>
                    <div className={styles.chartTitle}>{t('monthly-totals')}</div>
                    {isLoading ? (
                        <Skeleton style={{ width: '100%', height: 220 }} />
                    ) : (
                        <ReactECharts
                            option={monthlyChartOption}
                            style={{ height: '220px', width: '100%' }}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<PrecipitationPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default PrecipitationPage
