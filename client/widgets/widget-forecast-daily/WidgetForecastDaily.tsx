import React, { useMemo } from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import WidgetCard from '@/components/widget-card'
import { getWeatherI18nKey } from '@/tools/conditions'
import { formatDate, getCurrentDate, getDate } from '@/tools/date'
import { formatSigned, getRangePosition, getTemperatureBounds, getTemperatureHue } from '@/tools/forecast'
import { round } from '@/tools/helpers'
import { formatWindDirection } from '@/tools/weather'

import styles from './styles.module.sass'

export interface WidgetForecastDailyProps {
    days?: ApiModel.Forecast[]
    loading?: boolean
}

/**
 * The week as rows that read left to right: day → sky → precipitation → low, the day's range on the
 * week's scale, high → wind. Every row uses the same scale, so warm and cold days show at a glance.
 */
const WidgetForecastDaily: React.FC<WidgetForecastDailyProps> = ({ days, loading }) => {
    const { t } = useTranslation()

    const bounds = useMemo(() => getTemperatureBounds(days), [days])
    const today = getCurrentDate().format('YYYY-MM-DD')
    const tomorrow = getCurrentDate().add(1, 'day').format('YYYY-MM-DD')

    const dayName = (date?: string): string => {
        const day = date ? getDate(date).format('YYYY-MM-DD') : ''

        if (day === today) {
            return t('today')
        }

        return day === tomorrow ? t('forecast-tomorrow') : formatDate(date, 'dddd')
    }

    return (
        <WidgetCard size={'x4'}>
            <h2 className={styles.title}>{t('forecast-daily-title')}</h2>

            {loading ? (
                <Skeleton style={{ width: '100%', height: 420 }} />
            ) : !days?.length || !bounds ? (
                <p className={styles.empty}>{t('forecast-unavailable')}</p>
            ) : (
                <ul className={styles.list}>
                    {days.map((day) => {
                        const min = day.temperatureMin ?? day.temperature ?? 0
                        const max = day.temperatureMax ?? day.temperature ?? 0
                        const range = getRangePosition(min, max, bounds)
                        const isToday = !!day.date && getDate(day.date).format('YYYY-MM-DD') === today
                        const precipitation = day.precipitation ?? 0
                        const condition = t(getWeatherI18nKey(day.weatherId))

                        return (
                            <li
                                key={day.date}
                                className={styles.row}
                                aria-current={isToday ? 'date' : undefined}
                            >
                                <div className={styles.day}>
                                    <span className={styles.dayName}>{dayName(day.date)}</span>
                                    <span className={styles.dayDate}>{formatDate(day.date, t('date-day-month'))}</span>
                                </div>

                                <div className={styles.sky}>
                                    <WeatherIcon
                                        weatherId={day.weatherId}
                                        width={36}
                                        height={36}
                                        alt={condition}
                                    />
                                    <span className={styles.condition}>{condition}</span>
                                </div>

                                <div className={styles.precip}>
                                    {precipitation >= 0.1 ? (
                                        <>
                                            <span className={styles.precipValue}>
                                                {round(precipitation, 1)} {t('millimeters')}
                                            </span>
                                            {!!day.precipitationHours && (
                                                <span className={styles.precipHours}>
                                                    {t('forecast-precip-hours', { count: day.precipitationHours })}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className={styles.muted}>{'—'}</span>
                                    )}
                                </div>

                                <div
                                    className={styles.temperature}
                                    aria-label={`${t('forecast-low')} ${formatSigned(min)}, ${t('forecast-high')} ${formatSigned(max)}`}
                                >
                                    <span className={styles.low}>{formatSigned(min)}</span>
                                    <span className={styles.rangeTrack}>
                                        <span
                                            className={styles.rangeFill}
                                            style={{
                                                left: `${range.left}%`,
                                                width: `${range.width}%`,
                                                background: `linear-gradient(90deg, ${getTemperatureHue(min)}, ${getTemperatureHue(max)})`
                                            }}
                                        />
                                    </span>
                                    <span className={styles.high}>{formatSigned(max)}</span>
                                </div>

                                <div
                                    className={styles.wind}
                                    title={formatWindDirection(t, day.windDeg)}
                                >
                                    <svg
                                        viewBox={'0 0 12 12'}
                                        aria-hidden={true}
                                        style={{ transform: `rotate(${(day.windDeg ?? 0) + 180}deg)` }}
                                    >
                                        <path d={'M6 1 L10 10 L6 8 L2 10 Z'} />
                                    </svg>
                                    <span className={styles.windSpeed}>
                                        {round(day.windSpeed ?? 0, 0)} {t('meters-per-second')}
                                    </span>
                                    {day.windGust != null && (
                                        <span className={styles.windGust}>
                                            {t('forecast-gusts', { value: round(day.windGust, 0) })}
                                        </span>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </WidgetCard>
    )
}

export default WidgetForecastDaily
