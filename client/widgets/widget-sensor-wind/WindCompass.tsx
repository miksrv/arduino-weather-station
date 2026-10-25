import React from 'react'

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
                    className={styles.tick}
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
                        className={styles.glowStop}
                    />
                    <stop
                        offset='100%'
                        className={styles.glowStopEnd}
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
                className={styles.ring}
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
                    className={styles.needleHead}
                />
                <polygon
                    points='100,132 91,100 109,100'
                    className={styles.needleTail}
                />
                <circle
                    cx={100}
                    cy={100}
                    r={4.5}
                    className={styles.needlePin}
                />
            </g>
        </svg>
    )
}

export default WindCompass
