import React, { useMemo } from 'react'

import { WIND_SPEED_BINS } from './utils'

import styles from './styles.module.sass'

interface WindSpeedLegendProps {
    unit: string
}

/** Nominal upper end of the legend bar — the last bin is open-ended, so it's given a fixed visual width. */
const LEGEND_SCALE_MAX = 12

/** All finite bin bounds except the last one, which is rendered as an "N+" label at the bar's right edge instead. */
const TICKS = [0, ...WIND_SPEED_BINS.slice(0, -2).map((bin) => bin.max)].map((value) => ({
    label: String(value),
    percent: (value / LEGEND_SCALE_MAX) * 100
}))

const OPEN_ENDED_BIN_MAX = WIND_SPEED_BINS[WIND_SPEED_BINS.length - 2].max

const WindSpeedLegend: React.FC<WindSpeedLegendProps> = ({ unit }) => {
    const gradient = useMemo(() => {
        const stops: string[] = []
        let start = 0

        WIND_SPEED_BINS.forEach((bin) => {
            const end = (Math.min(bin.max, LEGEND_SCALE_MAX) / LEGEND_SCALE_MAX) * 100
            stops.push(`${bin.color} ${start}%`, `${bin.color} ${end}%`)
            start = end
        })

        return `linear-gradient(to right, ${stops.join(', ')})`
    }, [])

    return (
        <div className={styles.legend}>
            <div
                className={styles.legendTrack}
                style={{ backgroundImage: gradient }}
            />
            <div className={styles.legendTicks}>
                {TICKS.map((tick, index) => (
                    <span
                        key={tick.label}
                        className={styles.legendTick}
                        style={{
                            left: `${tick.percent}%`,
                            transform: `translateX(${index === 0 ? '0' : '-50%'})`
                        }}
                    >
                        {tick.label}
                    </span>
                ))}
                <span
                    className={styles.legendTick}
                    style={{ left: '100%', transform: 'translateX(-100%)' }}
                >
                    {`${OPEN_ENDED_BIN_MAX}+ ${unit}`}
                </span>
            </div>
        </div>
    )
}

export default WindSpeedLegend
