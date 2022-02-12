import React, { useEffect } from 'react'
import { Dimmer, Grid, Icon, Loader } from 'semantic-ui-react'
import { WiStrongWind, WiBarometer, WiHumidity } from 'react-icons/wi'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { useGetSummaryQuery } from '../app/weatherApi'
import { degToCompass } from '../functions/helpers'
import { setUpdate } from '../app/updateSlice'
import { weatherConditions } from '../functions/weatherConditions'

const Dashboard: React.FC = () => {
    const dispatch = useAppDispatch()
    const language = useAppSelector(state => state.language.translate)
    const { data, isLoading, isSuccess } = useGetSummaryQuery(null, { pollingInterval: 60 * 1000 })
    const conditions = weatherConditions(data?.payload.condition_id, language.weather.conditions)

    const getImageByDate = () => {
        const curHours = new Date().getHours()
        const curMonth = new Date().getMonth() + 1
        const dayTimes = (curHours > 7 && curHours < 21) ? 'd' : 'n'

        let strMonth: string

        if (curMonth >= 12 || curMonth <= 2) {
            strMonth = 'winter'
        } else if (curMonth >= 3 || curMonth <= 5) {
            strMonth = 'spring'
        } else if (curMonth >= 6 || curMonth <= 8) {
            strMonth = 'summer'
        } else {
            strMonth = 'autumn'
        }

        return `url(/background/${strMonth}-${dayTimes}.jpg)`
    }

    useEffect(() => {
        dispatch(setUpdate(data?.timestamp))
    }, [dispatch, data])

    return (
        <Grid.Column computer={8} tablet={16} mobile={16}>
            <div className='informer summary'>
                {isLoading && (<Dimmer active><Loader /></Dimmer>)}
                <div className='background-overlay'>
                    <div className='background-image' style={{backgroundImage: getImageByDate()}}></div>
                </div>
                <div className='content'>
                    <h1>{language.dashboard.title}</h1>
                    <h4>{language.dashboard.subtitle}</h4>
                    <div className='main-info'>
                        <div className='value'>
                            {isSuccess ? data?.payload.temperature : (
                                <span>0.0</span>
                            )}
                            <span className='sign'>℃</span>
                        </div>
                        {isSuccess && (
                            <>
                                <div className='summary-icon'>
                                    {conditions.icon}
                                </div>
                                <div className='info'>
                                    <div>{conditions.name}</div>
                                    <div>{language.dashboard.feels_like} <b>{data?.payload.temperature_feels}</b>℃</div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className='second-info'>
                        <div>
                            <WiHumidity className='icon' />
                            {isSuccess ? (data?.payload.humidity) : (<Icon loading name='spinner' />)}%
                        </div>
                        <div>
                            <WiBarometer className='icon' />
                            {isSuccess ? (data?.payload.pressure) : (<Icon loading name='spinner' />)} {language.dashboard.pressure_sign}
                        </div>
                        <div>
                            <WiStrongWind className='icon' />
                            {isSuccess && (data?.payload.wind_speed || data?.payload.wind_speed === 0) ? (
                                data?.payload.wind_speed + ' м\\с ' + degToCompass(data?.payload.wind_degree, language.weather.wind_direction)
                            ) : (<Icon loading name='spinner' />)}
                        </div>
                    </div>
                </div>
            </div>
        </Grid.Column>
    )
}

export default Dashboard
