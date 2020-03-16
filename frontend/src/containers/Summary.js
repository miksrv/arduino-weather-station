import React, { Component } from 'react'
import { connect } from 'react-redux'
import {Checkbox, Container} from 'semantic-ui-react'

import * as meteoActions from '../store/meteostation/actions'

class Summary extends Component {
  state = {
    intervalId: null,
    autoUpdate: false
  }

  componentDidMount() {
    const { dispatch } = this.props
    const { autoUpdate } = this.state

    dispatch(meteoActions.fetchMeteoData())
  }

  componentWillUnmount() {

  }

  handleChange = () => {
    const { autoUpdate } = this.state
    const { dispatch } = this.props

    this.setState(({ autoUpdate }) => ({ autoUpdate: !autoUpdate }))

    if ( !autoUpdate) {
      var intervalId = setInterval(() => {
          dispatch(meteoActions.fetchMeteoData())
      }, 3000)

      this.setState({intervalId: intervalId})
    } else {
      clearInterval(this.state.intervalId)
    }
  }

  render() {
    const { autoUpdate } = this.state

    return (
        <div>Summary
          <div>{this.props.current.datestamp}</div>
          <Checkbox
              toggle
              checked={autoUpdate}
              label='Автообновление данных'
              onChange={this.handleChange}
          />
        </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    current: state.meteostation.current
  }
}

export default connect(mapStateToProps)(Summary);