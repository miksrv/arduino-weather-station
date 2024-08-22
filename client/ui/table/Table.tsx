import React, { useState } from 'react'

import styles from './styles.module.sass'

import Icon from '@/ui/icon'
import Skeleton from '@/ui/skeleton'

export interface Column<T> {
    header: string
    accessor: keyof T
    className?: string
    isSortable?: boolean
    background?: (value: T[keyof T], row: T) => string
    formatter?: (value: T[keyof T], row: T) => React.ReactNode
}

interface SortConfig<T> {
    key: keyof T
    direction: 'asc' | 'desc'
}

export interface TableProps<T> {
    loading?: boolean
    columns?: Column<T>[]
    data?: T[]
}

const Table = <T,>({ loading, columns, data }: TableProps<T>) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null)

    const sortedData = React.useMemo(() => {
        if (!sortConfig) {
            return data
        }

        return [...(data || [])]?.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1
            }
            return 0
        })
    }, [data, sortConfig])

    const handleSort = (column: Column<T>) => {
        if (!column.isSortable) {
            return
        }

        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === column.accessor && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key: column.accessor, direction })
    }

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns?.map((column) => (
                            <th
                                key={String(column.accessor)}
                                onClick={() => handleSort(column)}
                                className={column.isSortable ? styles.sortable : undefined}
                            >
                                {column.header}
                                {sortConfig?.key === column.accessor ? (
                                    sortConfig.direction === 'asc' ? (
                                        <Icon name={'ArrowDown'} />
                                    ) : (
                                        <Icon name={'ArrowUp'} />
                                    )
                                ) : (
                                    ''
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading &&
                        Array(10)
                            .fill(0)
                            .map((_, index) => (
                                <tr key={`tr${index}`}>
                                    {columns?.map((column) => (
                                        <td
                                            key={String(column.accessor)}
                                            className={column.className}
                                        >
                                            <Skeleton style={{ width: '80%', height: 16, margin: '0 auto' }} />
                                        </td>
                                    ))}
                                </tr>
                            ))}

                    {!loading &&
                        sortedData?.map((row, index) => (
                            <tr key={`tr${index}`}>
                                {columns?.map((column) => (
                                    <td
                                        key={String(column.accessor)}
                                        className={column.className}
                                        style={
                                            column?.background
                                                ? { background: column?.background(row[column.accessor], row) }
                                                : {}
                                        }
                                    >
                                        {column.formatter
                                            ? column.formatter(row[column.accessor], row)
                                            : (row[column.accessor] as any)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    )
}

export default Table
