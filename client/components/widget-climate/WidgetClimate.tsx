import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import Chart from './Chart'
import { ClimateType } from './type'

import styles from './styles.module.sass'

interface WidgetProps {
    data?: ClimateType[]
    loading?: boolean
}

const CHART_HEIGHT = '450px'

const WidgetClimate: React.FC<WidgetProps> = ({ data, loading }) => (
    <div className={styles.widget}>
        {loading ? (
            <Skeleton style={{ width: '100%', height: CHART_HEIGHT }} />
        ) : (
            <Chart
                data={data}
                height={CHART_HEIGHT}
            />
        )}
    </div>
)

export default WidgetClimate
