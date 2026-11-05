import React, { useEffect, useRef, useState } from 'react'

import Circle from '@/ui/theme-switcher/Circle'
import Stars from '@/ui/theme-switcher/Stars'
import { ToggleSwitchProps } from '@/ui/theme-switcher/ThemeSwitcher'

import styles from '@/ui/theme-switcher/styles.module.sass'

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        const scaleValue = isActive ? 1.03 : isHovered ? 1.05 : 1
        ref.current!.style.transform = `scale(${scaleValue})`
    }, [isHovered, isActive])

    return (
        <div
            ref={ref}
            className={styles.dayNightSwitch}
            style={{
                transform: `scale(${isActive ? 1.03 : isHovered ? 1.05 : 1})`
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
        >
            <Stars checked={checked} />
            <Circle checked={checked} />
        </div>
    )
}

export default ToggleSwitch
