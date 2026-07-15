import React from 'react'
import { cn } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export type StatBlockModifier = 'max' | 'min'
export type StatBlockAlign = 'start' | 'end'

export interface StatBlockProps {
    title: React.ReactNode
    value: React.ReactNode
    modifier?: StatBlockModifier
    align?: StatBlockAlign
}

const StatBlock: React.FC<StatBlockProps> = ({ title, value, modifier, align = 'end' }) => (
    <div className={cn(styles.statBlock, align === 'start' ? styles.alignStart : styles.alignEnd)}>
        <span className={styles.statTitle}>{title}</span>
        <span className={cn(styles.statValue, modifier && styles[`statValue--${modifier}`])}>{value}</span>
    </div>
)

export default StatBlock
