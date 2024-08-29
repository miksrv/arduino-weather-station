import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import Table, { TableProps } from '@/ui/table'

interface WidgetProps extends TableProps<ApiModel.Weather> {
    title?: string
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ title, ...props }) => (
    <div className={styles.widgetForecastTable}>
        {title && <div className={styles.title}>{title}</div>}
        <Table<ApiModel.Weather> {...props} />
    </div>
)

export default WidgetForecastTable
