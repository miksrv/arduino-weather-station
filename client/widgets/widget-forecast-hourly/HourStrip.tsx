import React from 'react'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import { getWeatherI18nKey } from '@/tools/conditions'
import { formatDate } from '@/tools/date'
import { capitalize, formatSigned } from '@/tools/forecast'
import { round } from '@/tools/helpers'
import { formatWindDirection } from '@/tools/weather'
import { ScrollRail } from '@/ui/scroll-rail'

import styles from './styles.module.sass'

interface HourStripProps {
    hours: ApiModel.Forecast[]
}

/**
 * Hour by hour as a scroll rail: time, sky, temperature, precipitation, wind. The arrow points where
 * the wind blows to; a new day starts with its weekday.
 */
const HourStrip: React.FC<HourStripProps> = ({ hours }) => {
    const { t } = useTranslation()

    return (
        <ScrollRail
            role={'list'}
            className={styles.strip}
            aria-label={t('forecast-hourly-title')}
        >
            {hours.map((hour, index) => {
                const time = formatDate(hour.date, 'HH:mm')
                const isNewDay = index > 0 && time === '00:00'
                const precipitation = hour.precipitation ?? 0

                return (
                    <div
                        key={hour.date ?? index}
                        role={'listitem'}
                        className={styles.hour}
                        data-new-day={isNewDay || undefined}
                    >
                        <span className={styles.hourDay}>
                            {isNewDay ? capitalize(formatDate(hour.date, 'dd')) : ' '}
                        </span>
                        <span className={styles.hourTime}>{index === 0 ? t('forecast-now') : time}</span>
                        <WeatherIcon
                            weatherId={hour.weatherId}
                            date={hour.date}
                            width={32}
                            height={32}
                            alt={t(getWeatherI18nKey(hour.weatherId))}
                        />
                        <span className={styles.hourTemp}>{formatSigned(hour.temperature)}</span>
                        <span className={styles.hourPrecip}>
                            {precipitation >= 0.1 ? `${round(precipitation, 1)} ${t('millimeters')}` : ' '}
                        </span>
                        <span
                            className={styles.hourWind}
                            title={formatWindDirection(t, hour.windDeg)}
                        >
                            <svg
                                viewBox={'0 0 12 12'}
                                aria-hidden={true}
                                style={{ transform: `rotate(${(hour.windDeg ?? 0) + 180}deg)` }}
                            >
                                <path d={'M6 1 L10 10 L6 8 L2 10 Z'} />
                            </svg>
                            {round(hour.windSpeed ?? 0, 0)}
                        </span>
                    </div>
                )
            })}
        </ScrollRail>
    )
}

export default HourStrip
