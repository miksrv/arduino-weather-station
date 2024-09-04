import React, { useEffect, useState } from 'react'

import { TRANSITION_TIME } from '@/ui/theme-switcher/constants'
import styles from '@/ui/theme-switcher/styles.module.sass'
import { ToggleSwitchProps } from '@/ui/theme-switcher/ThemeSwitcher'

const Stars: React.FC<ToggleSwitchProps> = ({ isClicked }) => {
    const [value, setValue] = useState(isClicked ? 1 : 0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(isClicked ? 1 : 0)
        }, TRANSITION_TIME)

        return () => clearTimeout(timeout)
    }, [isClicked])

    return (
        <div
            className={styles.stars}
            style={{
                transform: 'translateY(-20px)',
                opacity: value
            }}
        >
            <div
                className={styles.star}
                style={{ top: '8px', left: '10px', width: 1, height: 1, opacity: 0.8 }}
            />
            <div
                className={styles.star}
                style={{ top: '15px', left: '20px', width: 3, height: 3, opacity: 0.7 }}
            />
            <div
                className={styles.star}
                style={{ top: '25px', left: '25px', width: 2, height: 2, opacity: 0.4 }}
            />
            <div
                className={styles.star}
                style={{ top: '22px', left: '13px', width: 2, height: 2, opacity: 0.6 }}
            />
        </div>
    )
}

export default Stars
