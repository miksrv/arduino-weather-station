import React from 'react'

import styles from './styles.module.sass'

export interface PageHeaderProps {
    /** The page h1 */
    title: string
    /** One line under the title: what the page shows */
    description?: string
    /** Controls on the title's line (date pickers, export), right-aligned; under the title on phones */
    actions?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => (
    <header className={styles.pageHeader}>
        <div className={styles.text}>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
    </header>
)

export default PageHeader
