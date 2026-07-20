import React from 'react'
import { cn } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export type ChartsPeriod = '24h' | '7d' | '30d'

interface PeriodToggleProps {
    value: ChartsPeriod
    onChange: (period: ChartsPeriod) => void
    options: Array<{ value: ChartsPeriod; label: string }>
}

const PeriodToggle: React.FC<PeriodToggleProps> = ({ value, onChange, options }) => (
    <div className={styles.toggle}>
        {options.map((option) => (
            <button
                key={option.value}
                type={'button'}
                className={cn(styles.toggleButton, option.value === value && styles.toggleButtonActive)}
                onClick={() => onChange(option.value)}
            >
                {option.label}
            </button>
        ))}
    </div>
)

export default PeriodToggle
