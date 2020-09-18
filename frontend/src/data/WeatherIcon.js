/**
 * React weather icons: https://react-icons.netlify.com/#/icons/wi
 */

import React from 'react'
import { WiThunderstorm, WiRainMix, WiRain, WiSnowWind, WiFog, WiDaySunny, WiCloud, WiAlien, WiDayCloudy, WiDayCloudyHigh } from 'react-icons/wi'

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

                case '2':
                case '3':
                    return <WiDayCloudy />

                case '4':
                    return <WiDayCloudyHigh />

                default:
                    return <WiCloud />
            }

        default:
            return <WiAlien />
    }
}

export default WeatherIcon