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
        { header: 'Time', accessor: 'date', isSortable: true },
        { header: 'Temp', accessor: 'temperature', isSortable: true },
        { header: 'Conditions', accessor: 'weatherMain' },
        { header: 'Wind', accessor: 'windSpeed', isSortable: true },
        { header: 'Humidity', accessor: 'humidity', isSortable: true },
        { header: 'Pressure', accessor: 'pressure', isSortable: true },
        { header: 'UV', accessor: 'uvIndex', isSortable: true }
    ]

    return (
        <div className={styles.widgetForecastTable}>
            <div className={styles.content}>
                <Table<ApiModel.Weather>
                    columns={columns}
                    data={data}
                />
            </div>
        </div>
    )
}

export default WidgetForecastTable
