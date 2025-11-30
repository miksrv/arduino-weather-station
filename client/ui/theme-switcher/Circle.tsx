import React, { useEffect, useState } from 'react'

import { TRANSITION_TIME } from '@/ui/theme-switcher/constants'
import MoonIcon from '@/ui/theme-switcher/MoonIcon'
import { ToggleSwitchProps } from '@/ui/theme-switcher/ThemeSwitcher'

import styles from '@/ui/theme-switcher/styles.module.sass'

const Circle: React.FC<ToggleSwitchProps> = ({ checked }) => {
    const [value, setValue] = useState(checked ? 1 : 0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(checked ? 1 : 0)
        }, TRANSITION_TIME)

        return () => clearTimeout(timeout)
    }, [checked])

    return (
        <div
            className={styles.circle}
            style={{
                transform: `translateX(${value === 1 ? 'calc(100% + 15px)' : '5px'})`,
                backgroundColor: checked ? 'rgba(255,255,255,0.4)' : '#fddf75',
                borderColor: checked ? 'rgba(255,255,255,0.9)' : '#d6b05eb5'
            }}
        >
            <MoonIcon checked={checked} />
        </div>
    )
}

export default Circle
