import React from 'react'
import { useTranslation } from 'next-i18next'
import { Badge, Icon, Skeleton } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import { getWeatherI18nKey } from '@/tools/conditions'
import { round } from '@/tools/helpers'
import { convertHpaToMmHg } from '@/tools/weather'

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
                        <div>{t(getWeatherI18nKey(weather?.weatherId || ''))}</div>
                    )}

                    <div className={styles.value}>
                        {loading ? (
                            <Skeleton
                                style={{ width: 75, height: 65, marginTop: 10, marginBottom: 10, marginRight: 15 }}
                            />
                        ) : (
                            <WeatherIcon
                                weatherId={weather?.weatherId as number}
                                date={weather?.date}
                                height={80}
                                width={80}
                            />
                        )}

                        {loading ? (
                            <Skeleton style={{ width: 130, height: 65, marginTop: 10, marginBottom: 10 }} />
                        ) : (
                            <div className={styles.temperature}>
                                {round(weather?.temperature || 0, 1)}
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
