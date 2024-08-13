import React, { useState } from 'react'

import styles from './styles.module.sass'

export interface Column<T> {
    header: string
    accessor: keyof T
    isSortable?: boolean
}

interface SortConfig<T> {
    key: keyof T
    direction: 'asc' | 'desc'
}

interface TableProps<T> {
    columns?: Column<T>[]
    data?: T[]
}

const Table = <T,>({ columns, data }: TableProps<T>) => {
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
                                {sortConfig?.key === column.accessor
                                    ? sortConfig.direction === 'asc'
                                        ? ' 🔼'
                                        : ' 🔽'
                                    : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData?.map((row, index) => (
                        <tr key={`tr${index}`}>
                            {columns?.map((column) => (
                                <td key={String(column.accessor)}>{row[column.accessor] as any}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default Table
