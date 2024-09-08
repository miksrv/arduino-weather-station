import React from 'react'

import styles from './styles.module.sass'

import packageInfo from '@/package.json'
import { formatDate } from '@/tools/date'
import { update } from '@/update'

const Footer: React.FC = () => (
    <footer className={styles.footer}>
        <div>
            {'Copyright ©'} {packageInfo.name} {formatDate(new Date(), 'YYYY')}
        </div>
        <div>
            {'Version'} <span>{packageInfo.version}</span> <span>({formatDate(update, 'MM.D.YYYY, HH:mm')})</span>
        </div>
    </footer>
)

export default Footer
