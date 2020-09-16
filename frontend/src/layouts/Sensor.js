/**
 * React weather icons: https://react-icons.netlify.com/#/icons/wi
 */

import React  from 'react'

import { Grid } from 'semantic-ui-react'
import { WiThermometer, WiHumidity, WiBarometer, WiDaySunny, WiHot, WiRaindrops, WiWindDeg, WiStrongWind } from 'react-icons/wi'
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from 'react-icons/io'

const Sensor = (params) => {

    const icons = {
        temp: WiThermometer,
        humd: WiHumidity,
        press: WiBarometer,
        light: WiDaySunny,
        uvindex: WiHot,
        dewpoint: WiRaindrops,
        windir: WiWindDeg,
        winspeed: WiStrongWind
    };

    const trend = {
        up: IoIosArrowRoundUp,
        down: IoIosArrowRoundDown
    }

    const WeatherIcon = icons[params.widget.icon]
    const TrendIcon  = params.data.trend > 0 ? trend['up'] : trend['down']

    return (
        <Grid.Column computer={4} tablet={8} mobile={16}>
            <div className={'informer ' + params.widget.color}>
                <div className='title'>{params.widget.name}</div>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={9} className='icon-container'>
                            <div className='value'>{params.data.value}
                                {(typeof params.widget.sign !== 'undefined' && (
                                    <span className='sign'>{params.widget.sign}</span>
                                ))}
                            </div>
                        </Grid.Column>
                        <Grid.Column width={7}>
                            <WeatherIcon className='icon' />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
                <Grid className='grid-info'>
                    <Grid.Row>
                        <Grid.Column width={6} className='icon-container'>
                            {(typeof params.data.info !== 'undefined' && (
                                <div className='info'>({params.data.info})</div>
                            ))}
                            {(params.widget.trend === true && params.data.trend !== 0 && (
                                <div className='trend'>
                                    <TrendIcon className={(params.data.trend > 0 ? 'trend-up' : 'trend-down')} /> {params.data.trend > 0 ? '+' : ''} {params.data.trend}
                                </div>
                            ))}
                        </Grid.Column>
                        <Grid.Column width={5}>
                            {(typeof params.data.max !== 'undefined' && (
                                <div className='maxmin'>max: {params.data.max}</div>
                            ))}
                        </Grid.Column>
                        <Grid.Column width={5}>
                            {(typeof params.data.min !== 'undefined' && (
                                <div className='maxmin'>min: {params.data.min}</div>
                            ))}
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        </Grid.Column>
    )
}

export default Sensor