import React, { useRef } from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'

interface TextareaProps extends Omit<React.InputHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    label?: string
    disableAutoresize?: boolean
    onChange?: (value?: string) => void
}

const Textarea: React.FC<TextareaProps> = ({ label, onChange, disableAutoresize, ...props }) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>): void => {
        onChange?.(evt.target.value)

        if (textAreaRef.current && !disableAutoresize) {
            textAreaRef.current.style.height = 'inherit'
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
        }
    }

    return (
        <div className={cn(props.className, styles.textarea)}>
            {label && <label className={styles.label}>{label}</label>}
            <span className={styles.formField}>
                <textarea
                    {...props}
                    ref={textAreaRef}
                    className={styles.input}
                    onChange={handleChange}
                    rows={1}
                />
            </span>
        </div>
    )
}

export default Textarea
