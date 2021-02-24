import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import { Sidebar, Menu, Icon } from 'semantic-ui-react'

import Header from '../components/Header'
import Footer from '../layouts/Footer'

class MainContainer extends Component {

    state = {
        showSidebar: false,
    }

    setVisible = showSidebar => {
        this.setState({showSidebar})
    }

    render() {
        const { showSidebar } = this.state
        const { updateTime, onUpdateData, children } = this.props

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
                    {/*<Menu.Item as={NavLink} to='/forecast' activeClassName='active'>*/}
                    {/*    <Icon name='clock' />*/}
                    {/*    Прогноз*/}
                    {/*</Menu.Item>*/}
                </Sidebar>

                <Sidebar.Pusher dimmed={showSidebar}>
                    <Header
                        updateTime={updateTime}
                        onUpdateData={onUpdateData}
                        onClickMenu={() => this.setVisible(true)}
                    />
                    {children}
                    <Footer />
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        )
    }
}

export default MainContainer