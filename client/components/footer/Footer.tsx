import React from 'react'

import Image from 'next/image'

import packageInfo from '@/package.json'
import { formatDate } from '@/tools/date'
import { update } from '@/update'

import styles from './styles.module.sass'

const Footer: React.FC = () => (
    <footer className={styles.footer}>
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
            <span>({formatDate(update, 'DD.MM.YYYY, HH:mm')})</span>
        </div>
    </footer>
)

export default Footer
