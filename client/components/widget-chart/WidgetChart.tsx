import React from 'react'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import Chart from '@/components/widget-chart/Chart'
import Skeleton from '@/ui/skeleton'

interface WidgetProps {
    loading?: boolean
    data?: ApiModel.Weather[]
    type: 'temperature' | 'light'
}

const WidgetChart: React.FC<WidgetProps> = ({ loading, data, type }) => (
    <div className={styles.widget}>
        <div className={styles.value}>
            {loading ? (
                <Skeleton style={{ width: 100, height: 35, marginTop: 10, marginBottom: 5 }} />
            ) : (
                <Chart
                    data={data}
                    type={type}
                />
            )}
        </div>
    </div>
)

export default WidgetChart
