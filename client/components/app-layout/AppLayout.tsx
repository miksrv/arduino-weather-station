import React, { useEffect, useState } from 'react'
import NextNProgress from 'nextjs-progressbar'
import { cn } from 'simple-react-ui-kit'

import Menu from './Menu'
import styles from './styles.module.sass'

import { useAppSelector } from '@/api/store'
import AppBar from '@/components/app-bar'
import Footer from '@/components/footer'
import LanguageSwitcher from '@/components/language-switcher'

interface AppLayoutProps {
    className?: string
    fullSize?: boolean
    children?: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ className, fullSize, children }) => {
    const application = useAppSelector((store) => store.application)

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

    const handleCloseOverlay = () => {
        setSidebarOpen(false)
    }

    const handleOpenSideBar = () => {
        setSidebarOpen(true)
    }

    useEffect(() => {
        if (application.showOverlay || sidebarOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }

        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [application.showOverlay, sidebarOpen])

    return (
        <div className={cn(className, styles.appLayout, fullSize && styles.fullSize)}>
            <NextNProgress
                color={'#2688eb'}
                options={{ showSpinner: false }}
            />

            <div
                role={'button'}
                tabIndex={0}
                className={cn(
                    styles.overlay,
                    application.showOverlay || sidebarOpen ? styles.displayed : styles.hidden
                )}
                onKeyDown={handleCloseOverlay}
                onClick={handleCloseOverlay}
            />

            <AppBar
                fullSize={fullSize}
                onMenuClick={handleOpenSideBar}
            />

            <aside className={cn(styles.sidebar, sidebarOpen ? styles.opened : styles.closed)}>
                <Menu onClick={handleCloseOverlay} />
                <div className={styles.content}>
                    <div className={styles.switchers}>
                        <LanguageSwitcher />
                    </div>
                    <Footer />
                </div>
            </aside>

            <section className={styles.mainContainer}>
                <main className={styles.main}>{children}</main>
            </section>
        </div>
    )
}

export default AppLayout
