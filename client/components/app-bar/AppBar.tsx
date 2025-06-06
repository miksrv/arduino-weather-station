import React from 'react'
import { Icon, Spinner } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'

import { API } from '@/api'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'
import { formatDate, minutesAgo, timeAgo } from '@/tools/date'
import useClientOnly from '@/tools/hooks/useClientOnly'
import ThemeSwitcher from '@/ui/theme-switcher'

import styles from './styles.module.sass'

interface HeaderProps {
    fullSize?: boolean
    onMenuClick?: () => void
}

const OFFLINE_TIME = 30

// TODO: Sometimes the date is shown as in the future (ie in X minutes), needs to be fixed
const AppBar: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const isClient = useClientOnly()
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation()
    const { data: current, isLoading } = API.useGetCurrentQuery(undefined, { pollingInterval: POLING_INTERVAL_CURRENT })

    return (
        <header className={styles.appBar}>
            <div className={styles.wrapper}>
                <div className={styles.aside}>
                    <button
                        className={styles.hamburgerButton}
                        onClick={onMenuClick}
                        aria-label={'Toggle Sidebar'}
                    >
                        <Icon name={'Menu'} />
                    </button>

                    {!isLoading && (
                        <div className={minutesAgo(current?.date) <= OFFLINE_TIME ? styles.online : styles.offline} />
                    )}

                    {isLoading ? (
                        <div className={styles.loading}>
                            <Spinner /> {t('please-wait-loading')}
                        </div>
                    ) : (
                        <div>
                            <div>{formatDate(current?.date, t('date-full-format'))}</div>
                            <div className={styles.timeAgo}>{timeAgo(current?.date)}</div>
                        </div>
                    )}
                </div>

                {isClient && (
                    <ThemeSwitcher
                        theme={theme}
                        onChangeTheme={setTheme}
                    />
                )}
            </div>
        </header>
    )
}

export default AppBar
