import React, { useMemo } from 'react'

import { getUvScalePercent, UV_INDEX_BREAKPOINTS, UV_INDEX_SCALE_MAX } from '@/tools/weather'

import styles from './styles.module.sass'

interface UvScaleProps {
    value?: number
}

const BAND_COLORS = ['#43a047', '#f2b400', '#f2811a', '#c62828', '#7c3aed']

const BAND_MAXES = [...UV_INDEX_BREAKPOINTS, UV_INDEX_SCALE_MAX]

const TICKS = [0, ...UV_INDEX_BREAKPOINTS].map((value) => ({
    value,
    percent: (value / UV_INDEX_SCALE_MAX) * 100,
    label: String(value)
}))
TICKS.push({ value: UV_INDEX_SCALE_MAX, percent: 100, label: '11+' })

const UvScale: React.FC<UvScaleProps> = ({ value }) => {
    const markerPercent = getUvScalePercent(value)

    const gradient = useMemo(() => {
        const stops: string[] = []
        let start = 0

        BAND_MAXES.forEach((max, index) => {
            const end = (max / UV_INDEX_SCALE_MAX) * 100
            stops.push(`${BAND_COLORS[index]} ${start}%`, `${BAND_COLORS[index]} ${end}%`)
            start = end
        })

        return `linear-gradient(to right, ${stops.join(', ')})`
    }, [])

    return (
        <div className={styles.scaleWrapper}>
            <div
                className={styles.track}
                style={{ backgroundImage: gradient }}
            >
                <div
                    className={styles.marker}
                    style={{ left: `${markerPercent}%` }}
                />
            </div>
            <div className={styles.ticks}>
                {TICKS.map((tick, index) => (
                    <span
                        key={tick.value}
                        className={styles.tick}
                        style={{
                            left: `${tick.percent}%`,
                            transform: `translateX(${index === 0 ? '0' : index === TICKS.length - 1 ? '-100%' : '-50%'})`
                        }}
                    >
                        {tick.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default UvScale
