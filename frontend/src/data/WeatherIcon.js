/**
 * React weather icons: https://react-icons.netlify.com/#/icons/wi
 */

import React from 'react'
import { WiThunderstorm, WiRainMix, WiRain, WiSnowWind, WiFog, WiDaySunny, WiCloud, WiAlien, WiDayCloudy, WiDayCloudyHigh,
         WiDaySleet, WiDayShowers, WiDayRain, WiDayRainWind, WiSnow, WiNightSleet, WiNightShowers, WiNightRain,
         WiNightRainWind } from 'react-icons/wi'

const WeatherIcon = props => {
    switch (props.code.toString()[0]) {
        case '2': // Thunderstorm
            return <WiThunderstorm />

        case '3': // Drizzle
            return <WiRainMix />

        case '5': // Rain
            switch (props.code.toString()[1]) {
                case '0':
                    switch (props.code.toString()[2]) {
                        case '0': // light rain
                            return <WiDaySleet />
                        case '1': // moderate rain
                        case '2': // heavy intensity rain
                            return <WiDayShowers />
                        case '3': // very heavy rain
                            return <WiDayRain />
                        default: // extreme rain
                            return <WiDayRainWind />
                    }

                case '1': // freezing rain
                    return <WiSnow />

                case '2':
                    switch (props.code.toString()[2]) {
                        case '0': // light intensity shower rain
                            return <WiNightSleet />
                        case '1': // shower rain
                        case '2': // heavy intensity shower rain
                            return <WiNightShowers />
                        case '3': // very heavy rain
                            return <WiNightRain />
                        default: // ragged shower rain
                            return <WiNightRainWind />
                    }



                default:
                    return <WiRain />
            }

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