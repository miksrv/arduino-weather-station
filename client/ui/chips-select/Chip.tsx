import React from 'react'

import styles from './styles.module.sass'

import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'

interface ChipProps {
    text: string | number
    icon?: IconTypes
    onClickRemove?: (text: string | number) => void
}

const Chip: React.FC<ChipProps> = ({ text, icon, onClickRemove }) => (
    <div className={styles.chip}>
        {icon && <Icon name={icon} />}
        <span className={styles.text}>{text}</span>
        {onClickRemove && (
            <button
                className={styles.close}
                onClick={() => onClickRemove?.(text)}
            >
                <Icon name={'Close'} />
            </button>
        )}
    </div>
)

export default Chip
