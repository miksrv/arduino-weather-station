import DateRangePicker from '@wojtekmaj/react-daterange-picker'
import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

import { useAppSelector } from 'app/hooks'
import { TPeriod, TToolbarProps } from 'app/types'

const Toolbar: React.FC<TToolbarProps> = (props) => {
    const {
        rangeStart,
        rangeEnd,
        onChangeInterval,
        onChangePeriod,
        download,
        periods
    } = props
    const language = useAppSelector((state) => state.language.translate)

    let defaultPeriods: TPeriod[] = [
        { days: 1, name: language.toolbar.periods.day },
        { days: 7, name: language.toolbar.periods.week },
        { days: 30, name: language.toolbar.periods.month }
    ]

    if (periods !== undefined && typeof periods === 'object') {
        defaultPeriods = periods
    }

    const [days, setDays] = React.useState<number>(defaultPeriods[0].days)

    const handleChangePeriod = (range: Date[]) => onChangePeriod(range)
    const handleChangeInterval = (days: number) => {
        onChangeInterval(days)
        setDays(days)
    }

    return (
        <div className='toolBar'>
            <Button.Group
                size='mini'
                className='periods'
            >
                {(periods === undefined || periods !== false) &&
                    defaultPeriods.map((item, key) => (
                        <Button
                            color='grey'
                            key={key}
                            active={days === item.days}
                            onClick={() => handleChangeInterval(item.days)}
                        >
                            {item.name}
                        </Button>
                    ))}
            </Button.Group>
            <DateRangePicker
                className='range-calendar'
                onChange={(range: any) => handleChangePeriod(range)}
                calendarIcon={
                    <Icon
                        name='calendar alternate outline'
                        size='large'
                    />
                }
                minDate={new Date('2020-04-10')}
                maxDate={new Date()}
                locale='ru-RU'
                clearIcon={null}
                format='dd.MM.yyyy'
                value={[rangeStart._d, rangeEnd._d]}
            />
            &nbsp;
            {download !== undefined && (
                <Button
                    size='mini'
                    icon='download'
                    color='grey'
                    as='a'
                    href={
                        `${process.env.REACT_APP_API_HOST}export?` +
                        `date_start=${rangeStart.format('YYYY-MM-DD')}` +
                        `&date_end=${rangeEnd.format('YYYY-MM-DD')}`
                    }
                />
            )}
        </div>
    )
}

export default Toolbar
