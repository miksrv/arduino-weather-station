import React from 'react'
import { cn, Skeleton } from 'simple-react-ui-kit'

import { ApiModel } from '@/api'
import Chart from '@/components/widget-chart/Chart'

import styles from './styles.module.sass'

export type ChartTypes = 'temperature' | 'clouds' | 'pressure'

interface WidgetProps {
    loading?: boolean
    fullWidth?: boolean
    type: ChartTypes
    data?: ApiModel.Weather[]
    dateFormat?: string
}

const CHART_HEIGHT = '260px'

const WidgetChart: React.FC<WidgetProps> = ({ loading, fullWidth, type, data, dateFormat }) => (
    <div className={cn(styles.widget, fullWidth && styles.fullWidth)}>
        {loading ? (
            <Skeleton style={{ width: '100%', height: CHART_HEIGHT }} />
        ) : (
            <Chart
                data={data}
                type={type}
                height={CHART_HEIGHT}
                dateFormat={dateFormat}
            />
        )}
    </div>
)

export default WidgetChart
