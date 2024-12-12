import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { cn, ColumnProps, Table, TableProps } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

import { ApiModel } from '@/api'
import WeatherIcon from '@/components/weather-icon'
import WindDirectionIcon from '@/components/wind-direction-icon'
import { getWeatherI18nKey } from '@/tools/conditions'
import { formatDate } from '@/tools/date'
import { round } from '@/tools/helpers'
import { convertHpaToMmHg, getCloudinessColor, getTemperatureColor } from '@/tools/weather'
import ComparisonIcon from '@/ui/comparison-icon'

export const TABLE_COLUMNS = {
    date: 'date',
    time: 'time',
    weather: 'weather',
    weatherIcon: 'weatherIcon',
    temperature: 'temperature',
    clouds: 'clouds',
    pressure: 'pressure',
    wind: 'wind',
    precipitation: 'precipitation'
} as const

type ExtendedColumnProps<T> = ColumnProps<T> & {
    column: keyof typeof TABLE_COLUMNS
}

interface WidgetProps extends TableProps<ApiModel.Weather> {
    columnsPreset?: (keyof typeof TABLE_COLUMNS)[]
    title?: string
    link?: React.AnchorHTMLAttributes<HTMLAnchorElement>
    fullWidth?: boolean
}

const WidgetForecastTable: React.FC<WidgetProps> = ({ columnsPreset, title, link, fullWidth, ...props }) => {
    const { t } = useTranslation()

    const containerRef = useRef<HTMLDivElement | null>(null)
    const titleRef = useRef<HTMLDivElement | null>(null)
    const [tableHeight, setTableHeight] = useState<number | null>(null)

    const tableConfig: ExtendedColumnProps<ApiModel.Weather>[] = [
        {
            column: 'date',
            header: t('date'),
            accessor: 'date',
            className: styles.cellDate,
            isSortable: true,
            formatter: (date) => formatDate(date as string, 'dd, MMM D')
        },
        {
            column: 'time',
            header: t('time'),
            accessor: 'date',
            className: styles.cellDate,
            isSortable: true,
            formatter: (date) => formatDate(date as string, t('date-only-hour'))
        },
        {
            column: 'weather',
            header: t('weather'),
            accessor: 'weatherId',
            className: styles.cellCondition,
            formatter: (weatherId) => (
                <>
                    <WeatherIcon weatherId={weatherId as number} />
                    {t(getWeatherI18nKey(weatherId || ''))}
                </>
            )
        },
        {
            column: 'weatherIcon',
            header: t('weather'),
            accessor: 'weatherId',
            className: styles.cellWeather,
            formatter: (weatherId, data, i) => (
                <WeatherIcon
                    weatherId={weatherId as number}
                    date={data[i].date}
                />
            )
        },
        {
            column: 'temperature',
            header: t('temperature-short'),
            accessor: 'temperature',
            className: styles.cellTemperature,
            isSortable: true,
            background: (temperature) => getTemperatureColor(temperature),
            formatter: (temperature) => <>{round(Number(temperature), 1)} °C</>
        },
        {
            column: 'clouds',
            header: t('clouds'),
            accessor: 'clouds',
            className: styles.cellClouds,
            isSortable: true,
            background: (clouds) => getCloudinessColor(clouds),
            formatter: (clouds) => <>{clouds}%</>
        },
        {
            column: 'pressure',
            header: t('pressure'),
            accessor: 'pressure',
            className: styles.cellPressure,
            isSortable: true,
            formatter: (pressure, data, i) => (
                <>
                    <span>{convertHpaToMmHg(pressure)}</span>
                    <ComparisonIcon
                        currentValue={pressure}
                        previousValue={data[i - 1]?.pressure}
                    />
                </>
            )
        },
        {
            column: 'wind',
            header: t('wind'),
            accessor: 'windSpeed',
            className: styles.cellWind,
            isSortable: true,
            formatter: (windSpeed, data, i) => (
                <>
                    <WindDirectionIcon direction={Number(data[i]?.windDeg)} />
                    {round(Number(windSpeed), 1)} {t('meters-per-second')}
                </>
            )
        },
        {
            column: 'precipitation',
            header: t('precipitation'),
            accessor: 'precipitation',
            className: styles.cellClouds,
            isSortable: true,
            formatter: (precipitation) =>
                precipitation ? (
                    <>
                        {precipitation} {t('millimeters')}
                    </>
                ) : (
                    ''
                )
        }
    ]

    useEffect(() => {
        const calculateTableHeight = () => {
            if (containerRef.current && titleRef.current && props.stickyHeader) {
                const containerHeight = containerRef.current.offsetHeight
                const titleHeight = titleRef.current.offsetHeight
                const calculatedHeight = containerHeight - titleHeight
                setTableHeight(calculatedHeight)
            }
        }

        calculateTableHeight()

        window.addEventListener('resize', calculateTableHeight)

        return () => {
            window.removeEventListener('resize', calculateTableHeight)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn(
                styles.widgetForecastTable,
                props.stickyHeader && styles.stickyHeader,
                fullWidth && styles.fullWidth
            )}
        >
            {title && (
                <h3
                    ref={titleRef}
                    className={styles.title}
                >
                    {link ? (
                        <Link
                            href={link?.href || ''}
                            {...link}
                        >
                            {title}
                        </Link>
                    ) : (
                        title
                    )}
                </h3>
            )}

            <Table<ApiModel.Weather>
                {...props}
                className={styles.table}
                columns={
                    columnsPreset?.length
                        ? tableConfig.filter((column) => columnsPreset?.includes(column.column))
                        : props.columns
                }
                height={props.stickyHeader ? tableHeight : undefined}
            />
        </div>
    )
}

export default WidgetForecastTable
