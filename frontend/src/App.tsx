import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { Sidebar as SidebarMenu, Container } from 'semantic-ui-react'
import { useAppSelector } from './app/hooks'

import Header from './components/header'
import Footer from './components/footer'
import Sidebar from './components/sidebar'

import Main from './features/main'
import Sensors from './features/sensors'
import Statistic from './features/statistic'
import Error from './features/error'

const App: React.FC = () => {
    const visible = useAppSelector(state => state.sidebar.visible)

    return (
        <SidebarMenu.Pushable>
            <BrowserRouter>
                <Sidebar />
                <SidebarMenu.Pusher dimmed={visible}>
                    <Container>
                        <Header />
                        <Switch>
                            <Route component={Main} path='/' exact />
                            <Route component={Sensors} path='/sensors' exact />
                            <Route component={Statistic} path='/statistic' exact />
                            <Route component={Error} />
                        </Switch>
                        <Footer />
                    </Container>
                </SidebarMenu.Pusher>
            </BrowserRouter>
        </SidebarMenu.Pushable>
    )
}

export default App
