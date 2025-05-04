import React, { useEffect, useState } from 'react'

import { TRANSITION_TIME } from '@/ui/theme-switcher/constants'
import MoonIcon from '@/ui/theme-switcher/MoonIcon'
import { ToggleSwitchProps } from '@/ui/theme-switcher/ThemeSwitcher'

import styles from '@/ui/theme-switcher/styles.module.sass'

const Circle: React.FC<ToggleSwitchProps> = ({ isClicked }) => {
    const [value, setValue] = useState(isClicked ? 1 : 0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(isClicked ? 1 : 0)
        }, TRANSITION_TIME)

        return () => clearTimeout(timeout)
    }, [isClicked])

    return (
        <div
            className={styles.circle}
            style={{
                transform: `translateX(${value === 1 ? 'calc(100% + 15px)' : '5px'})`,
                backgroundColor: isClicked ? 'rgba(255,255,255,0.4)' : '#fddf75',
                borderColor: isClicked ? 'rgba(255,255,255,0.9)' : '#d6b05eb5'
            }}
        >
            <MoonIcon isClicked={isClicked} />
        </div>
    )
}

export default Circle
