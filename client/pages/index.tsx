import React, { useMemo } from 'react'

import type { GetServerSidePropsResult, NextPage } from 'next'
import Head from 'next/head'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { generateNextSeo } from 'next-seo/pages'

import { API, ApiModel, setLocale } from '@/api'
import { urlAPI } from '@/api/api'
import { prefetchQueries } from '@/api/ssr'
import { wrapper } from '@/api/store'
import AppLayout from '@/components/app-layout'
import JsonLd from '@/components/json-ld'
import WidgetAnomalyCard from '@/components/widget-anomaly-card'
import WidgetChart from '@/components/widget-chart'
import WidgetForecastCards from '@/components/widget-forecast-cards'
import WidgetSensor, { WidgetSensorProps } from '@/components/widget-sensor'
import WeatherChart from '@/components/widget-sensor/WeatherChart'
import WidgetSummary from '@/components/widget-summary'
import { POLLING_INTERVAL_CURRENT, POLLING_INTERVAL_FORECAST } from '@/tools/constants'
import { getRecentDateRange } from '@/tools/date'
import { getPageSeo } from '@/tools/seo'
import { getDatasetSchema, getWebSiteSchema } from '@/tools/structured-data'
import { LocaleType } from '@/tools/types'
import { filterRecentData, getMinMaxValues } from '@/tools/weather'

type IndexPageProps = object

type WidgetType = Pick<WidgetSensorProps, 'title' | 'unit' | 'icon'> & {
    source: keyof ApiModel.Sensors
}

const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n, t } = useTranslation()

    // const { data: forecastHourly, isLoading: hourlyLoading } = API.useGetForecastQuery('hourly', {
    //     pollingInterval: POLLING_INTERVAL_FORECAST
    // })

    const { data: forecastDaily, isLoading: dailyLoading } = API.useGetForecastQuery('daily', {
        pollingInterval: POLLING_INTERVAL_FORECAST
    })

    const { data: anomalyData, isLoading: anomalyLoading } = API.useGetAnomalyQuery(undefined, {
        pollingInterval: POLLING_INTERVAL_FORECAST
    })

    const activeAnomalies = anomalyData?.anomalies.filter((a) => a.active) ?? []

    const { data: current, isLoading: currentLoading } = API.useGetCurrentQuery(undefined, {
        pollingInterval: POLLING_INTERVAL_CURRENT
    })

    const { data: history, isLoading: historyLoading } = API.useGetHistoryQuery(getRecentDateRange(1), {
        pollingInterval: POLLING_INTERVAL_CURRENT
    })

    const history12HoursData = useMemo(() => filterRecentData(history, 12), [history])
    const history24HoursData = useMemo(() => filterRecentData(history, 24), [history])

    const widgets: WidgetType[] = useMemo(
        () => [
            {
                title: t('humidity'),
                unit: '%',
                icon: 'Water',
                source: 'humidity'
            },
            {
                title: t('temperature'),
                unit: '°C',
                icon: 'Thermometer',
                source: 'temperature'
            }
        ],
        [t]
    )

    const structuredDataParams = {
        locale: i18n.language,
        siteName: t('weather-in-orenburg'),
        description: t('main-page-description'),
        apiUrl: urlAPI
    }

    return (
        <AppLayout>
            <Head>
                {generateNextSeo(
                    getPageSeo({
                        path: '/',
                        locale: i18n.language,
                        title: t('main-page-title'),
                        description: t('main-page-description'),
                        siteName: t('weather-in-orenburg'),
                        image: 'main'
                    })
                )}
            </Head>

            <JsonLd data={[getWebSiteSchema(structuredDataParams), getDatasetSchema(structuredDataParams)]} />

            <div className={'widgets-list'}>
                <WidgetSummary
                    loading={currentLoading}
                    weather={current}
                />

                {widgets?.map((widget) => (
                    <WidgetSensor
                        {...widget}
                        key={`widget-${widget.source}`}
                        link={{ href: '/sensors', title: t('weather-sensors') + ' - ' + widget.title }}
                        loading={currentLoading}
                        chartLoading={historyLoading}
                        minMax={getMinMaxValues(history12HoursData, widget.source)}
                        currentValue={current?.[widget.source]}
                        chart={
                            <WeatherChart
                                source={widget.source}
                                data={history12HoursData}
                            />
                        }
                    />
                ))}

                {anomalyLoading ? (
                    <WidgetAnomalyCard
                        loading={true}
                        fullWidth={true}
                        anomalyId={''}
                        active={false}
                    />
                ) : (
                    activeAnomalies.map((anomaly) => (
                        <WidgetAnomalyCard
                            key={anomaly.id}
                            fullWidth={true}
                            anomalyId={anomaly.id}
                            active={anomaly.active}
                            triggeredAt={anomaly.triggeredAt}
                            lastTriggered={anomaly.lastTriggered}
                            currentZScore={anomaly.currentZScore}
                            extraMetric={anomaly.extraMetric}
                        />
                    ))
                )}

                <WidgetForecastCards
                    loading={dailyLoading}
                    forecast={forecastDaily}
                />

                <WidgetChart
                    type={'temperature'}
                    loading={historyLoading}
                    data={history24HoursData}
                />

                <WidgetChart
                    type={'clouds'}
                    loading={historyLoading}
                    data={history24HoursData}
                />
            </div>
        </AppLayout>
    )
}

export const getServerSideProps = wrapper.getServerSideProps(
    (store) =>
        async (context): Promise<GetServerSidePropsResult<IndexPageProps>> => {
            const locale: LocaleType = (context.locale as LocaleType) ?? 'en'
            const translations = await serverSideTranslations(locale, ['common'])

            store.dispatch(setLocale(locale))

            await prefetchQueries(store, [
                API.endpoints.getCurrent.initiate(),
                API.endpoints.getForecast.initiate('daily')
            ])

            return { props: { ...translations } }
        }
)

export default IndexPage
