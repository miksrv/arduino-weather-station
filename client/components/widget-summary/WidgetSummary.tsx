import React from 'react'
import { useTranslation } from 'next-i18next'
import { Icon, Skeleton } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import { getWeatherI18nKey } from '@/tools/conditions'
import { round } from '@/tools/helpers'
import { convertHpaToMmHg } from '@/tools/weather'
import Badge from '@/ui/badge'

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
                <div className={styles.conditions}>
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
                    <WeatherIcon
                        weatherId={weather?.weatherId as number}
                        date={weather?.date}
                    />
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
                        <Badge
                            icon={'Wind'}
                            label={`${weather?.windSpeed} ${t('meters-per-second')}`}
                        />

                        <Badge
                            icon={'WaterDrop'}
                            label={`${weather?.precipitation} ${t('millimeters')}`}
                        />

                        <Badge
                            icon={'Water'}
                            label={`${weather?.humidity} %`}
                        />

                        <Badge
                            icon={'Pressure'}
                            label={`${convertHpaToMmHg(weather?.pressure)} ${t('mm-hg')}`}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default WidgetSummary
