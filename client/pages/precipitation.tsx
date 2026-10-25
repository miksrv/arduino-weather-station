import React, { useMemo, useState } from 'react'
import { cn } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import Head from 'next/head'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { generateNextSeo } from 'next-seo/pages'

import { API, setLocale } from '@/api'
import { prefetchQueries } from '@/api/ssr'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import WidgetPrecipCalendar from '@/components/widget-precip-calendar'
import WidgetPrecipChart from '@/components/widget-precip-chart'
import WidgetPrecipStatCard from '@/components/widget-precip-stat-card'
import WidgetStreakCard from '@/components/widget-streak-card'
import { getCurrentDate } from '@/tools/date'
import { getPageSeo } from '@/tools/seo'
import { LocaleType } from '@/tools/types'

import styles from './precipitation.module.sass'

type PrecipitationPageProps = object

const PrecipitationPage: NextPage<PrecipitationPageProps> = () => {
    const { i18n, t } = useTranslation()

    const [year, setYear] = useState<number>(getCurrentDate().year())

    const { data, isFetching } = API.useGetPrecipitationQuery({ year })

    const availableYears = data?.availableYears ?? []

    const rainyDaysPct = useMemo(() => {
        if (!data?.stats.rainyDays) {
            return '0'
        }

        const total = data.stats.dryDays + data.stats.rainyDays
        return total > 0 ? ((data.stats.rainyDays / total) * 100).toFixed(0) : '0'
    }, [data?.stats])

    return (
        <AppLayout>
            <Head>
                {generateNextSeo(
                    getPageSeo({
                        path: '/precipitation',
                        locale: i18n.language,
                        title: t('precipitation-page-title'),
                        description: t('precipitation-page-description'),
                        siteName: t('weather-in-orenburg'),
                        image: 'precipitation'
                    })
                )}
            </Head>

            <PageHeader
                title={t('precipitation-page-title')}
                description={t('precipitation-page-description')}
            />

            {availableYears.length > 0 && (
                <div
                    className={styles.yearSelector}
                    role={'group'}
                >
                    {availableYears.map((y) => (
                        <button
                            key={y}
                            type={'button'}
                            aria-pressed={y === year}
                            className={cn(styles.year, y === year && styles.yearActive)}
                            onClick={() => setYear(y)}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            )}

            <div className={'widgets-list'}>
                <WidgetPrecipCalendar
                    loading={isFetching}
                    year={year}
                    days={data?.days}
                />

                <WidgetPrecipStatCard
                    loading={isFetching}
                    title={t('total-precipitation')}
                    value={`${(data?.stats.totalYear ?? 0).toFixed(1)} ${t('millimeters')}`}
                />

                <WidgetPrecipStatCard
                    loading={isFetching}
                    title={t('rainy-days')}
                    value={data?.stats.rainyDays ?? 0}
                    sub={`${rainyDaysPct}%`}
                />

                <WidgetStreakCard
                    loading={isFetching}
                    type={'dry'}
                    days={data?.stats.longestDryStreak.days ?? 0}
                    start={data?.stats.longestDryStreak.start ?? ''}
                    end={data?.stats.longestDryStreak.end ?? ''}
                />

                <WidgetStreakCard
                    loading={isFetching}
                    type={'wet'}
                    days={data?.stats.longestWetStreak.days ?? 0}
                    start={data?.stats.longestWetStreak.start ?? ''}
                    end={data?.stats.longestWetStreak.end ?? ''}
                />

                <WidgetPrecipChart
                    loading={isFetching}
                    monthlyTotals={data?.stats.monthlyTotals}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<PrecipitationPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale, ['common'])

            store.dispatch(setLocale(locale))

            await prefetchQueries(store, [API.endpoints.getPrecipitation.initiate({ year: getCurrentDate().year() })])

            return { props: { ...translations } }
        }
)

export default PrecipitationPage
