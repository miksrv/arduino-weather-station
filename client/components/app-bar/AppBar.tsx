import React from 'react'

import styles from './styles.module.sass'

import { API } from '@/api'
import Icon from '@/ui/icon'

interface HeaderProps {
    fullSize?: boolean
    onMenuClick?: () => void
}

const AppBar: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { data: current } = API.useGetCurrentQuery(undefined, {pollingInterval: 60 * 1000})

    return (
        <header className={styles.appBar}>
            <div className={styles.wrapper}>
                <button
                    className={styles.hamburgerButton}
                    onClick={onMenuClick}
                    aria-label={'Toggle Sidebar'}
                >
                    <Icon name={'Menu'} />
                </button>

                {current?.update?.date}

                <div className={styles.rightSection}>
                    theme switch
                </div>
            </div>
        </header>
    )
}

export default AppBar
