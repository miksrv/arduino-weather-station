import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { ApiType } from '@/api'
import WidgetCard from '@/components/widget-card'
import { HeatmapPoint } from '@/tools/heatmap'

import Heatmap from './Heatmap'

import styles from './styles.module.sass'

interface WidgetHeatmapProps {
    type: ApiType.Heatmap.SensorType
    points?: HeatmapPoint[]
    title?: string
    subtitle?: string
    loading?: boolean
}

const CHART_HEIGHT = 480

const WidgetHeatmap: React.FC<WidgetHeatmapProps> = ({ type, points, loading, title, subtitle }) => (
    <WidgetCard
        title={title}
        size={'x4'}
    >
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {loading || !points?.length ? (
            <Skeleton style={{ width: '100%', height: CHART_HEIGHT }} />
        ) : (
            <Heatmap
                type={type}
                points={points}
                height={CHART_HEIGHT}
            />
        )}
    </WidgetCard>
)

export default WidgetHeatmap
