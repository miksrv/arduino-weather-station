import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader, Grid, Button, Icon, Message } from 'semantic-ui-react'

import DateRangePicker from '@wojtekmaj/react-daterange-picker'
import MainContainer from '../components/MainContainer'
import FullStats from '../components/FullStats'

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
        let rangeStart = this.getUrlParameter('start'),
            rangeEnd   = this.getUrlParameter('end'),
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

    // http://localhost:3000/statistic?start=24.06.2021&end=30.06.2021
    getUrlParameter = (name) => {
        name = name.replace(/[\\[]/, '\\[').replace(/[\]]/, '\\]')
        let regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
        let results = regex.exec(window.location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
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
            // dateDiff = moment(range[0]).diff(moment(range[1]), 'days')

        // if (dateDiff > 0 || dateDiff < -31) {
        //     return this.setState({
        //         rangeStart: moment().subtract(1,'d'),
        //         rangeEnd: moment()
        //     })
        // }

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
        const { loader, rangeStart, rangeEnd } = this.state

        return (
            <MainContainer
                updateTime={moment().unix()}
                title='Статистика'
            >
                <Container>
                    <div className='toolBar'>
                        <Button.Group size='mini'>
                            <Button color='grey' onClick={() => this.changePeriod(1)}>Сутки</Button>
                            <Button color='grey' onClick={() => this.changePeriod(7)}>Неделя</Button>
                            <Button color='grey' onClick={() => this.changePeriod(30)}>Месяц</Button>
                        </Button.Group>
                        <DateRangePicker
                            className='range-calendar'
                            onChange={(v) => {this.handleDatePicker(v)}}
                            calendarIcon={<Icon name='calendar alternate outline' size='large' />}
                            minDate={new Date('2020-04-10')}
                            maxDate={new Date()}
                            locale='ru-RU'
                            clearIcon={null}
                            format='dd.MM.yyyy'
                            value={[
                                rangeStart._d,
                                rangeEnd._d
                            ]}
                        />&nbsp;
                        <Button
                            size='mini'
                            icon='download'
                            color='grey'
                            as='a'
                            href={`https://api.miksoft.pro/meteo/get/csv/?date_start=${rangeStart.format('YYYY-MM-DD')}&date_end=${rangeEnd.format('YYYY-MM-DD')}`}
                        />
                    </div>
                    {(storeStatistic.update === false) && (
                        <Message negative>
                            <Message.Header>Данные не найдены</Message.Header>
                            <p>За период с {rangeStart.format('YYYY-MM-DD')} по {rangeEnd.format('YYYY-MM-DD')} метеостанция не зафиксировала никаких данных. Пожалуйста, выберите другой период для вывода статистики.</p>
                        </Message>
                    )}
                    { (! _.isEmpty(storeStatistic) && ! _.isEmpty(storeStatistic.data) && ! loader) ? (
                        <FullStats
                            storeStatistic={storeStatistic}
                            onChangePeriod={this.changePeriod}
                        />
                    ) : (
                        <Grid>
                            <Grid.Column computer={16} tablet={16} mobile={16}>
                                <div className='informer' style={{height: 330}}>
                                    <Dimmer active>
                                        <Loader />
                                    </Dimmer>
                                </div>
                            </Grid.Column>
                            <Grid.Column computer={16} tablet={16} mobile={16}>
                                <div className='informer' style={{height: 330}}>
                                    <Dimmer active>
                                        <Loader />
                                    </Dimmer>
                                </div>
                            </Grid.Column>
                        </Grid>
                    )}
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