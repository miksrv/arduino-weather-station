import React, { useEffect, useMemo, useState } from 'react'
import { Dropdown, Spinner } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiType, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import { Maybe } from '@/api/types'
import AppLayout from '@/components/app-layout'
import PeriodSelector from '@/components/period-selector'
import WidgetHeatmap from '@/components/widget-heatmap'
import { currentDate, formatDate, halfYearDate } from '@/tools/date'
import { LocaleType } from '@/tools/types'
import { findPresetByDate } from '@/ui/datepicker'

type HeatmapPageProps = object

const HeatmapPage: NextPage<HeatmapPageProps> = () => {
    const { i18n, t } = useTranslation()

    const [period, setPeriod] = useState<string[]>()
    const [sensor, setSensor] = useState<ApiType.Heatmap.SensorType>('temperature')

    const historyDateParam: Maybe<ApiType.Heatmap.Request> = useMemo(
        () => ({
            start_date: period?.[0] ?? '',
            end_date: period?.[1] ?? '',
            type: sensor
        }),
        [period, sensor]
    )

    const {
        data: history,
        isLoading: historyLoading,
        isFetching: historyFetching
    } = API.useGetHeatmapQuery(historyDateParam, { skip: !period?.[0] || !period?.[1] })

    const currentDatePreset = useMemo((): string => {
        const preset = findPresetByDate(period?.[0], period?.[1], i18n.language as LocaleType)

        return preset ? preset : period?.[0] && period?.[1] ? `${period?.[0]} - ${period?.[1]}` : ''
    }, [period, i18n.language])

    useEffect(() => {
        setPeriod([formatDate(halfYearDate, 'YYYY-MM-DD'), formatDate(currentDate.toDate(), 'YYYY-MM-DD')])
    }, [])

    return (
        <AppLayout>
            <NextSeo
                title={t('heatmap')}
                description={t('heatmap-page-description')}
                canonical={`${process.env.NEXT_PUBLIC_SITE_LINK}/history`}
                openGraph={{
                    description: t('site-description'),
                    images: [
                        {
                            height: 1130,
                            url: '/images/heatmap.jpg',
                            width: 2026
                        }
                    ],
                    locale: i18n.language === 'ru' ? 'ru_RU' : 'en_US',
                    siteName: t('weather-in-orenburg'),
                    title: t('weather-in-orenburg'),
                    type: 'website',
                    url: process.env.NEXT_PUBLIC_SITE_LINK
                }}
            />

            <div className={'toolbar'}>
                <PeriodSelector
                    disabled={historyLoading || historyFetching}
                    periodDates={period}
                    onSetPeriod={setPeriod}
                />

                <Dropdown<ApiType.Heatmap.SensorType>
                    required={true}
                    mode={'secondary'}
                    disabled={historyFetching || historyLoading}
                    value={sensor}
                    options={[
                        { key: 'temperature', value: t('temperature'), icon: 'Thermometer' },
                        { key: 'pressure', value: t('pressure'), icon: 'Pressure' },
                        { key: 'humidity', value: t('humidity'), icon: 'Water' },
                        { key: 'precipitation', value: t('precipitation'), icon: 'WaterDrop' },
                        { key: 'clouds', value: t('clouds'), icon: 'Cloud' }
                    ]}
                    onSelect={(value) => setSensor(value?.key ?? 'temperature')}
                />

                {historyFetching && !historyLoading && (
                    <div className={'loading'}>
                        <Spinner /> <span>{t('please-wait-loading')}</span>
                    </div>
                )}
            </div>

            <div className={'widgets-list'}>
                <WidgetHeatmap
                    data={history}
                    type={sensor}
                    loading={historyLoading || historyFetching}
                    title={`${t('heatmap')}: ${t(sensor)}`}
                    subTitle={t('heat-map-data-shown-period', { period: currentDatePreset.toLowerCase() })}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<HeatmapPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return { props: { ...translations } }
        }
)

export default HeatmapPage
