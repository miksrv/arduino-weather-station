import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import { formatDate } from '@/tools/helpers'
import { MinMaxResult } from '@/tools/weather'
import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'
import Skeleton from '@/ui/skeleton'
import Table from '@/ui/table'

interface WidgetProps {
    data?: ApiModel.Forecast[]
    loading?: boolean
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ data, loading }) => {
    const columns = [
        // { header: 'Time', accessor: 'date', isSortable: true },
        { header: 'Temp', accessor: 'temperature', isSortable: true }
        // { header: 'Sky', accessor: 'sky', isSortable: true },
        // { header: 'Conditions', accessor: 'conditions' },
        // { header: 'Chance', accessor: 'chance', isSortable: true },
        // { header: 'Amount', accessor: 'amount', isSortable: true },
        // { header: 'Humidity', accessor: 'humidity', isSortable: true },
        // { header: 'Pressure', accessor: 'pressure', isSortable: true },
        // { header: 'Gust', accessor: 'gust', isSortable: true },
        // { header: 'Direction', accessor: 'direction' },
        // { header: 'UV', accessor: 'uv', isSortable: true }
    ]

    return (
        <div className={styles.widgetForecastTable}>
            <Table<ApiModel.Forecast>
                columns={columns}
                data={data}
            />
        </div>
    )
}

export default WidgetForecastTable
