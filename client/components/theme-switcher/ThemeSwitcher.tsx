import React from 'react'
import { useTheme } from 'next-themes'

import styles from './styles.module.sass'

import useClientOnly from '@/tools/hooks/useClientOnly'
import Button from '@/ui/button'

const ThemeSwitcher: React.FC = () => {
    const isClient = useClientOnly()
    const { theme, setTheme } = useTheme()

    const handleToggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return isClient ? (
        <Button
            className={styles.themeSwitchButton}
            icon={theme === 'dark' ? 'Light' : 'Dark'}
            mode={'outline'}
            onClick={handleToggleTheme}
        />
    ) : null
}

export default ThemeSwitcher
