import React from 'react'
import { cn, Icon, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import WindDirectionIcon from '@/components/wind-direction-icon'
import { formatDate, getDate } from '@/tools/date'
import { round } from '@/tools/helpers'
import { Carousel } from '@/ui/carousel'

import styles from './styles.module.sass'

interface WidgetForecastCardsProps {
    loading?: boolean
    isHourly?: boolean
    forecast?: ApiModel.Weather[]
}

const WidgetForecastCards: React.FC<WidgetForecastCardsProps> = ({ loading, isHourly, forecast }) => {
    const { t } = useTranslation()

    const now = getDate(new Date().toISOString())
    const todayStr = now.format('YYYY-MM-DD')
    const currentHour = now.hour()

    return (
        <div className={styles.widget}>
            {loading && (
                <div className={styles.widget}>
                    <div className={styles.section}>
                        <div className={styles.skeletonRow}>
                            {Array.from({ length: 6 }, (_, i) => i).map((key) => (
                                <div
                                    key={key}
                                    className={styles.card}
                                >
                                    <Skeleton style={{ width: '100%', height: '170px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!!forecast?.length && (
                <div className={styles.section}>
                    <Carousel
                        options={{ dragFree: true, loop: false }}
                        autoScroll={false}
                    >
                        {forecast.map((item, index) => (
                            <div
                                key={item.date ?? index}
                                className={cn(
                                    styles.card,
                                    !!item.date &&
                                        getDate(item.date).format('YYYY-MM-DD') === todayStr &&
                                        styles.highlighted,
                                    !!item.date &&
                                        getDate(item.date).format('YYYY-MM-DD') === todayStr &&
                                        getDate(item.date).hour() === currentHour &&
                                        styles.highlighted
                                )}
                            >
                                {!isHourly && (
                                    <>
                                        <span className={styles.cardDay}>{formatDate(item.date, 'dddd')}</span>
                                        <span className={styles.cardDate}>{formatDate(item.date, 'MMMM D')}</span>
                                    </>
                                )}

                                {isHourly && (
                                    <span className={styles.cardTime}>
                                        {formatDate(item.date, t('date-only-hour'))}
                                    </span>
                                )}

                                <div className={styles.cardIcon}>
                                    <WeatherIcon
                                        weatherId={item.weatherId ?? 800}
                                        date={item.date}
                                        width={42}
                                        height={42}
                                    />
                                </div>

                                <div className={styles.cardTempRange}>
                                    <span className={styles.cardTempHigh}>{round(item.temperature ?? 0, 0)}°</span>
                                </div>

                                <div className={styles.cardMeta}>
                                    {item.clouds !== undefined && (
                                        <span className={styles.cardMetaRow}>
                                            <Icon name={'Cloud'} />
                                            {item.clouds}%
                                        </span>
                                    )}
                                    {item.windSpeed !== undefined && (
                                        <span className={styles.cardMetaRow}>
                                            <WindDirectionIcon direction={item.windDeg ?? 0} />
                                            {round(item.windSpeed, 1)} {t('meters-per-second')}
                                        </span>
                                    )}
                                    {item.precipitation !== undefined && item.precipitation > 0 && (
                                        <span className={styles.cardMetaRow}>
                                            {item.precipitation} {t('millimeters')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Carousel>
                </div>
            )}
        </div>
    )
}

export default WidgetForecastCards
