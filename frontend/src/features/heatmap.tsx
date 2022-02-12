import React, { useState, useEffect } from 'react'
import { setUpdate } from '../app/updateSlice'
import { useGetHeatmapQuery } from '../app/weatherApi'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { SensorTypes, TPeriod } from '../app/types'
import { declOfNum } from '../functions/helpers'
import { Helmet } from 'react-helmet'
// import { getUrlParameter } from '../functions/helpers'
import Toolbar from '../components/toolbar'
import Chart from '../components/chart'

import heatmap from '../charts/heatmap'
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

const Heatmap: React.FC = () => {
    const dispatch = useAppDispatch()
    const language = useAppSelector(state => state.language.translate)
    const sensors: SensorTypes[] = ['temperature']
    const [ period, onPeriodChange ] = useState([moment().subtract(31,'d'), moment()])
    const { data, isFetching } = useGetHeatmapQuery({
        start: moment(period[0]).format('YYYY-MM-DD'),
        end: moment(period[1]).format('YYYY-MM-DD'),
        sensors: sensors
    })

    let listPeriods: TPeriod[] = [
        { name: language.toolbar.periods.month, days: 31 },
        { name: language.toolbar.periods.quarter, days: 90 },
        { name: language.toolbar.periods.halfyear, days: 180 },
        { name: language.toolbar.periods.year, days: 365 }
    ]

    let days = period[1].diff(period[0], 'days')

    heatmap.subtitle.text = language.heatmap.subtitle + ' ' + days + ' ' + declOfNum(days, language.general.declining.days)

    useEffect(() => {
        dispatch(setUpdate(data?.timestamp))
    }, [dispatch, data, isFetching])

    return (
        <>
            <Helmet>
                <title>{language.pages.heatmap.title}</title>
                <meta name='description' content={language.pages.heatmap.description} />
            </Helmet>
            <Toolbar
                onChangeInterval={
                    (days: number) => onPeriodChange([moment().subtract(days,'d'), moment()])
                }
                onChangePeriod={(range: Date[]) =>
                    onPeriodChange([moment(range[0]), moment(range[1])])
                }
                rangeStart={period[0]}
                rangeEnd={period[1]}
                periods={listPeriods}
            />
            <Chart
                loader={isFetching}
                config={heatmap}
                data={[data?.payload]}
            />
        </>
    )
}

export default Heatmap
