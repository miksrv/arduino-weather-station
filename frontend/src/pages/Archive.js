import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Grid } from 'semantic-ui-react'
import { declOfNum } from '../data/functions'

import MainContainer from '../components/MainContainer'
import Extreme from '../layouts/Extreme'
import Chart from '../layouts/Chart'
import Toolbar from '../layouts/Toolbar'

import heatmap from '../charts/heatmap'
import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Archive extends Component {

    state = {
        loader: false,
        rangeStart: moment().subtract(4,'months'),
        rangeEnd: moment()
    }

    componentDidMount() {
        const { dispatch, storeHeatMap } = this.props
        const { rangeStart, rangeEnd } = this.state

        if (_.isEmpty(storeHeatMap))
            dispatch(meteoActions.fetchHeatMap(
                moment(rangeStart).format('YYYY-MM-DD'),
                moment(rangeEnd).format('YYYY-MM-DD')
            ))
    }

    componentWillUnmount() {
        const { dispatch } = this.props

        dispatch(meteoActions.clearHeatMap())
    }

    changePeriod = period => {}

    handleDatePicker = range => {
        const { dispatch } = this.props

        let rangeStart = moment(range[0]),
            rangeEnd = moment(range[1])

        this.setState({
            rangeStart,
            rangeEnd,
            loader: true
        })

        dispatch(meteoActions.fetchHeatMap(rangeStart.format('YYYY-MM-DD'), rangeEnd.format('YYYY-MM-DD'))).then(() => {
            this.setState({ loader: false })
        })
    }

    render() {
        const { storeHeatMap } = this.props
        const { rangeStart, rangeEnd, loader } = this.state

        if (! _.isEmpty(storeHeatMap.data)) {
            let days = rangeEnd.diff(rangeStart, 'days')

            heatmap.colorAxis.max = storeHeatMap.data.max.val
            heatmap.colorAxis.min = storeHeatMap.data.min.val
            heatmap.subtitle.text = heatmap.subtitle.text + days + ' ' + declOfNum(days, ['день', 'дня', 'дней'])
        }

        return (
            <MainContainer
                updateTime={moment().unix()}
                title='Тепловая карта'
            >
                <Container>
                    <Toolbar
                        changePeriod={(period) => this.changePeriod(period)}
                        changeData={(range) => this.handleDatePicker(range)}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                    />
                    <Grid>
                        <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>
                            <Extreme data={! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.max : []} type='max' />
                        </Grid.Column>
                        <Grid.Column computer={8} tablet={8} mobile={16} className='chart-container'>
                            <Extreme data={! _.isEmpty(storeHeatMap.data) ? storeHeatMap.data.min : []} type='min' />
                        </Grid.Column>
                        <Grid.Column width={16} className='chart-container'>
                            <Chart
                                loader={loader}
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