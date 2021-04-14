import _ from 'lodash'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader, Grid, Button, Icon } from 'semantic-ui-react'

import DateRangePicker from '@wojtekmaj/react-daterange-picker'
import MainContainer from '../components/MainContainer'
import FullStats from '../components/FullStats'

import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

class Statistic extends Component {

    state = {
        loader: false,
        rangeStart: moment().subtract(1,'d').format('YYYY-MM-DD'),
        rangeEnd: moment().format('YYYY-MM-DD')
    }

    componentDidMount() {
        const { dispatch, storeStatistic } = this.props
        const { rangeStart, rangeEnd } = this.state

        let last_update = (! _.isEmpty(storeStatistic) ? moment().unix() - storeStatistic.update : null)

        if (last_update === null || (last_update < -180 || last_update > 180))
            dispatch(meteoActions.fetchDataStatistic(rangeStart, rangeEnd))
    }

    changePeriod = ( period ) => {
        const { dispatch } = this.props

        if ( period !== this.state.period ) {
            let rangeStart = moment().subtract(period,'d').format('YYYY-MM-DD'),
                rangeEnd   = moment().format('YYYY-MM-DD')

            this.setState({ loader: true, period, rangeStart, rangeEnd })

            dispatch(meteoActions.fetchDataStatistic(rangeStart, rangeEnd)).then(() => {
                this.setState({ loader: false })
            })
        }
    }

    handleDatePicker = range => {
        const { dispatch } = this.props

        this.setState({ loader: true })

        let rangeStart = moment(range[0]).format('YYYY-MM-DD'),
            rangeEnd = moment(range[1]).format('YYYY-MM-DD')

        this.setState({rangeStart, rangeEnd})

        dispatch(meteoActions.fetchDataStatistic(rangeStart, rangeEnd)).then(() => {
            this.setState({ loader: false })
        })
    }

    render() {
        const { storeStatistic } = this.props
        const { loader, rangeStart, rangeEnd } = this.state

        return (
            <MainContainer
                updateTime={moment().unix()}
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
                                rangeStart,
                                rangeEnd
                            ]}
                        />
                    </div>
                    { (! _.isEmpty(storeStatistic) && ! loader) ? (
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
        );
    }
}

function mapStateToProps(state) {
    return {
        storeStatistic: state.meteostation.storeStatistic
    }
}

export default connect(mapStateToProps)(Statistic)