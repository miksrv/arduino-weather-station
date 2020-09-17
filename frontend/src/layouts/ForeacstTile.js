import React from 'react'

import { Grid } from 'semantic-ui-react'

import moment from 'moment'
import valueColor from '../data/valueColor'
import WeatherIcon from '../data/WeatherIcon'

/**
 * 200, 201, 202 WiDaySnowThunderstorm
 * 210, 211, 212
 */

const ForeacstTile = (props) => {
    const { data } = props

    return (
        <Grid className='forecast-list'>
            <Grid.Row>
                {data.map((item, key) => (
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

export default ForeacstTile