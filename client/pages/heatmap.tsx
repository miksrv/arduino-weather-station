import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { DatePicker, findPresetByDate, Select, Spinner } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import Head from 'next/head'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { generateNextSeo } from 'next-seo/pages'

import { API, ApiType, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import { Maybe } from '@/api/types'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import WidgetHeatmap from '@/components/widget-heatmap'
import { formatDate, getCurrentDate, getHalfYearDate } from '@/tools/date'
import { getDiurnalProfile, getHeatmapStats, getHistogram, toHeatmapPoints } from '@/tools/heatmap'
import { getPageSeo } from '@/tools/seo'
import { LocaleType } from '@/tools/types'
import WidgetDiurnalProfile from '@/widgets/widget-diurnal-profile'
import WidgetHeatmapSummary from '@/widgets/widget-heatmap-summary'
import WidgetValueDistribution from '@/widgets/widget-value-distribution'

type HeatmapPageProps = object

const HeatmapPage: NextPage<HeatmapPageProps> = () => {
    const { i18n, t } = useTranslation()

    const [period, setPeriod] = useState<[string?, string?]>()
    const [sensor, setSensor] = useState<ApiType.Heatmap.SensorType>('temperature')

    const historyDateParam: Maybe<ApiType.Heatmap.Request> = useMemo(
        () => (period?.[0] && period?.[1] ? { end_date: period[1], start_date: period[0], type: sensor } : undefined),
        [period, sensor]
    )

    // `currentData`, not `data`: while another quantity loads, the previous one must not be read as the new one
    const {
        currentData: history,
        isLoading: historyLoading,
        isFetching: historyFetching
    } = API.useGetHeatmapQuery(historyDateParam, { skip: !historyDateParam })

    const points = useMemo(() => toHeatmapPoints(history, sensor), [history, sensor])
    const stats = useMemo(() => getHeatmapStats(points), [points])
    const profile = useMemo(() => getDiurnalProfile(points, sensor), [points, sensor])
    const bins = useMemo(() => getHistogram(points, sensor), [points, sensor])
    const isLoadingData = !history

    const currentDatePreset = useMemo((): string => {
        if (!period?.[0] || !period?.[1]) {
            return ''
        }

        const preset = findPresetByDate(dayjs.utc(), period[0], period[1], i18n.language as LocaleType)

        return preset ? preset : period?.[0] && period?.[1] ? `${period?.[0]} - ${period?.[1]}` : ''
    }, [period, i18n.language])

    useEffect(() => {
        setPeriod([formatDate(getHalfYearDate(), 'YYYY-MM-DD'), formatDate(getCurrentDate().toDate(), 'YYYY-MM-DD')])
    }, [])

    return (
        <AppLayout>
            <Head>
                {generateNextSeo(
                    getPageSeo({
                        path: '/heatmap',
                        locale: i18n.language,
                        title: t('heatmap-page-title'),
                        description: t('heatmap-page-description'),
                        siteName: t('weather-in-orenburg'),
                        image: 'heatmap'
                    })
                )}
            </Head>

            <PageHeader
                title={t('heatmap-page-title')}
                description={t('heatmap-page-description')}
            />

            <div className={'toolbar'}>
                <DatePicker
                    disabled={historyLoading || historyFetching}
                    datePeriod={period}
                    locale={i18n.language === 'en' ? 'en' : 'ru'}
                    buttonMode={'secondary'}
                    minDate={'2021-01-01'}
                    maxDate={formatDate(getCurrentDate().toDate(), 'YYYY-MM-DD')}
                    placeholder={t('select-date-range')}
                    onPeriodSelect={(startDate, endDate) => setPeriod([startDate, endDate])}
                />

                <Select<ApiType.Heatmap.SensorType>
                    style={{ width: 170 }}
                    disabled={historyFetching || historyLoading}
                    value={sensor}
                    options={[
                        { key: 'temperature', value: t('temperature'), icon: 'Thermometer' },
                        { key: 'pressure', value: t('pressure'), icon: 'Pressure' },
                        { key: 'humidity', value: t('humidity'), icon: 'Water' },
                        { key: 'precipitation', value: t('precipitation'), icon: 'WaterDrop' },
                        { key: 'clouds', value: t('clouds'), icon: 'Cloud' }
                    ]}
                    onSelect={(value) => setSensor(value?.[0]?.key ?? 'temperature')}
                />

                {historyFetching && !historyLoading && (
                    <div className={'loading'}>
                        <Spinner /> <span>{t('please-wait-loading')}</span>
                    </div>
                )}
            </div>

            <div className={'widgets-list'}>
                <WidgetHeatmapSummary
                    type={sensor}
                    stats={stats}
                    loading={isLoadingData}
                />

                <WidgetHeatmap
                    points={points}
                    type={sensor}
                    loading={isLoadingData}
                    title={`${t('heatmap')}: ${t(sensor)}`}
                    subtitle={t('heat-map-data-shown-period', { period: currentDatePreset.toLowerCase() })}
                />

                <WidgetDiurnalProfile
                    type={sensor}
                    profile={profile}
                    loading={isLoadingData}
                />

                <WidgetValueDistribution
                    type={sensor}
                    bins={bins}
                    loading={isLoadingData}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<HeatmapPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale, ['common'])

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default HeatmapPage
