import React from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'

import styles from './styles.module.sass'

import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'

export type MenuItemType = {
    icon?: IconTypes
    link?: string
    text: string
}

interface MenuProps {
    onClick?: () => void
}

const Menu: React.FC<MenuProps> = ({ onClick }) => {
    const { t } = useTranslation('common')

    const menuItems: MenuItemType[] = [
        {
            icon: 'Feed',
            link: '/',
            text: t('geotags')
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
