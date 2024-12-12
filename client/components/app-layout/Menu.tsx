import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { Icon, IconTypes } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export type MenuItemType = {
    icon?: IconTypes
    link?: string
    text: string
}

interface MenuProps {
    onClick?: () => void
}

const Menu: React.FC<MenuProps> = ({ onClick }) => {
    const { t } = useTranslation()

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
                            onClick={() => onClick?.()}
                        >
                            {item.icon && <Icon name={item.icon} />}
                            {item.text}
                        </Link>
                    </li>
                ))}
        </menu>
    )
}

export default Menu
