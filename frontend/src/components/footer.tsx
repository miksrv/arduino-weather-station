import React from 'react'
import { version, update } from '../../package.json'
import { useGetUptimeQuery } from '../app/weatherApi'

import moment from 'moment'

const Footer: React.FC = () => {
    const { data, isSuccess } = useGetUptimeQuery()
    const uptime = data?.timestamp.update || 0

    return (
        <div className='footer'>
            <div>Uptime: {
                isSuccess && (<><b>{data?.payload}%</b> ({moment.unix(uptime).format('DD.MM.Y, H:mm:ss')})</>)
            }
            </div>
            <div>Powered by Arduino, PHP + MySQL, ReactJS + Redux RTK.</div>
            <div>Copyright ©
                <a href='https://miksoft.pro' className='copyright-link' title=''>
                    <img src='https://miksoft.pro/favicon.ico' alt='' /> Mik
                </a> 2022, Version {version} ({update})
            </div>
        </div>
    )
}

export default Footer
