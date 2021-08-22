import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import DateRangePicker from '@wojtekmaj/react-daterange-picker'

const Toolbar = props => {
    const { rangeStart, rangeEnd } = props
    const handleChangePeriod = period => props.changePeriod(period)
    const handleDatePicker = range => props.changeData(range)

    return (
        <div className='toolBar'>
            <Button.Group size='mini'>
                <Button color='grey' onClick={() => handleChangePeriod(1)}>Сутки</Button>
                <Button color='grey' onClick={() => handleChangePeriod(7)}>Неделя</Button>
                <Button color='grey' onClick={() => handleChangePeriod(30)}>Месяц</Button>
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
            <Button
                size='mini'
                icon='download'
                color='grey'
                as='a'
                href={`https://api.miksoft.pro/meteo/get/csv/?date_start=${rangeStart.format('YYYY-MM-DD')}&date_end=${rangeEnd.format('YYYY-MM-DD')}`}
            />
        </div>
    )
}

export default Toolbar