import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Dimmer, Loader, Button, Grid } from 'semantic-ui-react'

import MainContainer from '../components/MainContainer'
import FullStats from '../components/FullStats'

import moment from 'moment'

import * as meteoActions from '../store/meteostation/actions'

import _ from 'lodash'

class Statistic extends Component {

    state = {
        loader: false,
    }

    componentDidMount() {
        const { dispatch } = this.props
        const { period } = this.state

        dispatch(meteoActions.fetchDataStatistic())
    }

    changePeriod = ( period ) => {
        const { dispatch } = this.props

        if ( period !== this.state.period ) {
            this.setState({ loader: true, period })

            dispatch(meteoActions.fetchDataStatistic()).then(() => {
                this.setState({ loader: false })
            });
        }
    }

    updateWeatherData = () => {}

    render() {
        const { storeStatistic } = this.props
        const { loader } = this.state

        return (
            <MainContainer
                updateTime={moment().unix()}
                onUpdateData={this.updateWeatherData}
            >
                <Container>
                    {/*<div className='toolBar'>*/}
                    {/*    <Button.Group size='mini'>*/}
                    {/*        <Button color='grey' onClick={() => this.changePeriod('today')}>Сегодня</Button>*/}
                    {/*        <Button color='grey' onClick={() => this.changePeriod('yesterday')}>Вчера</Button>*/}
                    {/*        <Button color='grey' onClick={() => this.changePeriod('week')}>Неделя</Button>*/}
                    {/*        <Button color='grey' onClick={() => this.changePeriod('month')}>Месяц</Button>*/}
                    {/*    </Button.Group>*/}
                    {/*</div>*/}
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