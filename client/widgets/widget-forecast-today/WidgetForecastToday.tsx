import React from 'react'
import { Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import WidgetCard from '@/components/widget-card'
import { getWeatherI18nKey } from '@/tools/conditions'
import { formatDate } from '@/tools/date'
import { formatSigned, getDaySummary } from '@/tools/forecast'
import { round } from '@/tools/helpers'

import styles from './styles.module.sass'

export interface WidgetForecastTodayProps {
    /** The station's live reading */
    current?: ApiModel.Weather
    /** Today's row of the daily forecast */
    today?: ApiModel.Forecast
    loading?: boolean
}

/** The station's reading now: the sky, the temperature and how it feels */
const NowReading: React.FC<{ current?: ApiModel.Weather; fallbackWeatherId?: number }> = ({
    current,
    fallbackWeatherId
}) => {
    const { t } = useTranslation()

    return (
        <div className={styles.now}>
            <WeatherIcon
                weatherId={current?.weatherId ?? fallbackWeatherId}
                date={current?.date}
                width={64}
                height={64}
            />
            <div className={styles.nowText}>
                <span className={styles.caption}>{t('forecast-station-now')}</span>
                <span className={styles.temperature}>
                    {current?.temperature != null ? round(current.temperature, 1) : t('no-data')}
                    <span className={styles.unit}>{'°C'}</span>
                </span>
                {current?.feelsLike != null && (
                    <span className={styles.caption}>
                        {t('forecast-feels-like', { value: formatSigned(current.feelsLike) })}
                    </span>
                )}
            </div>
        </div>
    )
}

/**
 * The first answer of the forecast page: what it is like now (the station) and what the rest of today
 * brings (the forecast) — the day's high and low and one sentence about precipitation and wind.
 */
const WidgetForecastToday: React.FC<WidgetForecastTodayProps> = ({ current, today, loading }) => {
    const { t } = useTranslation()

    const summary = today
        ? getDaySummary(today)
              .map(({ key, values }) => t(key, values))
              .join(' ')
        : ''

    return (
        <WidgetCard
            title={t('forecast-today-title', { date: formatDate(today?.date ?? current?.date, t('date-day-month')) })}
            size={'x2'}
            className={styles.card}
        >
            {loading ? (
                <Skeleton style={{ width: '100%', height: 168 }} />
            ) : (
                <>
                    <div className={styles.main}>
                        <NowReading
                            current={current}
                            fallbackWeatherId={today?.weatherId}
                        />

                        <dl className={styles.extremes}>
                            <div>
                                <dt>{t('forecast-high')}</dt>
                                <dd className={styles.high}>{formatSigned(today?.temperatureMax)}</dd>
                            </div>
                            <div>
                                <dt>{t('forecast-low')}</dt>
                                <dd className={styles.low}>{formatSigned(today?.temperatureMin)}</dd>
                            </div>
                        </dl>
                    </div>

                    {today && (
                        <p className={styles.summary}>
                            <strong>{t(getWeatherI18nKey(today.weatherId))}.</strong> {summary}
                        </p>
                    )}
                </>
            )}
        </WidgetCard>
    )
}

export default WidgetForecastToday
