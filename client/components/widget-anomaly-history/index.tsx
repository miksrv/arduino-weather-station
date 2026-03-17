import React, { useMemo } from 'react'
import { cn, ColumnProps, Table } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { ApiType } from '@/api'
import { formatDate } from '@/tools/date'

import { anomalyTypeToI18nKey, getDuration, isActiveToday } from './utils'

import styles from './styles.module.sass'

interface WidgetAnomalyHistoryProps {
    rows: ApiType.Anomaly.AnomalyHistoryEntry[]
}

const WidgetAnomalyHistory: React.FC<WidgetAnomalyHistoryProps> = ({ rows }) => {
    const { t } = useTranslation()

    const columns: Array<ColumnProps<ApiType.Anomaly.AnomalyHistoryEntry>> = useMemo(
        () => [
            {
                accessor: 'type',
                header: t('anomaly-type'),
                formatter: (type, data, i) => (
                    <span className={styles.typeCell}>
                        {isActiveToday(data[i].endDate) && <span className={styles.activeIndicator} />}
                        {t(`anomaly-${anomalyTypeToI18nKey(type as string)}`)}
                    </span>
                )
            },
            {
                accessor: 'startDate',
                header: t('start-date'),
                isSortable: true,
                formatter: (date) => formatDate(date as string, 'D MMM YYYY')
            },
            {
                accessor: 'endDate',
                header: t('end-date'),
                formatter: (date) => (date != null ? formatDate(date as string, 'D MMM YYYY') : '—')
            },
            {
                accessor: 'startDate',
                header: t('duration'),
                formatter: (startDate, data, i) => {
                    const duration = getDuration(startDate as string, data[i].endDate)
                    return duration !== '' ? duration : t('in-progress')
                }
            },
            {
                accessor: 'peakValue',
                header: t('peak-value'),
                isSortable: true,
                formatter: (peakValue) => (peakValue != null ? (peakValue as number).toFixed(2) : '—')
            }
        ],
        [t]
    )

    return (
        <div className={cn(styles.widgetAnomalyHistory)}>
            <Table<ApiType.Anomaly.AnomalyHistoryEntry>
                data={rows}
                columns={columns}
                className={styles.table}
                stickyHeader={true}
                size={'small'}
                height={250}
            />
        </div>
    )
}

export default WidgetAnomalyHistory
