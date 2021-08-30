import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import DateRangePicker from '@wojtekmaj/react-daterange-picker'

const Toolbar = props => {
    const { rangeStart, rangeEnd } = props
    const handleChangePeriod = period => props.changePeriod(period)
    const handleDatePicker = range => props.changeData(range)

    let periods = [
        {name: 'Сутки', day: 1},
        {name: 'Неделя', day: 7},
        {name: 'Месяц', day: 30},
    ]

    if (props.periods !== undefined && typeof props.periods === "object") {
        periods = props.periods
    }

    return (
        <div className='toolBar'>
            <Button.Group size='mini' className='periods'>
                {(props.periods === undefined || props.periods !== false) && periods.map((item, key) => (
                    <Button color='grey' key={key} onClick={() => handleChangePeriod(item.day)}>{item.name}</Button>
                ))}
            </Button.Group>
            <DateRangePicker
                className='range-calendar'
                onChange={(range) => {handleDatePicker(range)}}
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
            {(props.csvbutton !== undefined) && (
                <Button
                    size='mini'
                    icon='download'
                    color='grey'
                    as='a'
                    href={`https://api.miksoft.pro/meteo/get/csv/?date_start=${rangeStart.format('YYYY-MM-DD')}&date_end=${rangeEnd.format('YYYY-MM-DD')}`}
                />
            )}
        </div>
    )
}

export default Toolbar