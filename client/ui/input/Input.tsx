import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

const Input: React.FC<InputProps> = ({ label, error, ...props }) => (
    <div
        className={cn(
            styles.input,
            error && styles.error,
            props.required && styles.required,
            props.disabled && styles.disabled
        )}
    >
        {label && <label className={styles.label}>{label}</label>}
        <span className={styles.formField}>
            <input
                {...props}
                className={styles.input}
            />
        </span>
    </div>
)

export default Input
