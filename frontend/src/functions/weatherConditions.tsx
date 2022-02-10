import React from 'react'
import translate from './translate'
import { WiThunderstorm, WiRainMix, WiRain, WiSnowWind, WiFog, WiDaySunny, WiCloud, WiCloudy, WiAlien, WiDayCloudy,
    WiDaySleet, WiDayShowers, WiDayRain, WiDayRainWind, WiSnow, WiNightSleet, WiNightShowers } from 'react-icons/wi'

export const weatherConditions = (id: number | undefined) => {
    let conditions = {icon: <WiAlien />, name: ''}

    if (typeof id !== 'number') return conditions

    const stringID = id.toString()
    const lang = translate().weather.conditions

    switch (stringID[0]) {
        case '2':
            conditions = {name: lang.id200, icon: <WiThunderstorm />}
            break

        case '3':
            conditions = {name: lang.id300, icon: <WiRainMix />}
            break

        case '5': // Rain
            switch (stringID[1]) {
                case '0':
                    switch (stringID[2]) {
                        case '0':
                            conditions = {name: lang.id500, icon: <WiDaySleet />}
                            break

                        case '1':
                        case '2':
                            conditions = {name: lang.id502, icon: <WiDayShowers />}
                            break

                        case '3':
                            conditions = {name: lang.id503, icon: <WiDayRain />}
                            break

                        default:
                            conditions = {name: lang.id504, icon: <WiDayRainWind />}
                            break
                    }
                    break

                case '1':
                    conditions = {name: lang.id511, icon: <WiSnow />}
                    break

                case '2':
                    switch (stringID[2]) {
                        case '0':
                            conditions = {name: lang.id520, icon: <WiNightSleet />}
                            break

                        default:
                            conditions = conditions = {name: lang.id522, icon: <WiNightShowers />}
                            break
                    }
                    break

                default:
                    conditions = {name: lang.id500, icon: <WiRain />}
                    break
            }
            break

        case '6':
            conditions = {name: lang.id600, icon: <WiSnowWind />}
            break

        case '7':
            conditions = {name: lang.id741, icon: <WiFog />}
            break

        case '8':
            switch (stringID[2]) {
                case '0':
                    conditions = {name: lang.id800, icon: <WiDaySunny />}
                    break

                case '1':
                    conditions = {name: lang.id801, icon: <WiDaySunny />}
                    break

                case '2':
                    conditions = {name: lang.id802, icon: <WiDayCloudy />}
                    break

                case '3':
                    conditions = {name: lang.id803, icon: <WiCloud />}
                    break

                default:
                    conditions = {name: lang.id804, icon: <WiCloudy />}
                    break
            }
            break

        default:
            conditions = {name: lang.id801, icon: <WiDayCloudy />}
            break
    }

    return conditions
}
