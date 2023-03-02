import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Dropdown, Icon } from 'semantic-ui-react'

import { useAppDispatch, useAppSelector } from 'app/hooks'
import { toggle } from 'app/sidebarSlice'

import { timeAgo } from 'functions/helpers'
import { changeLanguage, getLanguage } from 'functions/translate'

const OUTDATED_SEC = 180

const countryOptions = [
    { flag: 'ru', key: 'ru', text: 'RU', value: 'ru' },
    { flag: 'us', key: 'en', text: 'EN', value: 'en' }
]

const Header: React.FC = () => {
    const dispatch = useAppDispatch()
    const timestamp = useAppSelector((state) => state.update.timestamp)
    const language = useAppSelector((state) => state.language.translate)
    const lastUpdate = timestamp ? timestamp.server - timestamp.update : 0
    const [seconds, setSeconds] = useState(0)

    const changeLang = (e: any, { value }: any) => changeLanguage(value)
    const currentLang = countryOptions
        .filter((lang) => lang.key === getLanguage())
        .pop()

    useEffect(() => {
        setSeconds(lastUpdate)
    }, [timestamp, lastUpdate])

    useEffect(() => {
        if (timestamp && timestamp.server !== 0 && timestamp.update !== 0) {
            const interval = setInterval(
                () => setSeconds((seconds) => seconds + 1),
                1000
            )

            return () => clearInterval(interval)
        }
    }, [seconds, timestamp])

    return (
        <div className='box header'>
            <Icon
                className='hamburger'
                name='bars'
                size='big'
                onClick={() => dispatch(toggle())}
                data-testid='open-menu'
            />
            <span
                className={
                    !seconds || seconds > OUTDATED_SEC
                        ? 'offline'
                        : 'online pulsate'
                }
            ></span>
            <span className='last-update'>
                <span>
                    {timestamp && timestamp.update !== 0 ? (
                        <>
                            <div>
                                {moment
                                    .unix(timestamp.update)
                                    .format('DD.MM.Y, H:mm:ss')}
                            </div>
                            <div>{timeAgo(seconds, language.timeago)}</div>
                        </>
                    ) : (
                        <>
                            <Icon
                                loading
                                name='spinner'
                            />{' '}
                            {language.general.loading}
                        </>
                    )}
                </span>
            </span>
            <span className='language'>
                <Dropdown
                    fluid
                    selection
                    options={countryOptions}
                    defaultValue={currentLang?.value}
                    onChange={changeLang}
                />
            </span>
        </div>
    )
}

export default Header
