import React from 'react'

import ToggleSwitch from '@/ui/theme-switcher/ToggleSwitch'

import styles from './styles.module.sass'

type ThemesType = 'dark' | 'light'

export type ToggleSwitchProps = {
    checked: boolean
}

interface ThemeSwitcherProps {
    theme?: ThemesType | string
    label?: string
    onChangeTheme?: (theme: ThemesType) => void
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, label, onChangeTheme }) => {
    const handleToggle = () => {
        onChangeTheme?.(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <button
            type={'button'}
            role={'switch'}
            aria-checked={theme === 'dark'}
            aria-label={label}
            className={styles.toggleContainer}
            onClick={handleToggle}
        >
            <ToggleSwitch checked={theme === 'dark'} />
        </button>
    )
}

export default ThemeSwitcher
