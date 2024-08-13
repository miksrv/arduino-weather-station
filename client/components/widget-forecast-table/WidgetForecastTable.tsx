import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import Table, { Column } from '@/ui/table'

interface WidgetProps {
    data?: ApiModel.Weather[]
    loading?: boolean
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ data, loading }) => {
    const columns: Column<ApiModel.Weather>[] = [
        { header: 'Date', accessor: 'date', isSortable: true },
        { header: 'ID', accessor: 'weatherId' },
        { header: 'Conditions', accessor: 'weatherMain' },
        { header: 'Temp', accessor: 'temperature', isSortable: true },
        { header: 'Clouds', accessor: 'clouds', isSortable: true }
    ]

    return (
        <div className={styles.widgetForecastTable}>
            <Table<ApiModel.Weather>
                columns={columns}
                data={data}
            />
        </div>
    )
}

export default WidgetForecastTable
