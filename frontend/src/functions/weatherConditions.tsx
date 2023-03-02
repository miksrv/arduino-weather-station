import React from 'react'
import {
    WiAlien,
    WiCloud,
    WiCloudy,
    WiDayCloudy,
    WiDayRain,
    WiDayRainWind,
    WiDayShowers,
    WiDaySleet,
    WiDaySunny,
    WiFog,
    WiNightShowers,
    WiNightSleet,
    WiRain,
    WiRainMix,
    WiSnow,
    WiSnowWind,
    WiThunderstorm
} from 'react-icons/wi'

export const weatherConditions = (id: number | undefined, lang: any) => {
    let conditions = { icon: <WiAlien />, name: '' }

    if (typeof id !== 'number') return conditions

    const stringID = id.toString()

    switch (stringID[0]) {
        case '2':
            conditions = { icon: <WiThunderstorm />, name: lang.id200 }
            break

        case '3':
            conditions = { icon: <WiRainMix />, name: lang.id300 }
            break

        case '5': // Rain
            switch (stringID[1]) {
                case '0':
                    switch (stringID[2]) {
                        case '0':
                            conditions = {
                                icon: <WiDaySleet />,
                                name: lang.id500
                            }
                            break

                        case '1':
                        case '2':
                            conditions = {
                                icon: <WiDayShowers />,
                                name: lang.id502
                            }
                            break

                        case '3':
                            conditions = {
                                icon: <WiDayRain />,
                                name: lang.id503
                            }
                            break

                        default:
                            conditions = {
                                icon: <WiDayRainWind />,
                                name: lang.id504
                            }
                            break
                    }
                    break

                case '1':
                    conditions = { icon: <WiSnow />, name: lang.id511 }
                    break

                case '2':
                    switch (stringID[2]) {
                        case '0':
                            conditions = {
                                icon: <WiNightSleet />,
                                name: lang.id520
                            }
                            break

                        default:
                            conditions = conditions = {
                                icon: <WiNightShowers />,
                                name: lang.id522
                            }
                            break
                    }
                    break

                default:
                    conditions = { icon: <WiRain />, name: lang.id500 }
                    break
            }
            break

        case '6':
            conditions = { icon: <WiSnowWind />, name: lang.id600 }
            break

        case '7':
            conditions = { icon: <WiFog />, name: lang.id741 }
            break

        case '8':
            switch (stringID[2]) {
                case '0':
                    conditions = { icon: <WiDaySunny />, name: lang.id800 }
                    break

                case '1':
                    conditions = { icon: <WiDaySunny />, name: lang.id801 }
                    break

                case '2':
                    conditions = { icon: <WiDayCloudy />, name: lang.id802 }
                    break

                case '3':
                    conditions = { icon: <WiCloud />, name: lang.id803 }
                    break

                default:
                    conditions = { icon: <WiCloudy />, name: lang.id804 }
                    break
            }
            break

        default:
            conditions = { icon: <WiDayCloudy />, name: lang.id801 }
            break
    }

    return conditions
}
