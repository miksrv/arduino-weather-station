import React from 'react'

import { useTranslation } from 'next-i18next/pages'

import { API } from '@/api'
import WidgetCard, { WidgetCardProps } from '@/components/widget-card'
import { POLING_INTERVAL_CURRENT } from '@/pages/_app'

import EventLogItem from './EventLogItem'

import styles from './styles.module.sass'

export type WidgetEventLogProps = Pick<WidgetCardProps, 'size'>

const WidgetEventLog: React.FC<WidgetEventLogProps> = ({ size }) => {
    const { t } = useTranslation()

    const { data, isLoading } = API.useGetEventsQuery(
        { hours: 24, limit: 50 },
        { pollingInterval: POLING_INTERVAL_CURRENT }
    )

    return (
        <WidgetCard
            title={t('event-log')}
            size={size}
            loading={isLoading}
            loadingHeight={170}
        >
            <div className={styles.list}>
                {data?.events.length ? (
                    data.events.map((event, index) => (
                        <EventLogItem
                            key={`${event.date}-${index}`}
                            event={event}
                        />
                    ))
                ) : (
                    <div className={styles.empty}>{t('event-log-empty')}</div>
                )}
            </div>
        </WidgetCard>
    )
}

export default WidgetEventLog
