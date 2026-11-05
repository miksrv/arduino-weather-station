import React from 'react'

import { useTranslation } from 'next-i18next/pages'

import { ApiType } from '@/api'
import {
    getHeatmapRange,
    getHeatmapUnit,
    getPrecipitationPieces,
    HEATMAP_PALETTES,
    HeatmapPoint
} from '@/tools/heatmap'

import styles from './styles.module.sass'

interface HeatmapLegendProps {
    type: ApiType.Heatmap.SensorType
    points: HeatmapPoint[]
}

/**
 * The colour scale of the heatmap, in the card header: a gradient between the period's lowest and highest
 * values, or for precipitation the steps of its stepped scale. Same values and colours as the map.
 */
const HeatmapLegend: React.FC<HeatmapLegendProps> = ({ type, points }) => {
    const { t } = useTranslation()
    const unit = getHeatmapUnit(type, t)

    if (type === 'precipitation') {
        return (
            <ul className={styles.legend}>
                {getPrecipitationPieces(unit, t('heatmap-dry')).map((piece) => (
                    <li
                        key={piece.gte}
                        className={styles.step}
                    >
                        <span
                            className={piece.color ? styles.swatch : styles.swatchDry}
                            style={piece.color ? { backgroundColor: piece.color } : undefined}
                        />
                        {piece.label}
                    </li>
                ))}
            </ul>
        )
    }

    const [min, max] = getHeatmapRange(points)

    return (
        <div className={styles.legend}>
            <span>{`${min} ${unit}`}</span>
            <span
                className={styles.gradient}
                style={{ backgroundImage: `linear-gradient(to right, ${HEATMAP_PALETTES[type].join(', ')})` }}
            />
            <span>{`${max} ${unit}`}</span>
        </div>
    )
}

export default HeatmapLegend
