import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

import styles from './styles.module.sass'

import useClientOnly from '@/tools/hooks/useClientOnly'

const transitionTime = 200

const ThemeToggle: React.FC = () => {
    const isClient = useClientOnly()
    const { theme, setTheme } = useTheme()

    const handleToggle = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return isClient ? (
        <div
            className={styles.toggleContainer}
            onClick={handleToggle}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.which === 13 || e.which === 32) {
                    handleToggle()
                }
            }}
        >
            <ToggleSwitch isClicked={theme === 'dark'} />
        </div>
    ) : null
}

type ToggleSwitchProps = {
    isClicked: boolean
}

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

const Circle: React.FC<ToggleSwitchProps> = ({ isClicked }) => {
    const [value, setValue] = useState(isClicked ? 1 : 0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(isClicked ? 1 : 0)
        }, transitionTime)

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

const MoonIcon: React.FC<ToggleSwitchProps> = ({ isClicked }) => {
    const [value, setValue] = useState(isClicked ? 1 : 0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(isClicked ? 1 : 0)
        }, transitionTime)

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

const Stars: React.FC<ToggleSwitchProps> = ({ isClicked }) => {
    const [value, setValue] = useState(isClicked ? 1 : 0)

    useEffect(() => {
        const timeout = setTimeout(() => {
            setValue(isClicked ? 1 : 0)
        }, transitionTime)

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

export default ThemeToggle
