import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import Chart from '@/components/widget-chart/Chart'
import { concatClassNames as cn } from '@/tools/helpers'
import Skeleton from '@/ui/skeleton'

export type ChartTypes = 'temperature' | 'clouds'

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
        <div className={styles.value}>
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
    </div>
)

export default WidgetChart
