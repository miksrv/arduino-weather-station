import React from 'react'
import translate from '../functions/translate'
import { Button, Icon } from 'semantic-ui-react'
import { TPeriod, TToolbarProps } from '../app/types'
import DateRangePicker from '@wojtekmaj/react-daterange-picker'

const Toolbar: React.FC<TToolbarProps> = (props) => {
    const { rangeStart, rangeEnd, onChangeInterval, onChangePeriod, download, periods } = props
    const lang = translate().toolbar

    const handleChangeInterval = (days: number) => onChangeInterval(days)
    const handleChangePeriod = (range: Date[]) => onChangePeriod(range)

    let defaultPeriods: TPeriod[] = [
        { name: lang.periods.day, days: 1 },
        { name: lang.periods.week, days: 7 },
        { name: lang.periods.month, days: 30 }
    ]

    if (periods !== undefined && typeof periods === "object") {
        defaultPeriods = periods
    }

    return (
        <div className='toolBar'>
            <Button.Group size='mini' className='periods'>
                {(periods === undefined || periods !== false) && defaultPeriods.map((item, key) => (
                    <Button color='grey' key={key} active={key === 0} onClick={() => handleChangeInterval(item.days)}>{item.name}</Button>
                ))}
            </Button.Group>
            <DateRangePicker
                className='range-calendar'
                onChange={(range: any) => handleChangePeriod(range)}
                calendarIcon={<Icon name='calendar alternate outline' size='large' />}
                minDate={new Date('2020-04-10')}
                maxDate={new Date()}
                locale='ru-RU'
                clearIcon={null}
                format='dd.MM.yyyy'
                value={[
                    rangeStart._d,
                    rangeEnd._d
                ]}
            />&nbsp;
            {(download !== undefined) && (
                <Button
                    size='mini'
                    icon='download'
                    color='grey'
                    as='a'
                    href={`${process.env.REACT_APP_API_HOST}export?date_start=${rangeStart.format('YYYY-MM-DD')}&date_end=${rangeEnd.format('YYYY-MM-DD')}`}
                />
            )}
        </div>
    )
}

export default Toolbar
