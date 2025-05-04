import React, { useEffect, useState } from 'react'

import { TRANSITION_TIME } from '@/ui/theme-switcher/constants'
import { ToggleSwitchProps } from '@/ui/theme-switcher/ThemeSwitcher'

import styles from '@/ui/theme-switcher/styles.module.sass'

const MoonIcon: React.FC<ToggleSwitchProps> = ({ isClicked }) => {
    const [value, setValue] = useState(isClicked ? 1 : 0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(isClicked ? 1 : 0)
        }, TRANSITION_TIME)

        return () => clearTimeout(timeout)
    }, [isClicked])

    return (
        <div
            className={styles.moonSvg}
            style={{
                opacity: value,
                transform: `translateY(${value === 1 ? '0px' : '32px'})`
            }}
        />
    )
}

export default MoonIcon
