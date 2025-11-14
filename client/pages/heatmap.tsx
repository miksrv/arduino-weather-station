import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { DatePicker, findPresetByDate, Select, Spinner } from 'simple-react-ui-kit'

import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'

import { API, ApiType, setLocale } from '@/api'
import { wrapper } from '@/api/store'
import { Maybe } from '@/api/types'
import AppLayout from '@/components/app-layout'
import WidgetHeatmap from '@/components/widget-heatmap'
import { currentDate, formatDate, halfYearDate } from '@/tools/date'
import { LocaleType } from '@/tools/types'

type HeatmapPageProps = object

const HeatmapPage: NextPage<HeatmapPageProps> = () => {
    const { i18n, t } = useTranslation()

    const [period, setPeriod] = useState<[string?, string?]>()
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
        if (!period?.[0] || !period?.[1]) {
            return ''
        }

        const preset = findPresetByDate(dayjs.utc(), period[0], period[1], i18n.language as LocaleType)

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
                <DatePicker
                    disabled={historyLoading || historyFetching}
                    datePeriod={period}
                    locale={i18n.language === 'en' ? 'en' : 'ru'}
                    buttonMode={'secondary'}
                    minDate={'2021-01-01'}
                    maxDate={formatDate(currentDate.toDate(), 'YYYY-MM-DD')}
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
