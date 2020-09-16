/**
 * The component displays summary weather statistics at the current time
 * (temperature, humidity, pressure, wind speed and direction)
 */

import React from 'react'

import { Grid } from 'semantic-ui-react'
import { WiDayCloudyHigh, WiStrongWind, WiBarometer, WiHumidity } from 'react-icons/wi'

const Summary = (props) => {
    const { dTemperature, dHumidity, dPressure, dWindSpeed, dWindDir, openWeatherData } = props

    console.log(openWeatherData);

    return (
        <Grid.Column computer={8} tablet={16} mobile={16}>
            <div className='informer summary'>
                <div className='background-overlay'>
                    <div className='background-image' style={{backgroundImage: 'url(/background/autumn-day.jpg)'}}></div>
                </div>
                <div className='content'>
                    <h1>Погодная станция</h1>
                    <h4>Оренбургская обл., c. Ивановка, ЖК "Приуралье"</h4>
                    <br />
                    <Grid>
                        <Grid.Row>
                            <Grid.Column computer={8} tablet={16} mobile={16}>
                                <Grid className='main-info'>
                                    <Grid.Column width={5} className='value'>
                                        {dTemperature > 0 && '+' || ''}{dTemperature}<span className='sign'>℃</span>
                                    </Grid.Column>
                                    <Grid.Column width={2} className='summary-icon'>
                                        <WiDayCloudyHigh className='icon-float' />
                                    </Grid.Column>
                                    <Grid.Column width={8} className='info'>
                                        <div>{openWeatherData.weather[0].description}</div>
                                        <div>Ощущается как <b>{openWeatherData.main.feels_like > 0 && '+' || ''}{Number((openWeatherData.main.feels_like).toFixed(0))}</b>℃</div>
                                    </Grid.Column>
                                </Grid>
                                <Grid className='second-info'>
                                    <Grid.Column width={3}>
                                        <WiHumidity className='icon' /> {dHumidity}%
                                    </Grid.Column>
                                    <Grid.Column width={6}>
                                        <WiBarometer className='icon' /> {dPressure} мм.рт.ст.
                                    </Grid.Column>
                                    <Grid.Column width={7}>
                                        <WiStrongWind className='icon' /> {dWindSpeed} м\с, {dWindDir}
                                    </Grid.Column>
                                </Grid>
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </div>
            </div>
        </Grid.Column>
    )
}

export default Summary