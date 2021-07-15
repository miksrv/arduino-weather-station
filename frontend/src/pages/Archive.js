import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Grid } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import ChartHeatMap from '../layouts/ChartHeatMap'
import Extreme from '../layouts/Extreme'

import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Archive extends Component {

    componentDidMount() {
        const { dispatch, storeHeatMap } = this.props

        if (_.isEmpty(storeHeatMap))
            dispatch(meteoActions.fetchHeatMap())
    }

    componentWillUnmount() {
        const { dispatch } = this.props

        dispatch(meteoActions.clearHeatMap())
    }

    render() {
        const { storeHeatMap } = this.props

        return (
            <MainContainer
                updateTime={moment().unix()}
                title='Тепловая карта'
            >
                <Container>
                    <Grid>
                        <Extreme data={! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.max : []} type='max' />
                        <Extreme data={! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.min : []} type='min' />
                    </Grid>
                    <ChartHeatMap data={! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.chart : []} />
                </Container>
            </MainContainer>
        )
    }
}

function mapStateToProps(state) {
    return {
        storeHeatMap: state.meteostation.storeHeatMap
    }
}

export default connect(mapStateToProps)(Archive)