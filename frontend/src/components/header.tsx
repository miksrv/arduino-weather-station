import React, { useState, useEffect } from 'react'
import translate from '../functions/translate'
import { Icon } from 'semantic-ui-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { toggle } from '../app/sidebarSlice'
import { timeAgo } from '../functions/helpers'

import moment from 'moment'

const OUTDATED_SEC = 180

// #TODO: Добавить обработик даты, если она 01.01.1970 (компонент не обновил дату)
const Header: React.FC = () => {
    const dispatch = useAppDispatch()
    const lang = translate().general
    const timestamp = useAppSelector(state => state.update.timestamp)
    const lastUpdate = timestamp ? timestamp.server - timestamp.update : 0
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        setSeconds(lastUpdate)
    }, [timestamp, lastUpdate])

    useEffect(() => {
        const interval = setInterval(() => setSeconds((seconds) => seconds + 1), 1000)

        return () => clearInterval(interval);
    }, [seconds])

    return (
        <div className='box header'>
            <Icon
                className='hamburger'
                name='bars'
                size='big'
                onClick={() => dispatch(toggle())}
                data-testid='open-menu'
            />
            <span className={! seconds || seconds > OUTDATED_SEC ? 'offline' : 'online pulsate'}></span>
            <span className='last-update'>
                <span>{timestamp ?
                    <>
                        <div>{moment.unix(timestamp.update).format('DD.MM.Y, H:mm:ss')}</div>
                        <div>{timeAgo(seconds)}</div>
                    </> :
                    <><Icon loading name='spinner' /> {lang.loading}</>}
                </span>
            </span>
        </div>
    )
}

export default Header
