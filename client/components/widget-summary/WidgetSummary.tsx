import React from 'react'
import { Badge, Icon, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import { getWeatherI18nKey } from '@/tools/conditions'
import { round } from '@/tools/helpers'
import { convertHpaToMmHg } from '@/tools/weather'

import styles from './styles.module.sass'

interface WidgetSummaryProps {
    loading?: boolean
    weather?: ApiModel.Weather
}

const WidgetSummary: React.FC<WidgetSummaryProps> = ({ loading, weather }) => {
    const { t } = useTranslation()

    return (
        <div className={styles.widget}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <Icon name={'Point'} />
                    <h1>
                        {t('weather-in-orenburg')}
                        <span>{'(GMT+5)'}</span>
                    </h1>
                </div>

                <div className={styles.conditions}>
                    {loading ? (
                        <Skeleton style={{ width: 140, height: 21 }} />
                    ) : (
                        // Without a condition (stale station data) the line stays empty rather than "unknown"
                        <div className={styles.condition}>
                            {weather?.weatherId ? t(getWeatherI18nKey(weather.weatherId)) : '\u00a0'}
                        </div>
                    )}

                    <div className={styles.value}>
                        {loading ? (
                            <Skeleton
                                style={{ width: 75, height: 65, marginTop: 10, marginBottom: 10, marginRight: 15 }}
                            />
                        ) : (
                            weather?.weatherId && (
                                <WeatherIcon
                                    weatherId={weather.weatherId}
                                    date={weather?.date}
                                    height={80}
                                    width={80}
                                />
                            )
                        )}

                        {loading ? (
                            <Skeleton style={{ width: 130, height: 65, marginTop: 10, marginBottom: 10 }} />
                        ) : (
                            <div className={styles.temperature}>
                                {weather?.temperature != null ? round(weather.temperature, 1) : t('no-data')}
                                <span className={styles.sign}>°C</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.chipList}>
                {loading ? (
                    <>
                        <Skeleton style={{ width: 90, height: 28, marginRight: 10 }} />
                        <Skeleton style={{ width: 90, height: 28, marginRight: 10 }} />
                        <Skeleton style={{ width: 90, height: 28, marginRight: 10 }} />
                        <Skeleton style={{ width: 90, height: 28 }} />
                    </>
                ) : (
                    <>
                        <Badge
                            icon={'Wind'}
                            label={`${weather?.windSpeed ?? t('no-data')} ${t('meters-per-second')}`}
                        />

                        <Badge
                            icon={'WaterDrop'}
                            label={`${weather?.precipitation ?? t('no-data')} ${t('millimeters')}`}
                        />

                        <Badge
                            icon={'Water'}
                            label={`${weather?.humidity ?? t('no-data')} %`}
                        />

                        <Badge
                            icon={'Pressure'}
                            label={`${convertHpaToMmHg(weather?.pressure) ?? t('no-data')} ${t('mm-hg')}`}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default WidgetSummary
