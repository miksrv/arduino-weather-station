import React from 'react'

import styles from './styles.module.sass'

import Icon from '@/ui/icon'

interface ChipProps {
    text: string
    onClickRemove?: (text: string) => void
}

const Chip: React.FC<ChipProps> = ({ text, onClickRemove }) => (
    <div className={styles.chip}>
        <span className={styles.text}>{text}</span>
        <button
            className={styles.close}
            onClick={() => onClickRemove?.(text)}
        >
            <Icon name={'Close'} />
        </button>
    </div>
)

export default Chip
