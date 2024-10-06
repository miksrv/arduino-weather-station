import React from 'react'
import { cn } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string
    className?: string
    action?: React.ReactNode
    header?: React.ReactNode
    children?: React.ReactNode
    footer?: React.ReactNode
}

const Container: React.FC<ContainerProps> = ({ className, title, action, header, children, footer, ...props }) => (
    <section
        {...props}
        className={cn(className, styles.container)}
    >
        {(header || title || action) && (
            <div className={styles.header}>
                {title && <h2 className={styles.title}>{title}</h2>}
                {header}
                {action && <div className={styles.actions}>{action}</div>}
            </div>
        )}
        {children}
        {footer}
    </section>
)

export default Container
