import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import { Forecast } from '@/api/models'
import { formatDate } from '@/tools/helpers'
import { MinMaxResult } from '@/tools/weather'
import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'
import Skeleton from '@/ui/skeleton'
import Table, { Column } from '@/ui/table'

interface WidgetProps {
    data?: ApiModel.Forecast[]
    loading?: boolean
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ data, loading }) => {
    const columns: Column<ApiModel.Forecast>[] = [
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
                <Table<ApiModel.Forecast>
                    columns={columns}
                    data={data}
                />
            </div>
        </div>
    )
}

export default WidgetForecastTable
