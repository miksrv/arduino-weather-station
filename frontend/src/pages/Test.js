import React, { Component } from 'react'
import { connect } from 'react-redux'

import Stats from '../components/Stats'

import { Container, Dimmer, Loader } from "semantic-ui-react";

import _ from 'lodash'

import * as meteoActions from '../store/meteostation/actions'

class Test extends Component {

    componentDidMount() {
        const { dispatch } = this.props

        dispatch(meteoActions.fetchStatData())
    }

    render() {
        const { stat } = this.props;

        return (
            <Container className='main-content'>
                { ! _.isEmpty(stat) ? (
                    <Stats data={stat} />
                ) : (
                    <Dimmer active>
                        <Loader>Загрузка</Loader>
                    </Dimmer>
                )}


            </Container>
        );
    }
}

function mapStateToProps(state) {
    return {
        stat: state.meteostation.stat,
        current: state.meteostation.current
    }
}

export default connect(mapStateToProps)(Test);