import React, { useMemo } from 'react'
import { cn, Icon } from 'simple-react-ui-kit'

import { useTranslation } from 'next-i18next/pages'

import { ApiType } from '@/api'
import { formatDate } from '@/tools/date'

import { getEventDisplay } from './utils'

import styles from './styles.module.sass'

interface EventLogItemProps {
    event: ApiType.Events.Event
}

const EventLogItem: React.FC<EventLogItemProps> = ({ event }) => {
    const { t } = useTranslation()
    const display = useMemo(() => getEventDisplay(event, t), [event, t])

    return (
        <div className={styles.item}>
            <span className={styles.time}>{formatDate(event.date, 'HH:mm')}</span>
            <Icon
                name={display.icon}
                className={cn(styles.icon, styles[`icon--${display.category}`])}
            />
            <span className={styles.message}>{display.message}</span>
        </div>
    )
}

export default EventLogItem
