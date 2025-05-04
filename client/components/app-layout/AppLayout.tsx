import React, { useEffect, useState } from 'react'
import { cn } from 'simple-react-ui-kit'

import NextNProgress from 'nextjs-progressbar'

import { useAppSelector } from '@/api/store'
import AppBar from '@/components/app-bar'
import Footer from '@/components/footer'
import LanguageSwitcher from '@/components/language-switcher'

import Menu from './Menu'

import styles from './styles.module.sass'

interface AppLayoutProps {
    className?: string
    fullSize?: boolean
    children?: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ className, fullSize, children }) => {
    const application = useAppSelector((store) => store.application)

    const [overlayHeight, setOverlayHeight] = useState<number | string>('100%')
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

    useEffect(() => {
        const calculatePageHeight = () => {
            if (document.documentElement.scrollHeight) {
                setOverlayHeight(document.documentElement.clientHeight)
            }
        }

        calculatePageHeight()

        window.addEventListener('resize', calculatePageHeight)

        return () => {
            window.removeEventListener('resize', calculatePageHeight)
        }
    }, [])

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
                style={{ height: overlayHeight }}
                onKeyDown={handleCloseOverlay}
                onClick={handleCloseOverlay}
            />

            <AppBar
                fullSize={fullSize}
                onMenuClick={handleOpenSideBar}
            />

            <aside
                className={cn(styles.sidebar, sidebarOpen ? styles.opened : styles.closed)}
                style={{ height: overlayHeight }}
            >
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
