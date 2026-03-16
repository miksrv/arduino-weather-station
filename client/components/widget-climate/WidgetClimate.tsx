import React from 'react'
import { Skeleton, Spinner } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import Chart from './Chart'
import { ClimateType } from './type'

import styles from './styles.module.sass'

interface WidgetProps {
    data?: ClimateType[]
    loading?: boolean
    loadedYears?: number
    totalYears?: number
}

const CHART_HEIGHT = '450px'

const WidgetClimate: React.FC<WidgetProps> = ({ data, loading, loadedYears, totalYears }) => {
    const { t } = useTranslation()

    const showProgress =
        loading &&
        typeof loadedYears === 'number' &&
        typeof totalYears === 'number' &&
        totalYears > 0 &&
        totalYears !== loadedYears

    const hasData = !!data?.length

    return (
        <div className={styles.widget}>
            {showProgress && (
                <div className={styles.progressBar}>
                    <Spinner />
                    <span>{t('loading-years', { current: loadedYears, total: totalYears })}</span>
                </div>
            )}
            {!hasData && loading ? (
                <Skeleton style={{ width: '100%', height: CHART_HEIGHT }} />
            ) : (
                <Chart
                    data={data}
                    height={CHART_HEIGHT}
                />
            )}
        </div>
    )
}

export default WidgetClimate
