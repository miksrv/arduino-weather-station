import React from 'react'
import { cn, Icon, IconTypes } from 'simple-react-ui-kit'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import { API } from '@/api'

import styles from './styles.module.sass'

const ANOMALY_POLLING_INTERVAL = 300_000

export type MenuItemType = {
    icon?: IconTypes
    link?: string
    text: string
    badge?: boolean
}

interface MenuProps {
    onClick?: () => void
}

const Menu: React.FC<MenuProps> = ({ onClick }) => {
    const { t } = useTranslation()
    const router = useRouter()

    const { data: anomalyData } = API.useGetAnomalyQuery(undefined, {
        pollingInterval: ANOMALY_POLLING_INTERVAL
    })

    const hasAnomalyBadge = anomalyData
        ? anomalyData.anomalies.some((a) => a.active) ||
          ((anomalyData.floodRisk.level === 'high' || anomalyData.floodRisk.level === 'critical') &&
              anomalyData.floodRisk.season === 'active')
        : false

    const menuItems: MenuItemType[] = [
        {
            icon: 'Cloud',
            link: '/',
            text: t('current-weather')
        },
        {
            icon: 'Pressure',
            link: '/sensors',
            text: t('weather-sensors')
        },
        {
            icon: 'Chart',
            link: '/history',
            text: t('historical-data')
        },
        {
            icon: 'Time',
            link: '/forecast',
            text: t('forecast')
        },
        {
            icon: 'BarChart',
            link: '/heatmap',
            text: t('heatmap')
        },
        {
            icon: 'Thermometer',
            link: '/climate',
            text: t('climate-changes')
        },
        {
            badge: hasAnomalyBadge,
            icon: 'Bell',
            link: '/anomaly',
            text: t('anomaly-monitor')
        }
    ]

    return (
        <menu className={styles.menu}>
            {menuItems
                .filter(({ link }) => !!link)
                .map((item, i) => (
                    <li key={`menu${i}`}>
                        <Link
                            href={item.link!}
                            title={item.text}
                            className={cn(router.pathname === item.link && styles.active)}
                            onClick={() => onClick?.()}
                        >
                            <span className={styles.iconWrapper}>
                                {item.icon && <Icon name={item.icon} />}
                                {item.badge && <span className={styles.badge} />}
                            </span>
                            {item.text}
                        </Link>
                    </li>
                ))}
        </menu>
    )
}

export default Menu
