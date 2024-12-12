import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import Meteogram, { MeteogramProps } from './Meteogram'
import styles from './styles.module.sass'

interface WidgetProps extends MeteogramProps {
    loading?: boolean
}

const CHART_HEIGHT = '320px'

const WidgetMeteogram: React.FC<WidgetProps> = ({ loading, data }) => (
    <div className={styles.widget}>
        {loading ? (
            <Skeleton style={{ width: '100%', height: CHART_HEIGHT }} />
        ) : (
            <Meteogram
                data={data}
                height={CHART_HEIGHT}
            />
        )}
    </div>
)

export default WidgetMeteogram
