import Error from 'features/error'
import Heatmap from 'features/heatmap'
import Main from 'features/main'
import Sensors from 'features/sensors'
import Statistic from 'features/statistic'
import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { Container, Sidebar as SidebarMenu } from 'semantic-ui-react'

import { useAppDispatch, useAppSelector } from 'app/hooks'
import { setLanguage } from 'app/languageSlice'

import translate from 'functions/translate'

import Footer from 'components/footer'
import Header from 'components/header'
import Sidebar from 'components/sidebar'

const App: React.FC = () => {
    const dispatch = useAppDispatch()
    const visible = useAppSelector((state) => state.sidebar.visible)

    dispatch(setLanguage(translate()))

    return (
        <SidebarMenu.Pushable>
            <BrowserRouter>
                <Sidebar />
                <SidebarMenu.Pusher dimmed={visible}>
                    <Container>
                        <Header />
                        <Switch>
                            <Route
                                component={Main}
                                path='/'
                                exact
                            />
                            <Route
                                component={Sensors}
                                path='/sensors'
                                exact
                            />
                            <Route
                                component={Statistic}
                                path='/statistic'
                                exact
                            />
                            <Route
                                component={Heatmap}
                                path='/heatmap'
                                exact
                            />
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
