import React, { useMemo, useState } from 'react'
import { Button } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetPrecipCalendar from '@/components/widget-precip-calendar'
import WidgetPrecipChart from '@/components/widget-precip-chart'
import WidgetPrecipStatCard from '@/components/widget-precip-stat-card'
import WidgetStreakCard from '@/components/widget-streak-card'
import { LocaleType } from '@/tools/types'

import styles from './precipitation.module.sass'

type PrecipitationPageProps = object

const PrecipitationPage: NextPage<PrecipitationPageProps> = () => {
    const { i18n, t } = useTranslation()

    const [year, setYear] = useState<number>(new Date().getFullYear())

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
            <NextSeo
                title={t('precipitation-calendar')}
                description={t('precipitation-page-description', { location: 'Orenburg' })}
                canonical={`${process.env.NEXT_PUBLIC_SITE_LINK}/precipitation`}
                openGraph={{
                    description: t('precipitation-page-description', { location: 'Orenburg' }),
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: t('weather-in-orenburg'),
                    title: t('precipitation-calendar'),
                    type: 'website',
                    url: `${process.env.NEXT_PUBLIC_SITE_LINK}/precipitation`
                }}
                twitter={{
                    cardType: 'summary_large_image'
                }}
            />

            {availableYears.length > 0 && (
                <div className={styles.yearSelector}>
                    {availableYears.map((y) => (
                        <Button
                            key={y}
                            mode={y === year ? 'primary' : 'secondary'}
                            onClick={() => setYear(y)}
                        >
                            {y}
                        </Button>
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

            return { props: { ...translations } }
        }
)

export default PrecipitationPage
