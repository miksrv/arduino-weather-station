import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { GetServerSidePropsResult, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { NextSeo } from 'next-seo'
import { Dropdown, Popout, PopoutHandleProps, Spinner } from 'simple-react-ui-kit'

import { API, ApiType } from '@/api'
import { setLocale } from '@/api/applicationSlice'
import { wrapper } from '@/api/store'
import { Maybe } from '@/api/types'
import AppLayout from '@/components/app-layout'
import WidgetHeatmap from '@/components/widget-heatmap'
import { currentDate, formatDate, halfYearDate } from '@/tools/date'
import Datepicker, { findPresetByDate, PresetOption } from '@/ui/datepicker'

type HeatmapPageProps = object

const MIN_DATE = '2021-01-01'

const HeatmapPage: NextPage<HeatmapPageProps> = () => {
    const { i18n, t } = useTranslation()

    const popoutRef = useRef<PopoutHandleProps>(null)

    const [startDate, setStartDate] = useState<string>()
    const [endDate, setEndDate] = useState<string>()
    const [sensor, setSensor] = useState<ApiType.Heatmap.SensorType>('temperature')

    const historyDateParam: Maybe<ApiType.Heatmap.Request> = useMemo(
        () => ({
            start_date: startDate ?? '',
            end_date: endDate ?? '',
            type: sensor
        }),
        [startDate, endDate, sensor]
    )

    const {
        data: history,
        isLoading: historyLoading,
        isFetching: historyFetching
    } = API.useGetHeatmapQuery(historyDateParam, {
        skip: !startDate?.length || !endDate?.length
    })

    const currentDatePreset = useMemo((): string => {
        const preset = findPresetByDate(startDate, endDate, i18n.language)

        return preset ? preset : startDate && endDate ? `${startDate} - ${endDate}` : ''
    }, [startDate, endDate, i18n.language])

    useEffect(() => {
        setStartDate(formatDate(halfYearDate, 'YYYY-MM-DD'))
        setEndDate(formatDate(currentDate.toDate(), 'YYYY-MM-DD'))
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
                <Popout
                    ref={popoutRef}
                    action={currentDatePreset}
                    mode={'secondary'}
                    position={'left'}
                >
                    <Datepicker
                        locale={i18n.language}
                        startDate={startDate}
                        endDate={endDate}
                        minDate={MIN_DATE}
                        maxDate={formatDate(currentDate.toDate(), 'YYYY-MM-DD')}
                        hidePresets={[PresetOption.TODAY, PresetOption.DAY]}
                        onPeriodSelect={(startDate, endDate) => {
                            setStartDate(startDate)
                            setEndDate(endDate)

                            if (popoutRef.current) {
                                popoutRef.current.close()
                            }
                        }}
                    />
                </Popout>

                <Dropdown<ApiType.Heatmap.SensorType>
                    required={true}
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
            const locale = context.locale ?? 'en'
            const translations = await serverSideTranslations(locale)

            store.dispatch(setLocale(locale))

            return {
                props: {
                    ...translations
                }
            }
        }
)

export default HeatmapPage
