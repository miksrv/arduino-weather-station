import React, { useMemo } from 'react'

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
import { getWeatherI18nKey } from '@/tools/conditions'
import { EVENTS_QUERY, POLLING_INTERVAL_CURRENT } from '@/tools/constants'
import { getRecentDateRange } from '@/tools/date'
import { round } from '@/tools/helpers'
import { getPageSeo } from '@/tools/seo'
import { LocaleType } from '@/tools/types'
import {
    convertHpaToMmHg,
    filterRecentData,
    filterToday,
    getAbsoluteHumidity,
    getAirDensity,
    getPressureAltitude,
    sumPrecipitation
} from '@/tools/weather'
import WidgetChartsPanel from '@/widgets/widget-charts-panel'
import WidgetEventLog from '@/widgets/widget-event-log'
import WidgetPrecip from '@/widgets/widget-precip'
import WidgetSensorStat from '@/widgets/widget-sensor-stat'
import WidgetSensorUv from '@/widgets/widget-sensor-uv'
import WidgetSensorWind from '@/widgets/widget-sensor-wind'
import WidgetTile from '@/widgets/widget-tile'
import WidgetWindRose from '@/widgets/widget-wind-rose'

type IndexPageProps = object

const IndexPage: NextPage<IndexPageProps> = () => {
    const { i18n, t } = useTranslation()

    const { data: current, isLoading: currentLoading } = API.useGetCurrentQuery(undefined, {
        pollingInterval: POLLING_INTERVAL_CURRENT
    })

    const { data: history, isLoading: historyLoading } = API.useGetHistoryQuery(getRecentDateRange(1), {
        pollingInterval: POLLING_INTERVAL_CURRENT
    })

    const { data: weeklyHistory, isLoading: weeklyHistoryLoading } = API.useGetHistoryQuery(getRecentDateRange(6), {
        pollingInterval: POLLING_INTERVAL_CURRENT
    })

    // const history12HoursData = useMemo(() => filterRecentData(history, 12), [history])
    const history24HoursData = useMemo(() => filterRecentData(history, 24), [history])

    const pressureHistory24HoursMmHg = useMemo(
        () => history24HoursData?.map((item) => ({ ...item, pressure: convertHpaToMmHg(item.pressure) })),
        [history24HoursData]
    )

    const precipTodayTotal = useMemo(() => sumPrecipitation(filterToday(history)), [history])
    const precip24hTotal = useMemo(() => sumPrecipitation(history24HoursData), [history24HoursData])
    const precip7dTotal = useMemo(() => sumPrecipitation(weeklyHistory), [weeklyHistory])

    const tiles = useMemo(
        () => [
            { title: t('dew-point'), icon: 'Thermometer' as const, value: current?.dewPoint, unit: '°C' },
            { title: t('feels-like'), icon: 'Thermometer' as const, value: current?.feelsLike, unit: '°C' },
            {
                title: t('absolute-humidity'),
                icon: 'Water' as const,
                value: getAbsoluteHumidity(current?.temperature, current?.humidity),
                unit: t('g-m3')
            },
            {
                title: t('air-density'),
                icon: 'Layers' as const,
                value: getAirDensity(current?.temperature, current?.pressure, current?.humidity),
                unit: t('kg-m3')
            },
            {
                title: t('pressure-altitude'),
                icon: 'Ruler' as const,
                value: getPressureAltitude(current?.pressure),
                unit: t('meters')
            },
            {
                title: t('sol-radiation'),
                icon: 'Lightning' as const,
                value: current?.solRadiation,
                unit: t('w-m2')
            },
            {
                title: t('sol-energy'),
                icon: 'SolarPower' as const,
                value: current?.solEnergy,
                unit: t('mj-m2')
            },
            {
                title: t('visibility'),
                icon: 'Eye' as const,
                value: current?.visibility !== undefined ? round(current.visibility / 1000, 1) : undefined,
                unit: t('km')
            },
            {
                title: t('sky-condition'),
                icon: 'Cloud' as const,
                value: t(getWeatherI18nKey(current?.weatherId))
            },
            { title: t('cloudiness'), icon: 'Cloud' as const, value: current?.clouds, unit: '%' }
        ],
        [t, current]
    )

    return (
        <AppLayout>
            <Head>
                {generateNextSeo(
                    getPageSeo({
                        path: '/sensors',
                        locale: i18n.language,
                        title: t('sensors-page-title'),
                        description: t('sensors-page-description'),
                        siteName: t('weather-in-orenburg'),
                        image: 'sensors'
                    })
                )}
            </Head>

            <PageHeader
                title={t('sensors-page-title')}
                description={t('sensors-page-description')}
            />

            <div className={'widgets-list'}>
                <WidgetSensorStat
                    title={t('air-temperature')}
                    unit={'°C'}
                    icon={'Thermometer'}
                    source={'temperature'}
                    size={'x2'}
                    link={{ href: '/history' }}
                    loading={currentLoading}
                    chartLoading={historyLoading}
                    currentValue={current?.temperature}
                    history={history24HoursData}
                />

                <WidgetSensorStat
                    title={t('air-humidity')}
                    unit={'%'}
                    icon={'Water'}
                    source={'humidity'}
                    size={'x2'}
                    link={{ href: '/history' }}
                    loading={currentLoading}
                    chartLoading={historyLoading}
                    currentValue={current?.humidity}
                    history={history24HoursData}
                />

                <WidgetSensorStat
                    title={t('atmospheric-pressure')}
                    unit={t('mm-hg-full')}
                    icon={'Pressure'}
                    source={'pressure'}
                    size={'x2'}
                    link={{ href: '/history' }}
                    loading={currentLoading}
                    chartLoading={historyLoading}
                    currentValue={convertHpaToMmHg(current?.pressure)}
                    history={pressureHistory24HoursMmHg}
                />

                <WidgetPrecip
                    title={t('precipitation')}
                    icon={'WaterDrop'}
                    size={'x2'}
                    link={{ href: '/history' }}
                    loading={historyLoading}
                    chartLoading={historyLoading || weeklyHistoryLoading}
                    todayTotal={precipTodayTotal}
                    last24hTotal={precip24hTotal}
                    last7dTotal={precip7dTotal}
                    history={history24HoursData}
                />

                <WidgetSensorWind
                    title={t('wind')}
                    icon={'Wind'}
                    size={'x2'}
                    link={{ href: '/history' }}
                    loading={currentLoading}
                    chartLoading={historyLoading}
                    windSpeed={current?.windSpeed}
                    windDeg={current?.windDeg}
                    windGust={current?.windGust}
                    history={history24HoursData}
                />

                <WidgetSensorUv
                    title={t('uv-index')}
                    icon={'Sun'}
                    size={'x2'}
                    loading={currentLoading}
                    chartLoading={historyLoading}
                    value={current?.uvIndex}
                    history={history24HoursData}
                />

                {tiles.map((tile) => (
                    <WidgetTile
                        {...tile}
                        key={tile.title}
                        loading={currentLoading}
                    />
                ))}

                <div className={'widget-row'}>
                    <WidgetWindRose
                        title={t('wind-rose')}
                        icon={'Compass'}
                        size={'x2'}
                        loading={historyLoading}
                        history={history24HoursData}
                    />

                    <WidgetEventLog size={'x2'} />
                </div>

                <WidgetChartsPanel
                    history24h={history24HoursData}
                    history7d={weeklyHistory}
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
                API.endpoints.getEvents.initiate(EVENTS_QUERY)
            ])

            return { props: { ...translations } }
        }
)

export default IndexPage
