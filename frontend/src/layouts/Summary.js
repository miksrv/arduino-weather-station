import React from 'react'

import { Dimmer, Grid, Icon, Loader } from 'semantic-ui-react'
import { WiStrongWind, WiBarometer, WiHumidity } from 'react-icons/wi'
import WeatherIcon from '../data/WeatherIcon'
import getSeason from '../data/getSeason'

import _ from 'lodash'

const Summary = (props) => {
    const { storeSummary, openWeatherData } = props,
          currDate = new Date(),
          curHours = currDate.getHours(),
          dayTimes = (curHours > 7 && curHours < 21) ? 'd' : 'n',
          imgURL   = 'url(/background/' + getSeason() + '-' + dayTimes + '.jpg)'

    return (
        <Grid.Column computer={8} tablet={16} mobile={16}>
            <div className='informer summary'>
                {
                    _.isEmpty(storeSummary) && (
                        <Dimmer active>
                            <Loader />
                        </Dimmer>
                    )
                }
                <div className='background-overlay'>
                    <div className='background-image' style={{backgroundImage: imgURL}}></div>
                </div>
                <div className='content'>
                    <h1>Погодная станция</h1>
                    <h4>Оренбургская обл., c. Ивановка, ЖК "Приуралье"</h4>
                    <div className='main-info'>
                        <div className='value'>
                            {!_.isEmpty(storeSummary) ? (
                                (storeSummary.data.t2.value > 0 ? '+' : '') + storeSummary.data.t2.value
                            ) : (
                                <span>00.0</span>
                            )}
                            <span className='sign'>℃</span>
                        </div>
                        <div className='summary-icon'>
                            {!_.isEmpty(openWeatherData) ? (
                                <WeatherIcon code={openWeatherData.data[0].weather[0].id} daytime={openWeatherData.data[0].sys.pod}/>
                            ) : (
                                <WeatherIcon code={0} daytime={0}/>
                            )}
                        </div>
                        {!_.isEmpty(openWeatherData) && (
                            <div className='info'>
                                <div>{openWeatherData.data[0].weather[0].description}</div>
                                <div>Ощущается как <b>{openWeatherData.data[0].main.feels_like > 0 ? '+' : ''}{Number((openWeatherData.data[0].main.feels_like).toFixed(0))}</b>℃</div>
                            </div>
                        )}
                    </div>
                    <div className='second-info'>
                        <div>
                            <WiHumidity className='icon' />
                            {!_.isEmpty(storeSummary) ? (storeSummary.data.h.value) : (<Icon loading name='spinner' />)}%
                        </div>
                        <div>
                            <WiBarometer className='icon' />
                            {!_.isEmpty(storeSummary) ? (storeSummary.data.p.value) : (<Icon loading name='spinner' />)} мм.
                        </div>
                        <div>
                            <WiStrongWind className='icon' />
                            {!_.isEmpty(storeSummary) ? (
                                storeSummary.data.ws.value + ' м\\с ' + storeSummary.data.wd.info
                            ) : (<Icon loading name='spinner' />)}
                        </div>
                    </div>
                </div>
            </div>
        </Grid.Column>
    )
}

export default Summary