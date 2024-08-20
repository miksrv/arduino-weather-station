import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import Table, { Column } from '@/ui/table'

interface WidgetProps {
    data?: ApiModel.Weather[]
    loading?: boolean
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ data, loading }) => {
    const columns: Column<ApiModel.Weather>[] = [
        { header: 'Date', accessor: 'date', className: styles.cellDate, isSortable: true },
        { header: 'Weather', accessor: 'weatherId', className: styles.cellIcon, formatter: (weatherId) => <WeatherIcon weatherId={weatherId as number} /> },
        { header: 'Temp', accessor: 'temperature', className: styles.cellTemperature, isSortable: true },
        { header: 'Clouds', accessor: 'clouds', className: styles.cellClouds, isSortable: true }
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
