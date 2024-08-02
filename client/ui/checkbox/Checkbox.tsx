import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string | React.ReactNode
    indeterminate?: boolean
}

const Checkbox: React.FC<CheckboxProps> = ({ label, indeterminate, ...props }) => (
    <div className={styles.checkbox}>
        <div className={cn(styles.formField, (props.checked || indeterminate) && styles.checked)}>
            {indeterminate ? (
                <Icon name={'CheckboxIndeterminate'} />
            ) : props.checked ? (
                <Icon name={'CheckboxChecked'} />
            ) : (
                <Icon name={'CheckboxUnchecked'} />
            )}
            <input
                {...props}
                type={'checkbox'}
            />
        </div>
        {label && <label htmlFor={props.id}>{label}</label>}
    </div>
)

export default Checkbox
