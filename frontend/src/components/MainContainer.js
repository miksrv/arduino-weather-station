import _ from 'lodash'

import React, { Component } from 'react'
import { connect } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { Sidebar, Menu, Icon } from 'semantic-ui-react'
import { Helmet } from 'react-helmet'

import Header from '../components/Header'
import Footer from '../layouts/Footer'

import * as meteoActions from '../store/meteostation/actions'
import moment from 'moment'

const SITE_TITLE = 'Погодная станция'

class MainContainer extends Component {

    state = {
        showSidebar: false,
    }

    componentDidMount() {
        this.updateWeatherData()
    }

    updateWeatherData = () => {
        const { dispatch, storeSummary } = this.props

        let last_update = (! _.isEmpty(storeSummary) ? moment().unix() - storeSummary.update : null)

        if (last_update === null || (last_update < -140 || last_update > 140))
            dispatch(meteoActions.fetchDataSummary())
    }

    setVisible = showSidebar => {
        this.setState({showSidebar})
    }

    render() {
        const { showSidebar } = this.state
        const { updateTime, onUpdateData, children, title } = this.props

        return (
            <Sidebar.Pushable>
                <Sidebar
                    as={Menu}
                    animation='overlay'
                    icon='labeled'
                    inverted
                    onHide={() => this.setVisible(false)}
                    vertical
                    visible={showSidebar}
                    width='thin'
                >
                    <Menu.Item as={NavLink} exact to='/'>
                        <Icon name='calendar check outline' />
                        Сводка
                    </Menu.Item>
                    <Menu.Item as={NavLink} to='/dashboard' activeClassName='active'>
                        <Icon name='dashboard' />
                        Датчики
                    </Menu.Item>
                    <Menu.Item as={NavLink} to='/statistic' activeClassName='active'>
                        <Icon name='area graph' />
                        Статистика
                    </Menu.Item>
                    <Menu.Item as={NavLink} to='/archive' activeClassName='active'>
                        <Icon name='archive' />
                        Архив
                    </Menu.Item>
                    {/*<Menu.Item as={NavLink} to='/forecast' activeClassName='active'>*/}
                    {/*    <Icon name='clock' />*/}
                    {/*    Прогноз*/}
                    {/*</Menu.Item>*/}
                </Sidebar>
                <Sidebar.Pusher dimmed={showSidebar}>
                    <Helmet>
                        <title>{title !== undefined ? `${title} - ${SITE_TITLE}` : SITE_TITLE}</title>
                    </Helmet>
                    <Header
                        updateTime={updateTime}
                        onUpdateData={() => this.updateWeatherData()}
                        onClickMenu={() => this.setVisible(true)}
                    />
                    {children}
                    <Footer />
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        )
    }
}

function mapStateToProps(state) {
    return {
        storeSummary: state.meteostation.storeSummary
    }
}

export default connect(mapStateToProps)(MainContainer)