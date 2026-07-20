import React, { useMemo, useState } from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { API, ApiModel } from '@/api'
import WidgetCard from '@/components/widget-card'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'
import { getSensorColor } from '@/tools/colors'
import { currentDate, formatDate } from '@/tools/date'
import { convertHpaToMmHg, filterRecentData } from '@/tools/weather'

import MiniChart from './MiniChart'
import PeriodToggle, { ChartsPeriod } from './PeriodToggle'

import styles from './styles.module.sass'

const PERIOD_HOURS: Record<ChartsPeriod, number> = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
}

const PERIOD_START_DAYS_AGO: Record<ChartsPeriod, number> = {
    '24h': 1,
    '7d': 6,
    '30d': 29
}

const PERIOD_DATE_FORMAT: Record<ChartsPeriod, string> = {
    '24h': 'HH:mm',
    '7d': 'DD.MM',
    '30d': 'DD.MM'
}

export interface WidgetChartsPanelProps {
    /** 24 hour history already fetched by the page, reused instead of issuing a duplicate request. */
    history24h?: ApiModel.Weather[]
    /** 7 day history already fetched by the page, reused instead of issuing a duplicate request. */
    history7d?: ApiModel.Weather[]
}

const WidgetChartsPanel: React.FC<WidgetChartsPanelProps> = ({ history24h, history7d }) => {
    const { t } = useTranslation()
    const [period, setPeriod] = useState<ChartsPeriod>('24h')

    const periodOptions = useMemo(
        () => [
            { value: '24h' as const, label: t('period-24h') },
            { value: '7d' as const, label: t('period-7d') },
            { value: '30d' as const, label: t('period-30d') }
        ],
        [t]
    )

    // The page already fetches the 24h/7d history windows, so only the 30d view (which the page
    // does not fetch) needs its own request here — gated with `skip` so it never fires otherwise.
    const { data: monthlyHistory, isLoading: monthlyHistoryLoading } = API.useGetHistoryQuery(
        {
            start_date: formatDate(currentDate.subtract(PERIOD_START_DAYS_AGO['30d'], 'days').toDate(), 'YYYY-MM-DD'),
            end_date: formatDate(currentDate.toDate(), 'YYYY-MM-DD')
        },
        { pollingInterval: POLING_INTERVAL_CURRENT, skip: period !== '30d' }
    )

    const isLoading = period === '30d' ? monthlyHistoryLoading : period === '24h' ? !history24h : !history7d

    const periodData = useMemo(() => {
        if (period === '24h') {
            return filterRecentData(history24h, PERIOD_HOURS['24h'])
        }
        if (period === '7d') {
            return filterRecentData(history7d, PERIOD_HOURS['7d'])
        }
        return filterRecentData(monthlyHistory, PERIOD_HOURS['30d'])
    }, [period, history24h, history7d, monthlyHistory])

    const dateFormat = PERIOD_DATE_FORMAT[period]

    const pressureData = useMemo(
        () => periodData?.map((item) => ({ ...item, pressure: convertHpaToMmHg(item.pressure) })),
        [periodData]
    )

    return (
        <WidgetCard size={'x4'}>
            <div className={styles.header}>
                <h3>{t(`charts-panel-title-${period}`)}</h3>
                <PeriodToggle
                    value={period}
                    onChange={setPeriod}
                    options={periodOptions}
                />
            </div>

            <div className={styles.chartsRow}>
                {isLoading ? (
                    <Skeleton style={{ width: '100%', height: 180 }} />
                ) : (
                    <>
                        <div className={styles.chartColumn}>
                            <MiniChart
                                title={`${t('temperature')} (°C)`}
                                data={periodData}
                                source={'temperature'}
                                color={getSensorColor('temperature')[0]}
                                dateFormat={dateFormat}
                            />
                        </div>
                        <div className={styles.chartColumn}>
                            <MiniChart
                                title={`${t('humidity')} (%)`}
                                data={periodData}
                                source={'humidity'}
                                color={getSensorColor('humidity')[0]}
                                dateFormat={dateFormat}
                            />
                        </div>
                        <div className={styles.chartColumn}>
                            <MiniChart
                                title={`${t('pressure')} (${t('mm-hg-full')})`}
                                data={pressureData}
                                source={'pressure'}
                                color={getSensorColor('pressure')[0]}
                                dateFormat={dateFormat}
                            />
                        </div>
                        <div className={styles.chartColumn}>
                            <MiniChart
                                title={`${t('wind')} (${t('meters-per-second')})`}
                                data={periodData}
                                source={'windSpeed'}
                                color={getSensorColor('windSpeed')[0]}
                                dateFormat={dateFormat}
                                zeroBased
                            />
                        </div>
                    </>
                )}
            </div>
        </WidgetCard>
    )
}

export default WidgetChartsPanel
