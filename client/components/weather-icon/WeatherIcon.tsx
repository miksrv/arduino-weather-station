import React from 'react'

import Image from 'next/image'

import { getDate } from '@/tools/date'

const weatherIconsMapping: { [key: number]: string } = {
    200: 'thunderstorm-rain', // Thunderstorm with light rain
    201: 'thunderstorm-rain', // Thunderstorm with rain
    202: 'thunderstorm-rain', // Thunderstorm with heavy rain
    210: 'thunderstorm', // Light thunderstorm
    211: 'thunderstorm', // Thunderstorm
    212: 'thunderstorm', // Heavy thunderstorm
    221: 'thunderstorm', // Ragged thunderstorm
    230: 'thunderstorm-rain', // Thunderstorm with light drizzle
    231: 'thunderstorm-rain', // Thunderstorm with drizzle
    232: 'thunderstorm-rain', // Thunderstorm with heavy drizzle

    300: 'rain', // Light intensity drizzle
    301: 'rain', // Drizzle
    302: 'rain', // Heavy intensity drizzle
    310: 'rain', // Light intensity drizzle rain
    311: 'rain', // Drizzle rain
    312: 'rain', // Heavy intensity drizzle rain
    313: 'rain', // Shower rain and drizzle
    314: 'rain', // Heavy shower rain and drizzle
    321: 'rain', // Shower drizzle

    500: 'drizzle', // Light rain
    501: 'drizzle', // Moderate rain
    502: 'rain', // Heavy intensity rain
    503: 'rain', // Very heavy rain
    504: 'rain', // Extreme rain
    511: 'rain', // Freezing rain
    520: 'rain', // Light intensity shower rain
    521: 'rain', // Shower rain
    522: 'rain', // Heavy intensity shower rain
    531: 'rain', // Ragged shower rain

    600: 'snow', // Light snow
    601: 'snow', // Snow
    602: 'snow', // Heavy snow
    611: 'rain-snow', // Sleet
    612: 'rain-snow', // Light shower sleet
    613: 'rain-snow', // Shower sleet
    615: 'rain-snow', // Light rain and snow
    616: 'rain-snow', // Rain and snow
    620: 'rain-snow', // Light shower snow
    621: 'snow', // Shower snow
    622: 'snow', // Heavy shower snow
    701: 'fog', // Mist
    711: 'smoke', // Smoke
    721: 'haze', // Haze
    731: 'haze', // Sand/dust whirls
    741: 'fog', // Fog
    751: 'haze', // Sand
    761: 'haze', // Dust
    762: 'haze', // Volcanic ash
    771: 'hurricane', // Squalls
    781: 'hurricane', // Tornado
    800: 'clear', // Clear sky
    801: 'cloudy', // Few clouds: 11-25%
    802: 'cloudy', // Scattered clouds: 25-50%
    803: 'overcast', // Broken clouds: 51-84%
    804: 'overcast' // Overcast clouds: 85-100%
}

interface WeatherIconProps {
    weatherId: number
    date?: string
    width?: number
    height?: number
}

export const getWeatherIconUrl = (weatherId: number, date?: string): string => {
    const isDayTime = (date: string): boolean => {
        const hours = getDate(date).hour()

        return hours >= 6 && hours < 18 // Day from 6:00 to 18:00, the rest is night
    }

    // Here are weather conditions that are not divided into day and night
    const withoutDayIcon = ['hurricane']

    const name = weatherIconsMapping[weatherId]
    const time = !date || withoutDayIcon.includes(name) ? '' : isDayTime(date) ? '-day' : '-night'

    return `/icons/${name}${time}.svg`
}

const WeatherIcon: React.FC<WeatherIconProps> = ({ weatherId, date, width, height }) => {
    return (
        <Image
            src={getWeatherIconUrl(weatherId, date)}
            alt={''}
            width={width ?? 24}
            height={height ?? 24}
        />
    )
}

export default WeatherIcon
