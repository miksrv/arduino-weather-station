import React from 'react'

import { hexToRgba, resolveCssVar, statChartColor } from '@/tools/colors'

import styles from './styles.module.sass'

interface WindCompassProps {
    direction?: number
}

const CENTER = 100
const OUTER_RADIUS = 88
/** Extra room around the ring, in every direction, so the N/E/S/W labels can sit outside it. */
const VIEWBOX_MARGIN = 16
/** Radius at which the N/E/S/W labels are placed — outside the ring, inside the margin. */
const LABEL_RADIUS = 98

const NEEDLE_HEAD_COLOR = '#f6941d'
const NEEDLE_TAIL_COLOR = '#8b93a1'

const CARDINAL_LABELS: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }
const CARDINAL_DEGREES = Object.keys(CARDINAL_LABELS).map(Number)
const INTERCARDINAL_DEGREES = [45, 135, 225, 315]
/** The remaining 8 ticks of a 16-point compass rose, once cardinal/intercardinal ones are excluded. */
const MINOR_DEGREES = Array.from({ length: 16 }, (_, i) => i * 22.5).filter(
    (deg) => !CARDINAL_DEGREES.includes(deg) && !INTERCARDINAL_DEGREES.includes(deg)
)

const pointOnCircle = (radius: number, angleDeg: number) => ({
    x: CENTER + radius * Math.sin((angleDeg * Math.PI) / 180),
    y: CENTER - radius * Math.cos((angleDeg * Math.PI) / 180)
})

const WindCompass: React.FC<WindCompassProps> = ({ direction }) => {
    const textColor = resolveCssVar('--text-color-secondary', '#76787a')
    const ringColor = hexToRgba(textColor, 0.3)
    const tickColor = hexToRgba(textColor, 0.35)
    const glowColor = hexToRgba(statChartColor[0], 0.1)

    const renderTicks = (degrees: number[], length: number, width: number) =>
        degrees.map((deg) => {
            const outer = pointOnCircle(OUTER_RADIUS, deg)
            const inner = pointOnCircle(OUTER_RADIUS - length, deg)

            return (
                <line
                    key={deg}
                    x1={outer.x}
                    y1={outer.y}
                    x2={inner.x}
                    y2={inner.y}
                    stroke={tickColor}
                    strokeWidth={width}
                    strokeLinecap='round'
                />
            )
        })

    return (
        <svg
            viewBox={`${-VIEWBOX_MARGIN} ${-VIEWBOX_MARGIN} ${200 + 2 * VIEWBOX_MARGIN} ${200 + 2 * VIEWBOX_MARGIN}`}
            className={styles.compass}
        >
            <defs>
                <radialGradient id='windCompassGlow'>
                    <stop
                        offset='0%'
                        stopColor={glowColor}
                    />
                    <stop
                        offset='100%'
                        stopColor={glowColor}
                        stopOpacity={0}
                    />
                </radialGradient>
            </defs>

            <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS}
                fill='url(#windCompassGlow)'
            />
            <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS}
                stroke={ringColor}
                fill='none'
            />

            {renderTicks(MINOR_DEGREES, 5, 1)}
            {renderTicks(INTERCARDINAL_DEGREES, 7, 1.5)}
            {renderTicks(CARDINAL_DEGREES, 10, 2)}

            {CARDINAL_DEGREES.map((deg) => {
                const isNorth = deg === 0
                const { x, y } = pointOnCircle(LABEL_RADIUS, deg)

                return (
                    <text
                        key={deg}
                        x={x}
                        y={y}
                        textAnchor='middle'
                        dominantBaseline='central'
                        fill={isNorth ? NEEDLE_HEAD_COLOR : textColor}
                        className={isNorth ? styles.compassLabelNorth : styles.compassLabel}
                    >
                        {CARDINAL_LABELS[deg]}
                    </text>
                )
            })}

            <g
                transform={`rotate(${direction ?? 0} 100 100)`}
                className={styles.needle}
            >
                <polygon
                    points='100,36 91,100 109,100'
                    fill={NEEDLE_HEAD_COLOR}
                />
                <polygon
                    points='100,132 91,100 109,100'
                    fill={NEEDLE_TAIL_COLOR}
                />
                <circle
                    cx={100}
                    cy={100}
                    r={4.5}
                    fill={textColor}
                />
            </g>
        </svg>
    )
}

export default WindCompass
