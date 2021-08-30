import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Message } from 'semantic-ui-react'
import { getUrlParameter } from '../data/functions' // createWindRose

import MainContainer from '../components/MainContainer'

import Chart from '../layouts/Chart'
import Toolbar from '../layouts/Toolbar';

import temphumdwind from '../charts/temphumdwind'
import luxpress from '../charts/luxpress'
// import winddir from '../data/winddir'
// import windrose from '../data/windrose'

import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Statistic extends Component {

    state = {
        loader: false,
        rangeStart: moment().subtract(1,'d'),
        rangeEnd: moment()
    }

    componentDidMount() {
        const { dispatch, storeStatistic } = this.props
        const { rangeStart, rangeEnd } = this.state
        const { urlStart, urlEnd } = this.getDateFromUrl()

        let last_update = (! _.isEmpty(storeStatistic) ? moment().unix() - storeStatistic.update : null)

        if (last_update === null || (last_update < -180 || last_update > 180))
            dispatch(meteoActions.fetchDataStatistic(
                moment(urlStart ? urlStart : rangeStart).format('YYYY-MM-DD'),
                moment(urlEnd ? urlEnd : rangeEnd).format('YYYY-MM-DD')
            ))
    }

    getDateFromUrl = () => {
        let rangeStart = getUrlParameter('start'),
            rangeEnd   = getUrlParameter('end'),
            response   = {
                urlStart: null,
                urlEnd: null
            }

        if (_.isEmpty(rangeStart) || _.isEmpty(rangeEnd)) return response

        rangeStart = moment(rangeStart, 'DD-MM-YYYY')
        rangeEnd   = moment(rangeEnd, 'DD-MM-YYYY')

        let diff = rangeStart.diff(rangeEnd, 'days')

        if (
            ! moment(rangeStart).isAfter('2020-04-10') ||
            ! moment(rangeEnd).isBefore(moment()) ||
            (diff > 0 || diff < -31)
        ) return response

        response.urlStart = rangeStart
        response.urlEnd   = rangeEnd

        this.setState({rangeStart: response.urlStart, rangeEnd: response.urlEnd})

        return response
    }

    changePeriod = period => {
        const { dispatch } = this.props

        if ( period !== this.state.period ) {
            let rangeStart = moment().subtract(period,'d'),
                rangeEnd   = moment()

            this.setState({ loader: true, period, rangeStart, rangeEnd })

            dispatch(meteoActions.fetchDataStatistic(rangeStart.format('YYYY-MM-DD'), rangeEnd.format('YYYY-MM-DD'))).then(() => {
                this.setState({ loader: false })
            })
        }
    }

    handleDatePicker = range => {
        const { dispatch } = this.props

        let rangeStart = moment(range[0]),
            rangeEnd = moment(range[1])

        this.setState({
            rangeStart,
            rangeEnd,
            loader: true
        })

        dispatch(meteoActions.fetchDataStatistic(rangeStart.format('YYYY-MM-DD'), rangeEnd.format('YYYY-MM-DD'))).then(() => {
            this.setState({ loader: false })
        })
    }

    render() {
        const { storeStatistic } = this.props
        const { rangeStart, rangeEnd, loader } = this.state

        return (
            <MainContainer
                updateTime={moment().unix()}
                title='Статистика'
            >
                <Container>
                    <Toolbar
                        changePeriod={(period) => this.changePeriod(period)}
                        changeData={(range) => this.handleDatePicker(range)}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        csvbutton
                    />
                    {(storeStatistic.update === false) && (
                        <Message negative>
                            <Message.Header>Данные не найдены</Message.Header>
                            <p>За период с {rangeStart.format('YYYY-MM-DD')} по {rangeEnd.format('YYYY-MM-DD')} метеостанция не зафиксировала никаких данных. Пожалуйста, выберите другой период для вывода статистики.</p>
                        </Message>
                    )}
                    <Chart
                        loader={loader}
                        config={temphumdwind}
                        data={{
                            humd: ! _.isEmpty(storeStatistic) ? storeStatistic.data.h : [],
                            temp: ! _.isEmpty(storeStatistic) ? storeStatistic.data.t2 : [],
                            dewp: ! _.isEmpty(storeStatistic) ? storeStatistic.data.dp : [],
                            wind: ! _.isEmpty(storeStatistic) ? storeStatistic.data.ws : []
                        }}
                    />
                    <br />
                    <Chart
                        loader={loader}
                        config={luxpress}
                        data={{
                            lux: ! _.isEmpty(storeStatistic) ? storeStatistic.data.lux : [],
                            uv: ! _.isEmpty(storeStatistic) ? storeStatistic.data.uv : [],
                            press: ! _.isEmpty(storeStatistic) ? storeStatistic.data.p : []
                        }}
                    />
                    {/*<br />*/}
                    {/*<Grid>*/}
                    {/*    <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>*/}
                    {/*        <Chart*/}
                    {/*            _config={winddir}*/}
                    {/*            data={{*/}
                    {/*                winddir: ! _.isEmpty(storeStatistic) ? storeStatistic.data.wd : [],*/}
                    {/*            }}*/}
                    {/*        />*/}
                    {/*    </Grid.Column>*/}
                    {/*    <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>*/}
                    {/*        <Chart*/}
                    {/*            _config={windrose}*/}
                    {/*            data={! _.isEmpty(storeStatistic) ? this.createWindRose(storeStatistic.data.wr) : []}*/}
                    {/*        />*/}
                    {/*    </Grid.Column>*/}
                    {/*</Grid>*/}
                </Container>
            </MainContainer>
        )
    }
}

function mapStateToProps(state) {
    return {
        storeStatistic: state.meteostation.storeStatistic
    }
}

export default connect(mapStateToProps)(Statistic)