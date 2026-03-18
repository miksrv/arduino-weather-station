import React from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiType, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import WidgetAnomalyCalendar from '@/components/widget-anomaly-calendar'
import WidgetAnomalyCard from '@/components/widget-anomaly-card'
import WidgetAnomalyHistory from '@/components/widget-anomaly-history'
import WidgetFloodRisk from '@/components/widget-flood-risk'
import WidgetParameterZScore from '@/components/widget-parameter-z-score'
import WidgetSnowpackChart from '@/components/widget-snowpack-chart'
import { LocaleType } from '@/tools/types'

import styles from './anomaly.module.sass'

const POLLING_INTERVAL_ANOMALY = 300_000

const PARAMETER_KEYS: Array<keyof ApiType.Anomaly.ParameterZScores> = [
    'temperature',
    'pressure',
    'precipitation',
    'windSpeed',
    'humidity',
    'uvIndex'
]

const AnomalyPage: NextPage<object> = () => {
    const { i18n, t } = useTranslation()

    const { data, isLoading } = API.useGetAnomalyQuery(undefined, {
        pollingInterval: POLLING_INTERVAL_ANOMALY
    })

    return (
        <AppLayout>
            <NextSeo
                title={t('meteorological-anomaly')}
                description={t('anomaly-page-description', { location: 'Orenburg' })}
                canonical={`${process.env.NEXT_PUBLIC_SITE_LINK}/anomaly`}
                openGraph={{
                    description: t('site-description'),
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: t('weather-in-orenburg'),
                    title: t('meteorological-anomaly'),
                    type: 'website',
                    url: process.env.NEXT_PUBLIC_SITE_LINK
                }}
            />

            <div className={'widgets-list'}>
                <div className={styles.floodRiskRow}>
                    <WidgetFloodRisk
                        loading={isLoading}
                        score={data?.floodRisk.score}
                        level={data?.floodRisk.level}
                        components={data?.floodRisk.components}
                        season={data?.floodRisk.season}
                    />

                    <div className={styles.zScoreGrid}>
                        {PARAMETER_KEYS.map((key) => (
                            <WidgetParameterZScore
                                key={key}
                                loading={isLoading}
                                parameter={key}
                                zScore={data?.parameterZScores[key]}
                                sparklineData={[]}
                            />
                        ))}
                    </div>
                </div>

                <WidgetSnowpackChart
                    loading={isLoading}
                    currentSeries={data?.snowpack.series ?? []}
                    comparisonYears={data?.snowpack.comparisonYears ?? []}
                    estimatedSWE={data?.snowpack.estimatedSWE ?? 0}
                    historicalAvgSWE={data?.snowpack.historicalAvgSWE ?? 0}
                />

                <div className={styles.sectionHeader}>
                    <h2>{t('active-anomalies')}</h2>
                </div>

                <div className={styles.inactiveGrid}>
                    {isLoading
                        ? PARAMETER_KEYS.map((key) => (
                              <WidgetAnomalyCard
                                  key={key}
                                  loading={true}
                                  anomalyId={key}
                                  active={false}
                              />
                          ))
                        : data?.anomalies.map((anomaly) => (
                              <WidgetAnomalyCard
                                  key={anomaly.id}
                                  anomalyId={anomaly.id}
                                  active={anomaly.active}
                                  triggeredAt={anomaly.triggeredAt}
                                  lastTriggered={anomaly.lastTriggered}
                                  currentZScore={anomaly.currentZScore}
                                  extraMetric={anomaly.extraMetric}
                              />
                          ))}
                </div>

                <div className={styles.sectionHeader}>
                    <h2>{t('anomaly-history')}</h2>
                </div>

                <div className={styles.fullWidth}>
                    <WidgetAnomalyCalendar
                        loading={isLoading}
                        data={data?.anomalyCalendar ?? []}
                    />
                </div>

                <div className={styles.fullWidth}>
                    <WidgetAnomalyHistory
                        loading={isLoading}
                        rows={data?.anomalyHistory ?? []}
                    />
                </div>
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

export default AnomalyPage
