import React from 'react'
import { cn, Skeleton } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import Chart from '@/components/widget-chart/Chart'

export type ChartTypes = 'temperature' | 'clouds' | 'pressure'

interface WidgetProps {
    loading?: boolean
    fullWidth?: boolean
    data?: ApiModel.Weather[]
    type: ChartTypes
    dateFormat?: string
}

const CHART_HEIGHT = '260px'

const WidgetChart: React.FC<WidgetProps> = ({ loading, fullWidth, data, type, dateFormat }) => (
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
