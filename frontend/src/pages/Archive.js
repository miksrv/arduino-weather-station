import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Grid } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import Extreme from '../layouts/Extreme'
import Chart from '../layouts/Chart'

import heatmap from '../charts/heatmap'

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
                        <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>
                            <Extreme data={! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.max : []} type='max' />
                        </Grid.Column>
                        <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>
                            <Extreme data={! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.min : []} type='min' />
                        </Grid.Column>
                        <Grid.Column width={16} className='chart-container'>
                            <Chart
                                config={heatmap}
                                data={{
                                    heatmap: ! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.chart : []
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
        storeHeatMap: state.meteostation.storeHeatMap
    }
}

export default connect(mapStateToProps)(Archive)