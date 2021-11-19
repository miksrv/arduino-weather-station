import React, { useState, useEffect } from 'react'
import { setUpdate } from '../app/updateSlice'
import { useGetStatisticQuery } from '../app/weatherApi'
import { useAppDispatch } from '../app/hooks'
import { SensorTypes } from '../app/types'
// import { getUrlParameter } from '../functions/helpers'
import Toolbar from '../components/toolbar'
import Chart from '../components/chart'

import moment from 'moment'

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
    const sensors: SensorTypes[] = ['temperature', 'humidity']
    const [period, onPeriodChange] = useState([moment().subtract(1,'d'), moment()]);
    const { data, isSuccess, isLoading } = useGetStatisticQuery({
        start: moment(period[0]).format('YYYY-MM-DD'),
        end: moment(period[1]).format('YYYY-MM-DD'),
        sensors: sensors
    })

    useEffect(() => {
        dispatch(setUpdate(data?.timestamp))
    }, [dispatch, data])

    const temphumd = {
        xAxis: [{
            type: 'datetime',
            dateTimeLabelFormats: {
                month: '%e %b, %Y',
                year: '%b'
            },
            gridLineWidth: 1
        }],
        yAxis: [{
            labels: {
                format: '{value}°C',
                style: {
                    // color: Highcharts.theme.colors[7]
                }
            },
            title: {
                text: '', // Температура
                style: {
                    // color: Highcharts.theme.colors[7]
                }
            },
            opposite: false,
        }, {
            gridLineWidth: 0,
            title: {
                text: '', // Влажность
                style: {
                    // color: Highcharts.theme.colors[6]
                }
            },
            labels: {
                format: '{value} %',
                style: {
                    // color: Highcharts.theme.colors[6]
                }
            },
            opposite: true,
            min: 0,
            max: 90,
        }],
        series: [{
            name: 'Влажность',
            type: 'area',
            yAxis: 1,
            // color: Highcharts.theme.colors[6],
            data: data?.payload.humidity,
            tooltip: {
                valueSuffix: ' %'
            }
        }, {
            name: 'Температура',
            type: 'spline',
            yAxis: 0,
            data: data?.payload.temperature,
            // color: Highcharts.theme.colors[7],
            tooltip: {
                valueSuffix: ' °C'
            }
        }]
    }

    return (
        <>
            <Toolbar
                onChangeInterval={
                    (days: number) => onPeriodChange([moment().subtract(days,'d'), moment()])
                }
                onChangePeriod={(range: Date[]) =>
                    onPeriodChange([moment(range[0]), moment(range[1])])
                }
                rangeStart={period[0]}
                rangeEnd={period[1]}
                download
            />
            <Chart
                loader={isLoading}
                config={temphumd}
            />
        </>
    )
}

export default Statistic
