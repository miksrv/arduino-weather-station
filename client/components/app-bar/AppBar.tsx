import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'
import { API } from '@/api'

interface HeaderProps {
    fullSize?: boolean
    onMenuClick?: () => void
}

const AppBar: React.FC<HeaderProps> = ({ fullSize, onMenuClick }) => {
    const { data: current } = API.useGetCurrentQuery(undefined, {pollingInterval: 60 * 1000})

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

                {current?.update?.date}

                <div className={styles.rightSection}>
                    theme switch
                </div>
            </div>
        </header>
    )
}

export default AppBar
