import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import DateRangePicker from '@wojtekmaj/react-daterange-picker'

type TPeriod = {
    name: string,
    days: number
}

type TToolbarProps = {
    rangeStart: any,
    rangeEnd: any,
    periods?: boolean | TPeriod[],
    download?: boolean,

    onChangeInterval: any,
    onChangePeriod: any
}

const Toolbar: React.FC<TToolbarProps> = (props) => {
    const { rangeStart, rangeEnd, onChangeInterval, onChangePeriod, download, periods } = props

    const handleChangeInterval = (days: number) => onChangeInterval(days)
    const handleChangePeriod = (range: Date[]) => onChangePeriod(range)

    let defaultPeriods: TPeriod[] = [
        { name: 'Сутки', days: 1 },
        { name: 'Неделя', days: 7 },
        { name: 'Месяц', days: 30 },
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
                    href={`https://api.miksoft.pro/meteo/get/csv/?date_start=${rangeStart.format('YYYY-MM-DD')}&date_end=${rangeEnd.format('YYYY-MM-DD')}`}
                />
            )}
        </div>
    )
}

export default Toolbar
