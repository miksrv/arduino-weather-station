'use client'

import React, { useEffect } from 'react'

import styles from './styles.module.sass'

import Spinner from '@/ui/spinner'

interface ScreenSpinnerProps {
    text?: string
}

const ScreenSpinner: React.FC<ScreenSpinnerProps> = ({ text }) => {
    useEffect(() => {
        const globalDiv = document.createElement('div')

        globalDiv.className = styles.overlay

        document.body.appendChild(globalDiv)

        return () => {
            document.body.removeChild(globalDiv)
        }
    }, [])

    return (
        <div className={styles.screenSpinner}>
            <div className={styles.container}>
                <Spinner />
                {text && <div className={styles.text}>{text}</div>}
            </div>
        </div>
    )
}

export default ScreenSpinner
