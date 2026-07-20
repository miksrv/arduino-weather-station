import React from 'react'
import { cn, Icon, IconTypes, Skeleton } from 'simple-react-ui-kit'

import Link from 'next/link'

import styles from './styles.module.sass'

export type WidgetCardSize = 'x1' | 'x2' | 'x3' | 'x4'

export interface WidgetCardProps {
    title?: string
    icon?: IconTypes
    size?: WidgetCardSize
    link?: React.AnchorHTMLAttributes<HTMLAnchorElement>
    loading?: boolean
    loadingHeight?: number
    className?: string
    children?: React.ReactNode
}

const WidgetCard: React.FC<WidgetCardProps> = ({
    title,
    icon,
    size = 'x1',
    link,
    loading,
    loadingHeight = 150,
    className,
    children
}) => (
    <div className={cn(styles.widget, styles[size], className)}>
        {(title || icon) && (
            <div className={styles.header}>
                <h3>
                    {link ? (
                        <Link
                            href={link?.href || ''}
                            {...link}
                        >
                            {title}{' '}
                            <Icon
                                name={'External'}
                                className={styles.externalLinkIcon}
                            />
                        </Link>
                    ) : (
                        title
                    )}
                </h3>
                {icon && <Icon name={icon} />}
            </div>
        )}

        {loading ? <Skeleton style={{ width: '100%', height: loadingHeight }} /> : children}
    </div>
)

export default WidgetCard
