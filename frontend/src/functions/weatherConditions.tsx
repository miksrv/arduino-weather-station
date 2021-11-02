import React from 'react'
import { WiThunderstorm, WiRainMix, WiRain, WiSnowWind, WiFog, WiDaySunny, WiCloudy, WiAlien, WiDayCloudy,
    WiDaySleet, WiDayShowers, WiDayRain, WiDayRainWind, WiSnow, WiNightSleet, WiNightShowers, WiNightRain,
    WiNightRainWind } from 'react-icons/wi'

export const weatherConditions = (id: number | undefined) => {
    let conditions = {icon: <WiAlien />, name: ''}

    if (typeof id !== 'number') return conditions

    const stringID = id.toString()

    switch (stringID[0]) {
        case '2':
            conditions = {icon: <WiThunderstorm />, name: 'Thunderstorm'}
            break

        case '3':
            conditions = {icon: <WiRainMix />, name: 'Drizzle'}
            break

        case '5': // Rain
            switch (stringID[1]) {
                case '0':
                    switch (stringID[2]) {
                        case '0':
                            conditions = {icon: <WiDaySleet />, name: 'Light rain'}
                            break

                        case '1':
                        case '2':
                            conditions = {icon: <WiDayShowers />, name: 'Heavy intensity rain'}
                            break

                        case '3':
                            conditions = {icon: <WiDayRain />, name: 'Very heavy rain'}
                            break

                        default:
                            conditions = {icon: <WiDayRainWind />, name: 'Extreme rain'}
                            break
                    }
                    break

                case '1':
                    conditions = {icon: <WiSnow />, name: 'Freezing rain'}
                    break

                case '2':
                    switch (stringID[2]) {
                        case '0':
                            conditions = {icon: <WiNightSleet />, name: 'Light intensity shower rain'}
                            break

                        case '1': // shower rain
                        case '2':
                            conditions = {icon: <WiNightShowers />, name: 'Heavy intensity shower rain'}
                            break

                        case '3':
                            conditions = {icon: <WiNightRain />, name: 'Very heavy rain'}
                            break

                        default:
                            conditions = {icon: <WiNightRainWind />, name: 'Ragged shower rain'}
                            break
                    }
                    break

                default:
                    conditions = {icon: <WiRain />, name: 'Rain'}
                    break
            }
            break

        case '6':
            conditions = {icon: <WiSnowWind />, name: 'Snow'}
            break

        case '7':
            conditions = {icon: <WiFog />, name: 'Fog'}
            break

        case '8':
            switch (stringID[2]) {
                case '0':
                    conditions = {icon: <WiDaySunny />, name: 'Clear'}
                    break

                case '1':
                    conditions = {icon: <WiDayCloudy />, name: 'Clouds'}
                    break

                default:
                    conditions = {icon: <WiCloudy />, name: 'Clouds'}
                    break
            }
            break

        default:
            conditions = {icon: <WiCloudy />, name: 'Clouds'}
            break
    }

    return conditions
}

