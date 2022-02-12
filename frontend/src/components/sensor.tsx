import React from 'react'
import { ISensorItem, SensorTypes } from '../app/types'
import { useAppSelector } from '../app/hooks'
import { WiThermometer, WiHumidity, WiBarometer, WiDaySunny, WiFlood, WiCloudy, WiWindDeg, WiStrongWind, WiHot, WiNa, WiRaindrop } from 'react-icons/wi'
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from 'react-icons/io'

type TSensorProps = {
    data: ISensorItem,
}

type MetaInfoType = {
    type: SensorTypes | 'undefined',
    icon: React.ElementType,
    style: string,
}

const SensorsMeta:MetaInfoType[] = [
    {
        type: 'temperature',
        icon: WiThermometer,
        style: 'red'
    },
    {
        type: 'dewpoint',
        icon: WiRaindrop,
        style: 'lightblue'
    },
    {
        type: 'feels_like',
        icon: WiThermometer,
        style: 'pink'
    },
    {
        type: 'humidity',
        icon: WiHumidity,
        style: 'blue'
    },
    {
        type: 'pressure',
        icon: WiBarometer,
        style: 'purple'
    },
    {
        type: 'clouds',
        icon: WiCloudy,
        style: 'blue'
    },
    {
        type: 'wind_speed',
        icon: WiStrongWind,
        style: 'lime'
    },
    {
        type: 'wind_gust',
        icon: WiStrongWind,
        style: 'lime'
    },
    {
        type: 'wind_deg',
        icon: WiWindDeg,
        style: 'green'
    },
    {
        type: 'precipitation',
        icon: WiFlood,
        style: 'darkblue'
    },
    {
        type: 'illumination',
        icon: WiDaySunny,
        style: 'orange'
    },
    {
        type: 'uvindex',
        icon: WiHot,
        style: 'yellow'
    },
    {
        type: 'undefined',
        icon: WiNa,
        style: 'brown'
    }
]

const TrendValue = (trend: number) =>
    <div className='trend'>
        {trend > 0 && <IoIosArrowRoundUp className='up' />}
        {trend < 0 && <IoIosArrowRoundDown className='down' />}
        {trend}
    </div>

const Sensor: React.FC<TSensorProps> = (props) => {
    const { data } = props
    const language = useAppSelector(state => state.language.translate)
    const meta = SensorsMeta.filter(obj => obj.type === data.type).pop()
    const SensorIcon: any = meta?.icon

    return (
        <div className={`box sensor ${meta?.style}`}>
            <div className='title'>{language.sensors[data.type].name}</div>
            <div className='main'>
                <div className='value'>
                    {data.value} {language.sensors[data.type].sign && <span className='sign'>{language.sensors[data.type].sign}</span>}
                </div>
                <SensorIcon className='icon' />
            </div>
            <div className='info'>
                <div>{data.trend ? TrendValue(data.trend) : '\u00A0'}</div>
                <div>{typeof data.max !== 'undefined' ? <>max: {data.max}</> : '\u00A0'}</div>
                <div>{typeof data.min !== 'undefined' ? <>min: {data.min}</> : '\u00A0'}</div>
            </div>
        </div>
    )
}

export default Sensor
