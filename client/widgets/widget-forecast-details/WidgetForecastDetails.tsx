import React from 'react'
import { Icon, IconTypes, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiModel } from '@/api'
import WidgetCard from '@/components/widget-card'
import { formatSigned } from '@/tools/forecast'
import { round } from '@/tools/helpers'
import { convertHpaToMmHg, getUvCategory } from '@/tools/weather'

import styles from './styles.module.sass'

export interface WidgetForecastDetailsProps {
    /** Today's row of the daily forecast */
    today?: ApiModel.Forecast
    loading?: boolean
}

interface Detail {
    icon: IconTypes
    label: string
    value: string
    note?: string
}

/** The rest of today's forecast, in six figures: what a reader checks after the temperature */
const WidgetForecastDetails: React.FC<WidgetForecastDetailsProps> = ({ today, loading }) => {
    const { t } = useTranslation()

    const details: Detail[] = today
        ? [
              { icon: 'Water', label: t('humidity'), value: `${round(today.humidity ?? 0, 0)}%` },
              {
                  icon: 'Pressure',
                  label: t('forecast-pressure-mean'),
                  value: `${convertHpaToMmHg(today.pressure) ?? '—'} ${t('mm-hg')}`
              },
              { icon: 'Thermometer', label: t('dew-point'), value: formatSigned(today.dewPoint) },
              {
                  icon: 'Sun',
                  label: t('forecast-uv-max'),
                  value: `${round(today.uvIndex ?? 0, 0)}`,
                  note: t(`uv-category-${getUvCategory(today.uvIndex)}`)
              },
              {
                  icon: 'Wind',
                  label: t('forecast-wind-max'),
                  value: `${round(today.windSpeedMax ?? today.windSpeed ?? 0, 0)} ${t('meters-per-second')}`,
                  note: today.windGust != null ? t('forecast-gusts', { value: round(today.windGust, 0) }) : undefined
              },
              { icon: 'Cloud', label: t('clouds'), value: `${round(today.clouds ?? 0, 0)}%` }
          ]
        : []

    return (
        <WidgetCard
            title={t('forecast-day-details')}
            size={'x2'}
        >
            {loading || !today ? (
                <Skeleton style={{ width: '100%', height: 168 }} />
            ) : (
                <dl className={styles.grid}>
                    {details.map((detail) => (
                        <div
                            key={detail.label}
                            className={styles.item}
                        >
                            <Icon
                                name={detail.icon}
                                className={styles.icon}
                            />
                            <dt>{detail.label}</dt>
                            <dd>
                                {detail.value}
                                {detail.note && <span className={styles.note}>{detail.note}</span>}
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
        </WidgetCard>
    )
}

export default WidgetForecastDetails
