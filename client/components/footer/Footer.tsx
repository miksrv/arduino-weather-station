import React from 'react'

import Image from 'next/image'

import packageInfo from '@/package.json'
import { formatDate } from '@/tools/date'

import styles from './styles.module.sass'

interface FooterProps {
    /** Shown at the right end of the copyright line (the language switch in the drawer) */
    action?: React.ReactNode
}

const Footer: React.FC<FooterProps> = ({ action }) => (
    <footer className={styles.footer}>
        <div className={styles.row}>
            <div>
                {'Copyright ©'}
                <a
                    href={'https://miksoft.pro'}
                    className={styles.link}
                    title={'Mik — author'}
                >
                    <Image
                        className={styles.copyrightImage}
                        src={'https://miksoft.pro/favicon.ico'}
                        alt={'Mik'}
                        width={12}
                        height={12}
                    />
                    {'Mik'}
                </a>
                {formatDate(new Date(), 'YYYY')}
            </div>
            {action}
        </div>
        <div>
            {'v'}
            <span>{packageInfo.version}</span>
            <a
                href={'https://github.com/miksrv/arduino-weather-station'}
                rel={'nofollow noreferrer'}
                className={styles.link}
                title={'Arduino Weather Station on GitHub'}
            >
                {'GitHub'}
            </a>
        </div>
    </footer>
)

export default Footer
