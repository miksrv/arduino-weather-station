/**
 * The component displays summary weather statistics at the current time
 * (temperature, humidity, pressure, wind speed and direction)
 */

import React from 'react'

import { Grid } from 'semantic-ui-react'
import { WiStrongWind, WiBarometer, WiHumidity } from 'react-icons/wi'
import WeatherIcon from '../data/WeatherIcon'

const Summary = (props) => {
    const { dTemperature, dHumidity, dPressure, dWindSpeed, dWindDir, openWeatherData } = props
    const background = 'url(/background/autumn-' + openWeatherData.sys.pod + '.jpg)'

    return (
        <Grid.Column computer={8} tablet={16} mobile={16}>
            <div className='informer summary'>
                <div className='background-overlay'>
                    <div className='background-image' style={{backgroundImage: background}}></div>
                </div>
                <div className='content'>
                    <h1>Погодная станция</h1>
                    <h4>Оренбургская обл., c. Ивановка, ЖК "Приуралье"</h4>
                    <div className='main-info'>
                        <div className='value'>
                            {dTemperature > 0 ? '+' : ''}{dTemperature}<span className='sign'>℃</span>
                        </div>
                        <div className='summary-icon'>
                            <WeatherIcon code={openWeatherData.weather[0].id} daytime={openWeatherData.sys.pod}  />
                        </div>
                        <div className='info'>
                            <div>{openWeatherData.weather[0].description}</div>
                            <div>Ощущается как <b>{openWeatherData.main.feels_like > 0 ? '+' : ''}{Number((openWeatherData.main.feels_like).toFixed(0))}</b>℃</div>
                        </div>
                    </div>
                    <div className='second-info'>
                        <div>
                            <WiHumidity className='icon' /> {dHumidity}%
                        </div>
                        <div>
                            <WiBarometer className='icon' /> {dPressure} мм.
                        </div>
                        <div>
                            <WiStrongWind className='icon' /> {dWindSpeed} м\с, {dWindDir}
                        </div>
                    </div>
                </div>
            </div>
        </Grid.Column>
    )
}

export default Summary