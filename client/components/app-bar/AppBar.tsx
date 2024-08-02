import React from 'react'

import styles from './styles.module.sass'

import Logo from '@/components/app-bar/Logo'
import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'

interface HeaderProps {
    fullSize?: boolean
    onMenuClick?: () => void
}

const AppBar: React.FC<HeaderProps> = ({ fullSize, onMenuClick }) => {
    return (
        <header className={cn(styles.appBar, fullSize && styles.fullSize)}>
            <div className={styles.wrapper}>
                <button
                    className={styles.hamburgerButton}
                    onClick={onMenuClick}
                    aria-label={'Toggle Sidebar'}
                >
                    <Icon name={'Menu'} />
                </button>

                <Logo />

                <div className={styles.rightSection}>
                    theme switch
                </div>
            </div>
        </header>
    )
}

export default AppBar
