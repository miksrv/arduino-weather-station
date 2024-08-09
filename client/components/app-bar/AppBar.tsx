import React from 'react'
import { useTranslation } from 'next-i18next'

import styles from './styles.module.sass'

import { API } from '@/api'
import { formatDate, minutesAgo, timeAgo } from '@/tools/helpers'
import Icon from '@/ui/icon'
import Spinner from '@/ui/spinner'

interface HeaderProps {
    fullSize?: boolean
    onMenuClick?: () => void
}

const OFFLINE_TIME = 30

const AppBar: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { t } = useTranslation()
    const { data: current, isLoading } = API.useGetCurrentQuery(undefined, { pollingInterval: 60 * 1000 })

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

                {!isLoading && (
                    <div
                        className={minutesAgo(current?.update?.date) <= OFFLINE_TIME ? styles.online : styles.offline}
                    />
                )}

                {isLoading ? (
                    <div className={styles.loading}>
                        <Spinner /> {t('please-wait-loading')}
                    </div>
                ) : (
                    <div>
                        <div>{formatDate(current?.update?.date)}</div>
                        <div className={styles.timeAgo}>{timeAgo(current?.update?.date)}</div>
                    </div>
                )}
            </div>
        </header>
    )
}

export default AppBar
