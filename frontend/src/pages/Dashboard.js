import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Grid } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'

import Sensor from '../layouts/Sensor'
import Chart from '../layouts/Chart'

import temphumd from '../charts/temphumd'
import luxpress from '../charts/luxpress'
import kindex from '../charts/kindex'
import windspeed from '../charts/windspeed'

import moment from 'moment'
import sensors from '../data/sensors'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Dashboard extends Component {

    componentDidMount() {

        const { dispatch, storeStatistic } = this.props

        let last_update = (! _.isEmpty(storeStatistic) ? moment().unix() - storeStatistic.update : null)

        if (last_update === null || (last_update < -180 || last_update > 180))
            dispatch(meteoActions.fetchDataStatistic())

        dispatch(meteoActions.fetchDataKIndex())
    }

    render() {
        const { storeSummary, storeStatistic, storeKIndex } = this.props

        return (
            <MainContainer
                updateTime={storeSummary.update}
                title='Датчики'
            >
                <Container>
                    <Grid>
                        {sensors.map((item, key) =>
                            <Sensor
                                key={key}
                                widget={item}
                                data={! _.isEmpty(storeSummary) ? storeSummary.data[item.source] : []}
                            />
                        )}
                    </Grid>
                    <Grid>
                        <Grid.Column computer={8} tablet={16} mobile={16} className='chart-container'>
                            <Chart
                                config={temphumd}
                                data={{
                                    humd: ! _.isEmpty(storeStatistic) ? storeStatistic.data.h : [],
                                    temp: ! _.isEmpty(storeStatistic) ? storeStatistic.data.t2 : []
                                }}
                            />
                        </Grid.Column>
                        <Grid.Column computer={8} tablet={16} mobile={16} className='chart-container'>
                            <Chart
                                config={windspeed}
                                data={{
                                    wspeed: ! _.isEmpty(storeStatistic) ? storeStatistic.data.ws : [],
                                }}
                            />
                        </Grid.Column>
                    </Grid>
                    <Grid>
                        <Grid.Column computer={10} tablet={8} mobile={16} className='chart-container'>
                            <Chart
                                config={luxpress}
                                data={{
                                    lux: ! _.isEmpty(storeStatistic) ? storeStatistic.data.lux : [],
                                    uv: ! _.isEmpty(storeStatistic) ? storeStatistic.data.uv : [],
                                    press: ! _.isEmpty(storeStatistic) ? storeStatistic.data.p : []
                                }}
                            />
                        </Grid.Column>
                        <Grid.Column computer={6} tablet={8} mobile={16} className='chart-container'>
                            <Chart
                                config={kindex}
                                data={{
                                    kindex: ! _.isEmpty(storeKIndex) ? storeKIndex.data : [],
                                }}
                            />
                        </Grid.Column>
                    </Grid>
                </Container>
            </MainContainer>
        )
    }
}

function mapStateToProps(state) {
    return {
        storeStatistic: state.meteostation.storeStatistic,
        storeSummary: state.meteostation.storeSummary,
        storeKIndex: state.meteostation.storeKIndexStat
    }
}

export default connect(mapStateToProps)(Dashboard)