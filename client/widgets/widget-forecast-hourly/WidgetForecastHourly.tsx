import React, { useState } from 'react'
import { cn, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import WidgetCard from '@/components/widget-card'

import HourlyChart, { CHART_HEIGHT, HourlyMode } from './HourlyChart'
import HourStrip from './HourStrip'

import styles from './styles.module.sass'

export interface WidgetForecastHourlyProps {
    hours?: ApiModel.Forecast[]
    loading?: boolean
}

const MODES: HourlyMode[] = ['temperature', 'precipitation', 'wind']

/** The next 48 hours: one quantity at a time on a chart, and every hour in a row under it */
const WidgetForecastHourly: React.FC<WidgetForecastHourlyProps> = ({ hours, loading }) => {
    const { t } = useTranslation()
    const [mode, setMode] = useState<HourlyMode>('temperature')

    return (
        <WidgetCard size={'x4'}>
            <div className={styles.header}>
                <h2>{t('forecast-hourly-title')}</h2>
                <div
                    className={styles.toggle}
                    role={'group'}
                    aria-label={t('forecast-chart-label', { mode: t(`forecast-mode-${mode}`) })}
                >
                    {MODES.map((item) => (
                        <button
                            key={item}
                            type={'button'}
                            aria-pressed={item === mode}
                            className={cn(styles.toggleButton, item === mode && styles.toggleButtonActive)}
                            onClick={() => setMode(item)}
                        >
                            {t(`forecast-mode-${item}`)}
                        </button>
                    ))}
                </div>
            </div>

            {loading || !hours?.length ? (
                <Skeleton style={{ width: '100%', height: CHART_HEIGHT + 150 }} />
            ) : (
                <>
                    <HourlyChart
                        hours={hours}
                        mode={mode}
                    />
                    <HourStrip hours={hours} />
                </>
            )}
        </WidgetCard>
    )
}

export default WidgetForecastHourly
