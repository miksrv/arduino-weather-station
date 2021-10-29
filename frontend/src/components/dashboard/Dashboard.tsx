import React from 'react'
import { Dimmer, Grid, Icon, Loader } from 'semantic-ui-react'
import { WiStrongWind, WiBarometer, WiHumidity } from 'react-icons/wi'

import { useGetSummaryQuery } from '../../api/weather'

const Dashboard: React.FC = () => {
    const { data, isLoading, isSuccess } = useGetSummaryQuery(null)

    const getImageByDate = () => {
        const curHours = new Date().getHours()
        const dayTimes = (curHours > 7 && curHours < 21) ? 'd' : 'n'

        return 'url(/background/autumn-' + dayTimes + '.jpg)'
    }

    return (
        <Grid.Column computer={8} tablet={16} mobile={16}>
            <div className='informer summary'>
                {isLoading && (<Dimmer active><Loader /></Dimmer>)}
                <div className='background-overlay'>
                    <div className='background-image' style={{backgroundImage: getImageByDate()}}></div>
                </div>
                <div className='content'>
                    <h1>Погодная станция</h1>
                    <h4>Оренбургская обл., c. Ивановка, ЖК "Приуралье"</h4>
                    <div className='main-info'>
                        <div className='value'>
                            {isSuccess ? data?.payload.temperature : (
                                <span>00.0</span>
                            )}
                            <span className='sign'>℃</span>
                        </div>
                        {isSuccess && (
                            <div className='info'>
                                <div>---</div>
                                <div>Ощущается как <b>{data?.payload.temperature_feels}</b>℃</div>
                            </div>
                        )}
                    </div>
                    <div className='second-info'>
                        <div>
                            <WiHumidity className='icon' />
                            {isSuccess ? (data?.payload.humidity) : (<Icon loading name='spinner' />)}%
                        </div>
                        <div>
                            <WiBarometer className='icon' />
                            {isSuccess ? (data?.payload.pressure) : (<Icon loading name='spinner' />)} мм.
                        </div>
                        <div>
                            <WiStrongWind className='icon' />
                            {isSuccess ? (
                                data?.payload.wind_speed + ' м\\с ' + data?.payload.wind_degree
                            ) : (<Icon loading name='spinner' />)}
                        </div>
                    </div>
                </div>
            </div>
        </Grid.Column>
    )
}

export default Dashboard
