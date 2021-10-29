import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { Sidebar as SidebarMenu, Container } from 'semantic-ui-react'
import { useAppSelector } from './app/hooks'

import Header from './components/header/Header'
import Footer from './components/footer/Footer'
import Sidebar from './components/sidebar/Sidebar'
import Main from './features/main/Main'
import Sensors from './features/sensors/Sensors'
import Error from './features/error/Error'

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
