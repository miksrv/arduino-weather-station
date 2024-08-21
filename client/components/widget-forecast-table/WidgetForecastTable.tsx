import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import Table, { Column } from '@/ui/table'

interface WidgetProps {
    data?: ApiModel.Weather[]
    columns?: Column<ApiModel.Weather>[]
    loading?: boolean
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ data, columns, loading }) =>(
    <div className={styles.widgetForecastTable}>
        <Table<ApiModel.Weather>
            columns={columns}
            data={data}
        />
    </div>
)

export default WidgetForecastTable
