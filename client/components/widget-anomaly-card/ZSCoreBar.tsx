import React from 'react'

import styles from './styles.module.sass'

interface ZScoreBarProps {
    zScore: number
}

export const ZScoreBar: React.FC<ZScoreBarProps> = ({ zScore }) => {
    const abs = Math.abs(zScore)
    const fillPct = Math.min(abs / 3.0, 1.0) * 50

    let colorVar = 'var(--color-green)'
    if (abs >= 2.0) {
        colorVar = 'var(--color-red)'
    } else if (abs >= 1.5) {
        colorVar = 'var(--color-orange)'
    }

    return (
        <div className={styles.zBar}>
            <div className={styles.zBarTrack}>
                {zScore < 0 ? (
                    <div
                        className={styles.zBarFillLeft}
                        style={{ width: `${fillPct}%`, backgroundColor: colorVar }}
                    />
                ) : (
                    <div className={styles.zBarSpacer} />
                )}
                <div className={styles.zBarMid} />
                {zScore >= 0 ? (
                    <div
                        className={styles.zBarFillRight}
                        style={{ width: `${fillPct}%`, backgroundColor: colorVar }}
                    />
                ) : (
                    <div className={styles.zBarSpacer} />
                )}
            </div>
        </div>
    )
}
