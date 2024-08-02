import React from 'react'
import Link from 'next/link'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'
import { IconTypes } from '@/ui/icon/types'
import Spinner from '@/ui/spinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string
    link?: string
    noIndex?: boolean
    stretched?: boolean
    loading?: boolean
    size?: 'small' | 'medium'
    mode?: 'primary' | 'secondary' | 'tertiary' | 'outline' | 'link'
    variant?: 'positive' | 'negative' | 'neutral'
    icon?: IconTypes
    children?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
    className,
    link,
    noIndex,
    stretched,
    loading,
    size,
    mode,
    variant,
    icon,
    children,
    ...props
}) => {
    const button = (
        <button
            {...props}
            type={props.type ?? 'button'}
            className={cn(
                className,
                styles.button,
                mode && styles[mode],
                variant && styles[variant],
                size && styles[size],
                stretched && styles.stretched,
                !children && styles.noText
            )}
        >
            {loading ? (
                <Spinner className={styles.loader} />
            ) : (
                <>
                    {icon && <Icon name={icon} />}
                    <div>{children}</div>
                </>
            )}
        </button>
    )

    return link ? (
        <Link
            className={styles.buttonLink}
            href={link}
            title={''}
            rel={noIndex ? 'noindex nofollow' : ''}
        >
            {button}
        </Link>
    ) : (
        button
    )
}

export default Button
