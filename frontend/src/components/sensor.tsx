import React from 'react'
import { IoIosArrowRoundDown, IoIosArrowRoundUp } from 'react-icons/io'
import {
    WiBarometer,
    WiCloudy,
    WiDaySunny,
    WiFlood,
    WiHot,
    WiHumidity,
    WiNa,
    WiRaindrop,
    WiStrongWind,
    WiThermometer,
    WiWindDeg
} from 'react-icons/wi'

import { useAppSelector } from 'app/hooks'
import { ISensorItem, SensorTypes } from 'app/types'

type TSensorProps = {
    data: ISensorItem
}

type MetaInfoType = {
    type: SensorTypes | 'undefined'
    icon: React.ElementType
    style: string
}

const SensorsMeta: MetaInfoType[] = [
    {
        icon: WiThermometer,
        style: 'red',
        type: 'temperature'
    },
    {
        icon: WiRaindrop,
        style: 'lightblue',
        type: 'dewpoint'
    },
    {
        icon: WiThermometer,
        style: 'pink',
        type: 'feels_like'
    },
    {
        icon: WiHumidity,
        style: 'blue',
        type: 'humidity'
    },
    {
        icon: WiBarometer,
        style: 'purple',
        type: 'pressure'
    },
    {
        icon: WiCloudy,
        style: 'blue',
        type: 'clouds'
    },
    {
        icon: WiStrongWind,
        style: 'lime',
        type: 'wind_speed'
    },
    {
        icon: WiStrongWind,
        style: 'lime',
        type: 'wind_gust'
    },
    {
        icon: WiWindDeg,
        style: 'green',
        type: 'wind_deg'
    },
    {
        icon: WiFlood,
        style: 'darkblue',
        type: 'precipitation'
    },
    {
        icon: WiDaySunny,
        style: 'orange',
        type: 'illumination'
    },
    {
        icon: WiHot,
        style: 'yellow',
        type: 'uvindex'
    },
    {
        icon: WiNa,
        style: 'brown',
        type: 'undefined'
    }
]

const TrendValue = (trend: number) => (
    <div className='trend'>
        {trend > 0 && <IoIosArrowRoundUp className='up' />}
        {trend < 0 && <IoIosArrowRoundDown className='down' />}
        {trend}
    </div>
)

const Sensor: React.FC<TSensorProps> = (props) => {
    const { data } = props
    const language = useAppSelector((state) => state.language.translate)
    const meta = SensorsMeta.filter((obj) => obj.type === data.type).pop()
    const SensorIcon: any = meta?.icon

    return (
        <div className={`box sensor ${meta?.style}`}>
            <div className='title'>{language.sensors[data.type].name}</div>
            <div className='main'>
                <div className='value'>
                    {data.value}{' '}
                    {language.sensors[data.type].sign && (
                        <span className='sign'>
                            {language.sensors[data.type].sign}
                        </span>
                    )}
                </div>
                <SensorIcon className='icon' />
            </div>
            <div className='info'>
                <div>{data.trend ? TrendValue(data.trend) : '\u00A0'}</div>
                <div>
                    {typeof data.max !== 'undefined' ? (
                        <>max: {data.max}</>
                    ) : (
                        '\u00A0'
                    )}
                </div>
                <div>
                    {typeof data.min !== 'undefined' ? (
                        <>min: {data.min}</>
                    ) : (
                        '\u00A0'
                    )}
                </div>
            </div>
        </div>
    )
}

export default Sensor
