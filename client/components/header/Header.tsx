import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Breadcrumbs, { BreadcrumbsProps } from '@/ui/breadcrumbs'
import Button from '@/ui/button'
import Container from '@/ui/container'

interface HeaderProps extends BreadcrumbsProps {
    title?: string
    backLink?: string
    className?: string
    attachedBottom?: boolean
    actions?: React.ReactNode
}

const Header: React.FC<HeaderProps> = ({ title, backLink, className, attachedBottom, actions, ...props }) => (
    <Container className={cn(className, styles.header, attachedBottom && styles.attachedBottom)}>
        {backLink && (
            <Button
                className={styles.backLink}
                icon={'LargeLeft'}
                link={backLink}
            />
        )}

        <header>
            <h1>{title}</h1>
            <Breadcrumbs {...props} />
        </header>
        {actions && <div className={styles.actions}>{actions}</div>}
    </Container>
)

export default Header
