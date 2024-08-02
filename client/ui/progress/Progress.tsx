import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'

interface ProgressProps {
    value?: number
    className?: string
}

const Progress: React.FC<ProgressProps> = ({ value, className }) => (
    <div className={cn(styles.progress, className)}>
        <div
            className={styles.line}
            style={{ width: `${value}%` }}
        />
    </div>
)

export default Progress
