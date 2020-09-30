import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader, Button } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import FullStats from '../components/FullStats'

import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Statistic extends Component {

    state = {
        loader: false,
        period: 'today'
    }

    componentDidMount() {
        const { dispatch } = this.props
        const { period } = this.state

        dispatch(meteoActions.fetchStatData(period))
    }

    changePeriod = ( period ) => {
        const { dispatch } = this.props

        if ( period !== this.state.period ) {
            this.setState({ loader: true, period })

            dispatch(meteoActions.fetchStatData(period)).then(() => {
                this.setState({ loader: false })
            });
        }
    }

    updateWeatherData = () => {}

    render() {
        const { chartData } = this.props
        const { loader } = this.state

        return (
            <MainContainer
                updateTime={moment().unix()}
                onUpdateData={this.updateWeatherData}
            >
                <Container>
                    <div className='toolBar'>
                        <Button.Group size='mini'>
                            <Button color='grey' onClick={() => this.changePeriod('today')}>Сегодня</Button>
                            <Button color='grey' onClick={() => this.changePeriod('yesterday')}>Вчера</Button>
                            <Button color='grey' onClick={() => this.changePeriod('week')}>Неделя</Button>
                            <Button color='grey' onClick={() => this.changePeriod('month')}>Месяц</Button>
                        </Button.Group>
                    </div>
                    { (! _.isEmpty(chartData) && ! loader) ? (
                        <FullStats
                            data={chartData}
                            onChangePeriod={this.changePeriod}
                        />
                    ) : (
                        <Dimmer active>
                            <Loader>Загрузка</Loader>
                        </Dimmer>
                    )}
                </Container>
            </MainContainer>
        );
    }
}

function mapStateToProps(state) {
    return {
        chartData: state.meteostation.chartData,
        current: state.meteostation.current
    }
}

export default connect(mapStateToProps)(Statistic)