import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const RadioButton: React.FC<RadioButtonProps> = ({ label, ...props }) => (
    <div className={styles.radioButton}>
        <div className={cn(styles.formField, props.checked && styles.checked)}>
            {props.checked ? <Icon name={'RadioButtonChecked'} /> : <Icon name={'RadioButtonUnchecked'} />}
            <input
                {...props}
                type={'radio'}
            />
        </div>
        {label && <label htmlFor={props.id}>{label}</label>}
    </div>
)

export default RadioButton
