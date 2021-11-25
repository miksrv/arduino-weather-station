import React from 'react'
import translate from '../functions/translate'
import { NavLink } from 'react-router-dom'
import { Sidebar as SidebarMenu, Menu, Icon } from 'semantic-ui-react'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { hide } from '../app/sidebarSlice'

const Sidebar: React.FC = () => {
    const dispatch = useAppDispatch()
    const lang = translate().sidebar
    const visible = useAppSelector(state => state.sidebar.visible)

    return (
        <SidebarMenu
            as={Menu}
            animation='overlay'
            icon='labeled'
            inverted
            onHide={() => dispatch(hide())}
            vertical
            visible={visible}
            width='thin'
        >
            <Menu.Item as={NavLink} onClick={() => dispatch(hide())} exact to='/'>
                <Icon name='calendar check outline' />
                {lang.dashboard}
            </Menu.Item>
            <Menu.Item as={NavLink} onClick={() => dispatch(hide())} to='/sensors' activeClassName='active'>
                <Icon name='dashboard' />
                {lang.sensors}
            </Menu.Item>
            <Menu.Item as={NavLink} onClick={() => dispatch(hide())} to='/statistic' activeClassName='active'>
                <Icon name='area graph' />
                {lang.statistic}
            </Menu.Item>
            <Menu.Item as={NavLink} onClick={() => dispatch(hide())} to='/heatmap' activeClassName='active'>
                <Icon name='map' />
                {lang.heatmap}
            </Menu.Item>
            {/*<Menu.Item as={NavLink} to='/forecast' activeClassName='active'>*/}
            {/*    <Icon name='clock' />*/}
            {/*    Прогноз*/}
            {/*</Menu.Item>*/}
        </SidebarMenu>
    )
}

export default Sidebar
