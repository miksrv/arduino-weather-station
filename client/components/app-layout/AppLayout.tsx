import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'next-i18next'
import NextNProgress from 'nextjs-progressbar'

import Menu from './Menu'
import styles from './styles.module.sass'

import { API } from '@/api/api'
import { useAppSelector } from '@/api/store'
import AppBar from '@/components/app-bar'
import Footer from '@/components/footer'
import LanguageSwitcher from '@/components/language-switcher'
import ThemeSwitcher from '@/components/theme-switcher'
import { concatClassNames as cn } from '@/tools/helpers'
import Icon from '@/ui/icon'

interface AppLayoutProps {
    className?: string
    fullSize?: boolean
    children?: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ className, fullSize, children }) => {
    const { t } = useTranslation()

    const application = useAppSelector((store) => store.application)

    const [leftDistance, setLeftDistance] = useState<number>()
    const [scrollTopVisible, setScrollTopVisible] = useState<boolean>(false)
    const menuBarRef = useRef<HTMLDivElement>(null)

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

    const handleCloseOverlay = () => {
        setSidebarOpen(false)
    }

    const handleOpenSideBar = () => {
        setSidebarOpen(true)
    }

    const handleScrollToTop = () => {
        window.scrollTo(0, 0)
    }

    useEffect(() => {
        const handleScroll = () => {
            setScrollTopVisible(window.scrollY > 500)
        }

        const handleResize = () => {
            if (menuBarRef.current) {
                const rect = menuBarRef.current.getBoundingClientRect()

                setLeftDistance(rect.left + rect.width - 5)
            }
        }

        handleResize()

        window.addEventListener('scroll', handleScroll)
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

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
                tabIndex={0}
                role={'button'}
                className={styles.scrollArea}
                style={{
                    display: scrollTopVisible ? 'block' : 'none',
                    width: leftDistance
                }}
                onKeyDown={() => undefined}
                onClick={handleScrollToTop}
            >
                <div className={styles.buttonToTop}>
                    <Icon name={'Up'} />
                    {t('scroll-to-top')}
                </div>
            </div>

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
                <Menu
                    type={'mobile'}
                    onClick={handleCloseOverlay}
                />
                <div className={styles.content}>
                    <div className={styles.switchers}>
                        <ThemeSwitcher />
                        <LanguageSwitcher />
                    </div>
                    <Footer />
                </div>
            </aside>

            <section className={styles.mainContainer}>
                <aside
                    className={styles.menubar}
                    ref={menuBarRef}
                >
                    <div className={styles.rails}>
                        <Menu
                            type={'desktop'}
                        />
                        <div className={styles.switchers}>
                            <ThemeSwitcher />
                            <LanguageSwitcher />
                        </div>
                        <Footer />
                    </div>
                </aside>
                <main className={styles.main}>{children}</main>
            </section>
        </div>
    )
}

export default AppLayout
