import React from 'react'
import translate from '../functions/translate'
import { ISensorItem, SensorTypes } from '../app/types'
import { WiThermometer, WiHumidity, WiBarometer, WiDaySunny, WiFlood, WiCloudy, WiWindDeg, WiStrongWind, WiHot, WiNa, WiRaindrop } from 'react-icons/wi'
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from 'react-icons/io'

const lang = translate().sensors

type SensorProps = {
    data: ISensorItem,
}

type MetaInfoType = {
    type: SensorTypes | undefined,
    name: string,
    sign: string,
    icon: React.ElementType,
    style: string,
}

const SensorsMeta:MetaInfoType[] = [
    {
        type: 'temperature',
        name: lang.temperature.name,
        sign: lang.temperature.sign,
        icon: WiThermometer,
        style: 'red'
    },
    {
        type: 'dewpoint',
        name: lang.dewpoint.name,
        sign: lang.dewpoint.sign,
        icon: WiRaindrop,
        style: 'lightblue'
    },
    {
        type: 'feels_like',
        name: lang.feels_like.name,
        sign: lang.feels_like.sign,
        icon: WiThermometer,
        style: 'pink'
    },
    {
        type: 'humidity',
        name: lang.humidity.name,
        sign: lang.humidity.sign,
        icon: WiHumidity,
        style: 'blue'
    },
    {
        type: 'pressure',
        name: lang.pressure.name,
        sign: lang.pressure.sign,
        icon: WiBarometer,
        style: 'purple'
    },
    {
        type: 'clouds',
        name: lang.clouds.name,
        sign: lang.clouds.sign,
        icon: WiCloudy,
        style: 'blue'
    },
    {
        type: 'wind_speed',
        name: lang.wind_speed.name,
        sign: lang.wind_speed.sign,
        icon: WiStrongWind,
        style: 'lime'
    },
    {
        type: 'wind_gust',
        name: lang.wind_gust.name,
        sign: lang.wind_gust.sign,
        icon: WiStrongWind,
        style: 'lime'
    },
    {
        type: 'wind_deg',
        name: lang.wind_deg.name,
        sign: lang.wind_deg.sign,
        icon: WiWindDeg,
        style: 'green'
    },
    {
        type: 'precipitation',
        name: lang.precipitation.name,
        sign: lang.precipitation.sign,
        icon: WiFlood,
        style: 'darkblue'
    },
    {
        type: 'illumination',
        name: lang.illumination.name,
        sign: lang.illumination.sign,
        icon: WiDaySunny,
        style: 'orange'
    },
    {
        type: 'uvindex',
        name: lang.uvindex.name,
        sign: lang.uvindex.sign,
        icon: WiHot,
        style: 'yellow'
    },
    {
        type: undefined,
        name: lang.undefined.name,
        sign: lang.undefined.sign,
        icon: WiNa,
        style: 'brown'
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
    const meta = SensorsMeta.filter(obj => obj.type === data.type).pop() || SensorsMeta.filter(obj => obj.type === undefined).pop()
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
                <div>{data.trend ? TrendValue(data.trend) : '\u00A0'}</div>
                <div>{typeof data.max !== 'undefined' ? <>max: {data.max}</> : '\u00A0'}</div>
                <div>{typeof data.min !== 'undefined' ? <>min: {data.min}</> : '\u00A0'}</div>
            </div>
        </div>
    )
}

export default Sensor
