import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Grid, Message } from 'semantic-ui-react'

import { useAppDispatch, useAppSelector } from 'app/hooks'
import { SensorTypes } from 'app/types'
import { setUpdate } from 'app/updateSlice'
import { useGetStatisticQuery, useGetWindRoseQuery } from 'app/weatherApi'

// import { getUrlParameter } from '../functions/helpers'
import clouds_pressure from '../charts/clouds_pressure'
import humidity_temperature from '../charts/humidity_temperature'
import wind_speed from '../charts/wind_speed'
import windrose from '../charts/windrose'
import Chart from '../components/chart'
import Toolbar from '../components/toolbar'

// const getDateFromUrl = () => {
//     let rangeStart = getUrlParameter('start'),
//         rangeEnd   = getUrlParameter('end'),
//         response   = {
//             urlStart: null,
//             urlEnd: null
//         }
//
//     if (!rangeStart || !rangeEnd) return response
//
//     rangeStart = moment(rangeStart, 'DD-MM-YYYY')
//     rangeEnd   = moment(rangeEnd, 'DD-MM-YYYY')
//
//     let diff = rangeStart.diff(rangeEnd, 'days')
//
//     if (
//         ! moment(rangeStart).isAfter('2020-04-10') ||
//         ! moment(rangeEnd).isBefore(moment()) ||
//         (diff > 0 || diff < -31)
//     ) return response
//
//     response.urlStart = rangeStart
//     response.urlEnd   = rangeEnd
//
//     this.setState({rangeStart: response.urlStart, rangeEnd: response.urlEnd})
//
//     return response
// }

const Statistic: React.FC = () => {
    const dispatch = useAppDispatch()
    const [period, onPeriodChange] = useState([
        moment().subtract(1, 'd'),
        moment()
    ])
    const language = useAppSelector((state) => state.language.translate)
    const sensors: SensorTypes[] = [
        'temperature',
        'humidity',
        'clouds',
        'pressure',
        'precipitation',
        'wind_speed',
        'wind_deg'
    ]

    const { data, isFetching, isError } = useGetStatisticQuery({
        end: moment(period[1]).format('YYYY-MM-DD'),
        sensors: sensors,
        start: moment(period[0]).format('YYYY-MM-DD')
    })
    const { data: DataWR, isFetching: loadWR } = useGetWindRoseQuery({
        end: moment(period[1]).format('YYYY-MM-DD'),
        start: moment(period[0]).format('YYYY-MM-DD')
    })

    useEffect(() => {
        dispatch(setUpdate(data?.timestamp))
    }, [dispatch, data, isFetching, isError])

    return (
        <>
            <Helmet>
                <title>{language.pages.statistic.title}</title>
                <meta
                    name='description'
                    content={language.pages.statistic.description}
                />
            </Helmet>
            <Toolbar
                onChangeInterval={(days: number) =>
                    onPeriodChange([moment().subtract(days, 'd'), moment()])
                }
                onChangePeriod={(range: Date[]) =>
                    onPeriodChange([moment(range[0]), moment(range[1])])
                }
                rangeStart={period[0]}
                rangeEnd={period[1]}
                download
            />
            {!isError ? (
                <Grid>
                    <Grid.Column width={16}>
                        <Chart
                            loader={isFetching}
                            config={humidity_temperature}
                            data={[
                                data?.payload.humidity,
                                data?.payload.temperature
                            ]}
                        />
                    </Grid.Column>
                    <Grid.Column width={16}>
                        <Chart
                            loader={isFetching}
                            config={clouds_pressure}
                            data={[
                                data?.payload.clouds,
                                data?.payload.precipitation,
                                data?.payload.pressure
                            ]}
                        />
                    </Grid.Column>
                    <Grid.Column
                        computer={7}
                        mobile={16}
                    >
                        <Chart
                            loader={loadWR}
                            config={windrose}
                            data={[DataWR?.payload]}
                            windRose
                        />
                    </Grid.Column>
                    <Grid.Column
                        computer={9}
                        mobile={16}
                    >
                        <Chart
                            loader={isFetching}
                            config={wind_speed}
                            data={[
                                data?.payload.wind_speed,
                                data?.payload.wind_deg
                            ]}
                        />
                    </Grid.Column>
                </Grid>
            ) : (
                <Message negative>
                    <Message.Header>
                        {language.general.error.title}
                    </Message.Header>
                    <p>{language.general.error.description}</p>
                </Message>
            )}
        </>
    )
}

export default Statistic
