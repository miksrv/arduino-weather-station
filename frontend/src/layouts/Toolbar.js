import React from 'react'

import { Button, Icon } from "semantic-ui-react";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";

const Toolbar = props => {
    const { data } = props

    return (
        <div className='toolBar'>
            <Button.Group size='mini'>
                <Button color='grey' onClick={() => this.changePeriod(1)}>Сутки</Button>
                <Button color='grey' onClick={() => this.changePeriod(7)}>Неделя</Button>
                <Button color='grey' onClick={() => this.changePeriod(30)}>Месяц</Button>
            </Button.Group>
            <DateRangePicker
                className='range-calendar'
                onChange={(v) => {this.handleDatePicker(v)}}
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