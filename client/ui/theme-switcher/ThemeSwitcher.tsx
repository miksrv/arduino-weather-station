import React from 'react'

import ToggleSwitch from '@/ui/theme-switcher/ToggleSwitch'

import styles from './styles.module.sass'

type ThemesType = 'dark' | 'light'

export type ToggleSwitchProps = {
    isClicked: boolean
}

interface ThemeSwitcherProps {
    theme?: ThemesType | string
    onChangeTheme?: (theme: ThemesType) => void
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onChangeTheme }) => {
    const handleToggle = () => {
        onChangeTheme?.(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <div
            className={styles.toggleContainer}
            onClick={handleToggle}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleToggle()
                }
            }}
        >
            <ToggleSwitch isClicked={theme === 'dark'} />
        </div>
    )
}

export default ThemeSwitcher
