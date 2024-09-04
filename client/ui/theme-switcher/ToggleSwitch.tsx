import React, { useEffect, useRef, useState } from 'react'

import Circle from '@/ui/theme-switcher/Circle'
import Stars from '@/ui/theme-switcher/Stars'
import styles from '@/ui/theme-switcher/styles.module.sass'
import { ToggleSwitchProps } from '@/ui/theme-switcher/ThemeSwitcher'

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isClicked }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isActive, setIsActive] = useState(false)

    useEffect(() => {
        const scaleValue = isActive ? 1.03 : isHovered ? 1.05 : 1
        ref.current!.style.transform = `scale(${scaleValue})`
    }, [isHovered, isActive])

    const backgroundColor = isClicked ? '#595dde' : '#80c7cb'

    return (
        <div
            ref={ref}
            className={styles.dayNightSwitch}
            style={{
                backgroundColor: isHovered ? (isClicked ? '#5559cc' : '#79bfc3') : backgroundColor,
                transform: `scale(${isActive ? 1.03 : isHovered ? 1.05 : 1})`
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => setIsActive(true)}
            onMouseUp={() => setIsActive(false)}
        >
            <Stars isClicked={isClicked} />
            <Circle isClicked={isClicked} />
        </div>
    )
}

export default ToggleSwitch
