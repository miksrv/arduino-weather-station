import _ from 'lodash'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Grid, Loader } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import ShortStats from '../components/ShortStats'
import Sensor from '../layouts/Sensor'

import sensors from '../data/sensors'

import * as meteoActions from '../store/meteostation/actions'

import moment from 'moment'

class Dashboard extends Component {

    componentDidMount() {
        const { dispatch, storeStatistic } = this.props

        let last_update = (! _.isEmpty(storeStatistic) ? moment().unix() - storeStatistic.update : null)

        if (last_update === null || (last_update < -180 || last_update > 180))
            dispatch(meteoActions.fetchDataStatistic())
    }

    render() {
        const { storeSummary, storeStatistic } = this.props

        return (
            <MainContainer
                updateTime={storeSummary.update}
                title='Датчики'
            >
                <Container>
                    <Grid>
                        {sensors.map((item, key) => {
                            return (
                                <Sensor
                                    key={key}
                                    widget={item}
                                    data={! _.isEmpty(storeSummary) ? storeSummary.data[item.source] : []}
                                />
                            )
                        })}
                    </Grid>
                    { ! _.isEmpty(storeStatistic) ? (
                        <ShortStats
                            storeStatistic={storeStatistic}
                            onChangePeriod={this.changePeriod}
                        />
                    ) : (
                        <Grid>
                            <Grid.Column computer={8} tablet={16} mobile={16}>
                                <div className='informer' style={{height: 305}}>
                                    <Dimmer active>
                                        <Loader />
                                    </Dimmer>
                                </div>
                            </Grid.Column>
                            <Grid.Column computer={8} tablet={16} mobile={16}>
                                <div className='informer' style={{height: 305}}>
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
        storeStatistic: state.meteostation.storeStatistic,
        storeSummary: state.meteostation.storeSummary
    }
}

export default connect(mapStateToProps)(Dashboard)