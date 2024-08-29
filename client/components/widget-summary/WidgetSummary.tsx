import React from 'react'
import { useTranslation } from 'next-i18next'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import { getWeatherI18nKey } from '@/tools/conditions'
import { round } from '@/tools/helpers'
import Chip from '@/ui/chips-select/Chip'
import Icon from '@/ui/icon'
import Skeleton from '@/ui/skeleton'

interface WidgetSummaryProps {
    loading?: boolean
    weather?: ApiModel.Weather
}

const WidgetSummary: React.FC<WidgetSummaryProps> = ({ loading, weather }) => {
    const { t } = useTranslation()

    return (
        <div className={styles.widget}>
            <div className={styles.header}>
                <div className={styles.title}>
                    <Icon name={'Point'} />
                    <h1>{t('weather-in-orenburg')}</h1>
                </div>
                <div>
                    {loading ? (
                        <Skeleton style={{ width: 140, height: 21 }} />
                    ) : (
                        t(getWeatherI18nKey(weather?.weatherId || ''))
                    )}
                </div>
            </div>
            <div className={styles.content}>
                {loading ? (
                    <Skeleton style={{ width: 130, height: 75 }} />
                ) : (
                    <div className={styles.temperature}>
                        {round(weather?.temperature || 0, 1)}
                        <span className={styles.sign}>°C</span>
                    </div>
                )}

                {loading ? (
                    <Skeleton style={{ width: 75, height: 75 }} />
                ) : (
                    <WeatherIcon weatherId={weather?.weatherId as number} />
                )}
            </div>
            <div className={styles.chipList}>
                {loading ? (
                    <>
                        <Skeleton style={{ width: 100, height: 28 }} />
                        <Skeleton style={{ width: 100, height: 28 }} />
                        <Skeleton style={{ width: 100, height: 28 }} />
                        <Skeleton style={{ width: 100, height: 28 }} />
                    </>
                ) : (
                    <>
                        <Chip
                            text={`${weather?.windSpeed} ${t('meters-per-second')}`}
                            icon={'Wind'}
                        />

                        <Chip
                            text={`${weather?.precipitation} ${t('millimeters')}`}
                            icon={'WaterDrop'}
                        />

                        <Chip
                            text={`${weather?.humidity} %`}
                            icon={'Water'}
                        />

                        <Chip
                            text={`${weather?.pressure} ${t('mm-рg')}`}
                            icon={'Pressure'}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default WidgetSummary
