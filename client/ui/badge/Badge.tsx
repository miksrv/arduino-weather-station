import React from 'react'
import { Icon, IconTypes } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

interface BadgeProps {
    key?: string
    label?: string
    icon?: IconTypes
    onClickRemove?: (key?: string) => void
}

const Badge: React.FC<BadgeProps> = ({ key, icon, label, onClickRemove }) => (
    <div className={styles.badge}>
        {icon && <Icon name={icon} />}
        <span className={styles.content}>{label}</span>
        {onClickRemove && (
            <button
                className={styles.close}
                onClick={() => onClickRemove?.(key ?? label)}
            >
                <Icon name={'Close'} />
            </button>
        )}
    </div>
)

export default Badge
