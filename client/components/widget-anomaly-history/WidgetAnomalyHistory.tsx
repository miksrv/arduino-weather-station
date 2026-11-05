import React, { useMemo } from 'react'
import { Skeleton, Table, TableColumnProps } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiType } from '@/api'
import { getCurrentDate } from '@/tools/date'

import {
    anomalyTypeToI18nKey,
    formatAnomalyPeriod,
    getAnomalyDays,
    getAnomalyMetric,
    getRecentAnomalies,
    isActiveToday
} from './utils'

import styles from './styles.module.sass'

interface WidgetAnomalyHistoryProps {
    loading?: boolean
    rows: ApiType.Anomaly.AnomalyHistoryEntry[]
}

type Entry = ApiType.Anomaly.AnomalyHistoryEntry

/** The anomalies of the last month: what, when, for how long and how strong, the ongoing ones marked */
const WidgetAnomalyHistory: React.FC<WidgetAnomalyHistoryProps> = ({ loading, rows }) => {
    const { t } = useTranslation()

    const today = getCurrentDate().format('YYYY-MM-DD')
    const since = getCurrentDate().subtract(1, 'month').format('YYYY-MM-DD')

    const recent = useMemo(() => getRecentAnomalies(rows, since), [rows, since])

    const columns: Array<TableColumnProps<Entry>> = useMemo(
        () => [
            {
                accessor: 'type',
                header: t('anomaly-type'),
                formatter: (type, data, i) => (
                    <span className={styles.typeCell}>
                        {isActiveToday(data[i].endDate, today) && (
                            <span
                                className={styles.activeIndicator}
                                title={t('anomaly-ongoing')}
                            />
                        )}
                        {t(`anomaly-${anomalyTypeToI18nKey(type as string)}`)}
                    </span>
                )
            },
            {
                accessor: 'startDate',
                header: t('anomaly-period'),
                formatter: (startDate, data, i) => {
                    const endDate = data[i].endDate

                    return endDate == null
                        ? t('anomaly-period-ongoing', {
                              date: formatAnomalyPeriod(startDate as string, startDate as string)
                          })
                        : formatAnomalyPeriod(startDate as string, endDate)
                }
            },
            {
                accessor: 'endDate',
                header: t('duration'),
                formatter: (_endDate, data, i) =>
                    t('days-count', { count: getAnomalyDays(data[i].startDate, data[i].endDate, today) })
            },
            {
                accessor: 'peakValue',
                header: t('anomaly-metric'),
                headerTooltip: t('anomaly-metric-hint'),
                formatter: (peakValue, data, i) => {
                    const metric = getAnomalyMetric(data[i].type, peakValue as number | null)

                    return metric ? t(metric.key, { value: metric.value }) : '—'
                }
            }
        ],
        [t, today]
    )

    if (loading) {
        return (
            <div className={styles.widgetAnomalyHistory}>
                <Skeleton style={{ width: '100%', height: 200 }} />
            </div>
        )
    }

    // The table fills the card edge to edge: no title, no padding (the section heading above names it)
    return (
        <div className={styles.widgetAnomalyHistory}>
            <Table<Entry>
                data={recent}
                columns={columns}
                className={styles.table}
                noDataCaption={t('anomaly-history-empty')}
                stickyHeader={true}
                size={'small'}
                maxHeight={360}
            />
        </div>
    )
}

export default WidgetAnomalyHistory
