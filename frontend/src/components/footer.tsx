import React from 'react'
import { useAppSelector } from '../app/hooks'
import { useGetUptimeQuery } from '../app/weatherApi'
import { update } from 'update';
import { version } from 'version';

import moment from 'moment'

const Footer: React.FC = () => {
    const { data, isSuccess } = useGetUptimeQuery()
    const language = useAppSelector(state => state.language.translate)
    const uptime = data?.timestamp.update || 0

    return (
        <div className='footer'>
            <div>Uptime: {isSuccess ?
                (<><b>{data?.payload}%</b> ({moment.unix(uptime).format('DD.MM.Y, H:mm:ss')})</>)
                : language.general.loading}
            </div>
            <div>Powered by Arduino, PHP + MySQL, ReactJS + Redux RTK.</div>
            <div>Copyright ©
                <a href='https://miksoft.pro' className='copyright-link' title=''>
                    <img src='https://miksoft.pro/favicon.ico' alt='' /> Mik
                </a> 2023, Version <span>{version}</span> <span>({update})</span>
            </div>
        </div>
    )
}

export default Footer
