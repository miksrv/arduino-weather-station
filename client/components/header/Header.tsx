import React from 'react'

import styles from './styles.module.sass'

import { concatClassNames as cn } from '@/tools/helpers'
import Breadcrumbs, { BreadcrumbsProps } from '@/ui/breadcrumbs'
import Container from '@/ui/container'

interface HeaderProps extends BreadcrumbsProps {
    title?: string
    className?: string
    attachedBottom?: boolean
    actions?: React.ReactNode
}

const Header: React.FC<HeaderProps> = ({ title, className, attachedBottom, actions, ...props }) => (
    <Container className={cn(className, styles.header, attachedBottom && styles.attachedBottom)}>
        <header>
            <h1>{title}</h1>
            <Breadcrumbs {...props} />
        </header>
        {actions && <div className={styles.actions}>{actions}</div>}
    </Container>
)

export default Header
