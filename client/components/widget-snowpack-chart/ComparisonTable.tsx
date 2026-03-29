import React, { useMemo } from 'react'
import { cn, ColumnProps, Table } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { ApiType } from '@/api'

import { FLOOD_YEAR } from './constants'
import { isFloodYear } from './utils'

import styles from './styles.module.sass'

interface ComparisonTableProps {
    rows: ApiType.Anomaly.SeasonComparison[]
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ rows }) => {
    const { t } = useTranslation()

    const columns: Array<ColumnProps<ApiType.Anomaly.SeasonComparison>> = useMemo(
        () => [
            {
                accessor: 'year',
                header: t('winter-comparison'),
                formatter: (year, data, i) => (
                    <span className={cn(isFloodYear(data[i].year, FLOOD_YEAR) && styles.floodYearCell)}>
                        {year as string}
                    </span>
                )
            },
            {
                accessor: 'maxSWE',
                header: t('swe-chart-title'),
                formatter: (maxSWE, data, i) => (
                    <span className={cn(isFloodYear(data[i].year, FLOOD_YEAR) && styles.floodYearCell)}>
                        {maxSWE as number}
                    </span>
                )
            },
            {
                accessor: 'floodOccurred',
                header: t('flood-occurred'),
                formatter: (floodOccurred, data, i) => {
                    const label =
                        floodOccurred === true
                            ? t('flood-occurred')
                            : floodOccurred === false
                              ? t('no-flood')
                              : t('season-in-progress')
                    return (
                        <span className={cn(isFloodYear(data[i].year, FLOOD_YEAR) && styles.floodYearCell)}>
                            {label}
                        </span>
                    )
                }
            }
        ],
        [t]
    )

    return (
        <Table<ApiType.Anomaly.SeasonComparison>
            data={rows}
            columns={columns}
            className={styles.table}
            size={'small'}
        />
    )
}
