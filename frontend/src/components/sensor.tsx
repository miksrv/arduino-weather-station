import React from 'react'
import { ISensorItem, SensorTypes } from '../app/types'
import { WiThermometer, WiHumidity, WiBarometer } from 'react-icons/wi'
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from 'react-icons/io'

type SensorProps = {
    data: ISensorItem,
}

type MetaInfoType = {
    type: SensorTypes,
    name: string,
    sign: string,
    icon: React.ElementType,
    style: string,
}

const SensorsMeta:MetaInfoType[] = [
    {
        type: 'temperature',
        name: 'Температура',
        sign: '℃',
        icon: WiThermometer,
        style: 'red'
    },
    {
        type: 'dewpoint',
        name: 'Точка росы',
        sign: '℃',
        icon: WiThermometer,
        style: 'orange'
    },
    {
        type: 'humidity',
        name: 'Влажность воздуха',
        sign: '%',
        icon: WiHumidity,
        style: 'blue'
    },
    {
        type: 'pressure',
        name: 'Атмосферное давление',
        sign: 'мм. рт. ст.',
        icon: WiBarometer,
        style: 'cobalt'
    },
    {
        type: 'clouds',
        name: 'Облачность',
        sign: '%',
        icon: WiBarometer,
        style: 'cobalt'
    },
    {
        type: 'wind_speed',
        name: 'Скорость ветра',
        sign: 'м/с',
        icon: WiBarometer,
        style: 'cobalt'
    },
    {
        type: 'wind_degree',
        name: 'Направление ветра',
        sign: 'градусов',
        icon: WiBarometer,
        style: 'cobalt'
    },
    {
        type: 'precipitation',
        name: 'Осадки',
        sign: 'мм',
        icon: WiBarometer,
        style: 'cobalt'
    }
]

const TrendValue = (trend: number) => {
    return <div className='trend'>
        {trend > 0 && <IoIosArrowRoundUp className='up' />}
        {trend < 0 && <IoIosArrowRoundDown className='down' />}
        {trend}
    </div>
}

const Sensor: React.FC<SensorProps> = (props: SensorProps) => {
    const { data } = props
    const meta = SensorsMeta.filter(obj => obj.type === data.type).pop()
    const SensorIcon: any = meta?.icon

    return (
        <div className={`box sensor ${meta?.style}`}>
            <div className='title'>{meta?.name}</div>
            <div className='main'>
                <div className='value'>
                    {data.value} {meta?.sign && <span className='sign'>{meta.sign}</span>}
                </div>
                <SensorIcon className='icon' />
            </div>
            <div className='info'>
                <div>{data.trend && TrendValue(data.trend)}</div>
                <div>{data.max && <>max: {data.max}</>}</div>
                <div>{data.min && <>min: {data.min}</>}</div>
            </div>
        </div>
    )
}

export default Sensor
