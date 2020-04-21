/**
 * React weather icons: https://react-icons.netlify.com/#/icons/wi
 */

import React  from 'react'

import { Grid } from 'semantic-ui-react'
import { WiThermometer, WiHumidity, WiBarometer, WiDaySunny, WiHot, WiRaindrops, WiSunrise, WiSunset, WiMoonrise, WiMoonset, WiWindDeg, WiStrongWind } from 'react-icons/wi'
import { IoIosArrowRoundUp, IoIosArrowRoundDown } from 'react-icons/io'

const Sensor = (params) => {

    const icons = {
        temp: WiThermometer,
        humd: WiHumidity,
        press: WiBarometer,
        light: WiDaySunny,
        uvindex: WiHot,
        dewpoint: WiRaindrops,
        sunrise: WiSunrise,
        sunset: WiSunset,
        moonrise: WiMoonrise,
        moonset: WiMoonset,
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
        <div className={'tile ' + params.widget.color}>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={5} className='icon-container'>
                        <WeatherIcon className='icon' />
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <div className='title'>{params.widget.name}</div>
                        <div className='value'>{params.data.value}</div>
                        {(params.widget.trend === true && params.data.trend !== 0 && (
                            <div className='trend'>
                                тренд: <TrendIcon className={(params.data.trend > 0 ? 'trend-up' : 'trend-down')} /> {params.data.trend > 0 ? '+' : ''} {params.data.trend}
                            </div>
                        ))}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
        </Grid.Column>
    )
}

export default Sensor