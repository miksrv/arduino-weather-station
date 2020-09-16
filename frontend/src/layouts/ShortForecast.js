import React from 'react'

import { Grid, Image } from 'semantic-ui-react'

import moment from 'moment'

import { WiThunderstorm, WiRainMix, WiRain, WiSnowWind, WiFog, WiDaySunny, WiCloud, WiAlien } from 'react-icons/wi'

/**
 * 200, 201, 202 WiDaySnowThunderstorm
 * 210, 211, 212
 */

const ShortForecast = (props) => {
    const { data } = props.data

    const WeatherIcon = props => {
        switch (props.code.toString()[0]) {
            case '2': // Thunderstorm
                return <WiThunderstorm />

            case '3': // Drizzle
                return <WiRainMix />

            case '5': // Rain
                return <WiRain />

            case '6': // Snow
                return <WiSnowWind />

            case '7': // Atmosphere
                return <WiFog />

            case '8': // Clear
                switch (props.code.toString()[2]) {
                    case '0':
                        return <WiDaySunny />

                    default:
                            return <WiCloud />
                }

            default:
                return <WiAlien />
        }
    }

    const valueColor = value => {
        let color = ''

        if (value >= -20 && value < -15) {
            color = 'value-15-20'
        } else if (value >= -15 && value < -10) {
            color = 'value-10-15'
        } else if (value >= -10 && value < -5) {
            color = 'value-5-10'
        } else if (value >= -5 && value < 0) {
            color = 'value-0-5'
        } else if (value >= 0 && value < 5) {
            color = 'value0-5'
        } else if (value >= 5 && value < 10) {
            color = 'value5-10'
        } else if (value >= 10 && value < 15) {
            color = 'value10-15'
        } else if (value >= 15 && value < 20) {
            color = 'value15-20'
        } else if (value >= 20 && value < 25) {
            color = 'value20-25'
        } else if (value >= 25 && value < 30) {
            color = 'value25-30'
        } else if (value >= 30 && value < 35) {
            color = 'value30-35'
        }

        return <span className={color}>{value}</span>
    }

    return (
        <Grid className='forecast-list'>
            <Grid.Row>
                {data.slice(0, 4).map((item, key) => (
                    <Grid.Column computer={4} tablet={8} mobile={8} key={key}>
                        <div className='forecast-tile'>
                            <div className='time'>
                                {moment.unix(item.dt).format("H:mm")}
                            </div>
                            <div className='date'>
                                {moment.unix(item.dt).format("ddd, DD MMM Y")}
                            </div>
                            <div className='desc'>
                                {item.weather[0].description}
                            </div>
                            <Grid>
                                <Grid.Column width={8} className='icon-container no-padding-bottom'>
                                    <div className='image'>
                                        <WeatherIcon code={item.weather[0].id} />
                                        {/*<Image src={'http://openweathermap.org/img/wn/' + item.weather[0].icon + '@2x.png'} />*/}
                                    </div>
                                </Grid.Column>
                                <Grid.Column width={8} className='value-container'>
                                    <div className='temp'>
                                        {valueColor(Number((item.main.temp).toFixed(0)))}<span className='sign'>℃</span>
                                    </div>
                                    <div className='wind'>
                                        {Number((item.wind.speed).toFixed(0))}<span className='sign'>м\с</span>
                                    </div>
                                </Grid.Column>
                            </Grid>
                        </div>
                    </Grid.Column>
                ))}
            </Grid.Row>
        </Grid>
    )
}

export default ShortForecast