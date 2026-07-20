import React from 'react'
import { Icon, IconTypes, Skeleton } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import styles from './styles.module.sass'

export interface WidgetTileProps {
    icon?: IconTypes
    title?: string
    value?: string | number
    unit?: string
    loading?: boolean
    formatter?: (value: string | number | undefined) => string | number
}

const WidgetTile: React.FC<WidgetTileProps> = ({ icon, title, value, unit, loading, formatter }) => {
    const { t } = useTranslation()

    const formatValue = (rawValue?: string | number) => (formatter ? formatter(rawValue) : rawValue)

    return (
        <div className={styles.tile}>
            {icon && (
                <Icon
                    name={icon}
                    className={styles.icon}
                />
            )}
            <div className={styles.content}>
                <span className={styles.title}>{title}</span>
                <span className={styles.value}>
                    {loading ? (
                        <Skeleton style={{ width: 60, height: 16, marginTop: 2 }} />
                    ) : (
                        <>
                            {formatValue(value ?? t('no-data'))}
                            {unit && value !== undefined && <span className={styles.unit}>{unit}</span>}
                        </>
                    )}
                </span>
            </div>
        </div>
    )
}

export default WidgetTile
