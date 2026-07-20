import React from 'react'
import { Icon } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { API } from '@/api'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'
import { timeAgo } from '@/tools/date'

import styles from './styles.module.sass'

const StaleDataBanner: React.FC = () => {
    const { t } = useTranslation()
    const { data: current } = API.useGetCurrentQuery(undefined, { pollingInterval: POLING_INTERVAL_CURRENT })

    if (!current?.isStale) {
        return null
    }

    return (
        <div className={styles.banner}>
            <Icon name={'ReportError'} />
            <div className={styles.text}>
                <span className={styles.title}>{t('stale-data-banner-title')}</span>
                <span className={styles.message}>
                    {t('stale-data-banner-message', { time: timeAgo(current.lastUpdated) })}
                </span>
            </div>
        </div>
    )
}

export default StaleDataBanner
