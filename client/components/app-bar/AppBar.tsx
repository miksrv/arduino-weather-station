import React from 'react'
import { cn, Icon, Spinner } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'
import { useTheme } from 'next-themes'

import { API } from '@/api'
import StatusBadge from '@/components/status-badge'
import useClientOnly from '@/hooks/useClientOnly'
import { POLLING_INTERVAL_CURRENT } from '@/tools/constants'
import { formatDate, timeAgo } from '@/tools/date'
import { getStationStatus } from '@/tools/helpers'
import ThemeSwitcher from '@/ui/theme-switcher'

import styles from './styles.module.sass'

interface HeaderProps {
    fullSize?: boolean
    onMenuClick?: () => void
}

const AppBar: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const isClient = useClientOnly()
    const { resolvedTheme, setTheme } = useTheme()
    const { t } = useTranslation()
    const { data: current, isLoading } = API.useGetCurrentQuery(undefined, {
        pollingInterval: POLLING_INTERVAL_CURRENT
    })

    // No answer at all reads as offline, like a reading that is hours old
    const status = current ? getStationStatus(current.isStale, current.lastUpdated) : 'offline'

    return (
        <header className={styles.appBar}>
            <div className={styles.wrapper}>
                <div className={styles.aside}>
                    <button
                        className={styles.hamburgerButton}
                        onClick={onMenuClick}
                        aria-label={t('toggle-sidebar')}
                    >
                        <Icon name={'Menu'} />
                    </button>

                    {!isLoading && <div className={cn(styles.dot, styles[status])} />}

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

                {!isLoading && status !== 'online' && (
                    <StatusBadge
                        role={'status'}
                        tone={status === 'stale' ? 'yellow' : 'red'}
                        icon={'ReportError'}
                        className={styles.notice}
                        label={t('stale-data-warning')}
                    />
                )}

                <div className={styles.themeSlot}>
                    {isClient && (
                        <ThemeSwitcher
                            theme={resolvedTheme}
                            label={t('dark-theme')}
                            onChangeTheme={setTheme}
                        />
                    )}
                </div>
            </div>
        </header>
    )
}

export default AppBar
