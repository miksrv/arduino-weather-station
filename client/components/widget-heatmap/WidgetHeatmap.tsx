import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import Heatmap from './Heatmap'
import styles from './styles.module.sass'

import { ApiModel, ApiType } from '@/api'

interface WidgetProps {
    type: ApiType.Heatmap.SensorType
    data?: ApiModel.Weather[]
    title?: string
    subTitle?: string
    loading?: boolean
}

const CHART_HEIGHT = '450px'

const WidgetHeatmap: React.FC<WidgetProps> = ({ type, data, loading, title, subTitle }) => (
    <div className={styles.widget}>
        {loading ? (
            <Skeleton style={{ width: '100%', height: CHART_HEIGHT }} />
        ) : (
            <Heatmap
                data={data}
                type={type}
                title={title}
                subTitle={subTitle}
                height={CHART_HEIGHT}
            />
        )}
    </div>
)

export default WidgetHeatmap
