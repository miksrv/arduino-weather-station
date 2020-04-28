/**
 * React weather icons: https://react-icons.netlify.com/#/icons/wi
 */

import React  from 'react'

import { Grid } from 'semantic-ui-react'
import { WiMoonAltFirstQuarter, WiMoonAltFull, WiMoonAltNew, WiMoonAltThirdQuarter, WiMoonAltWaningCrescent1,
    WiMoonAltWaningCrescent2, WiMoonAltWaningCrescent3, WiMoonAltWaningCrescent4, WiMoonAltWaningCrescent5,
    WiMoonAltWaningCrescent6, WiMoonAltWaningGibbous1, WiMoonAltWaningGibbous2, WiMoonAltWaningGibbous3,
    WiMoonAltWaningGibbous4, WiMoonAltWaningGibbous5, WiMoonAltWaningGibbous6, WiMoonAltWaxingCrescent1,
    WiMoonAltWaxingCrescent2, WiMoonAltWaxingCrescent3, WiMoonAltWaxingCrescent4, WiMoonAltWaxingCrescent5,
    WiMoonAltWaxingCrescent6, WiMoonAltWaxingGibbous1, WiMoonAltWaxingGibbous2, WiMoonAltWaxingGibbous3,
    WiMoonAltWaxingGibbous4, WiMoonAltWaxingGibbous5, WiMoonAltWaxingGibbous6,
    WiMoonrise, WiMoonset
} from 'react-icons/wi'

import moment from 'moment'

const Moon = (params) => {

    const icons = {
        Full: WiMoonAltFull,
        New: WiMoonAltNew,
        FirstQuarter: WiMoonAltFirstQuarter,
        ThirdQuarter: WiMoonAltThirdQuarter,
        WaningCrescent1: WiMoonAltWaningCrescent1,
        WaningCrescent2: WiMoonAltWaningCrescent2,
        WaningCrescent3: WiMoonAltWaningCrescent3,
        WaningCrescent4: WiMoonAltWaningCrescent4,
        WaningCrescent5: WiMoonAltWaningCrescent5,
        WaningCrescent6: WiMoonAltWaningCrescent6,
        WaningCrescent7: WiMoonAltWaningCrescent6,
        NewCrescent1: WiMoonAltWaningGibbous1,
        WaningGibbous2: WiMoonAltWaningGibbous2,
        WaningGibbous3: WiMoonAltWaningGibbous3,
        WaningGibbous4: WiMoonAltWaningGibbous4,
        WaningGibbous5: WiMoonAltWaningGibbous5,
        WaningGibbous6: WiMoonAltWaningGibbous6,
        WaxingCrescent1: WiMoonAltWaxingCrescent1,
        WaxingCrescent2: WiMoonAltWaxingCrescent2,
        WaxingCrescent3: WiMoonAltWaxingCrescent3,
        WaxingCrescent4: WiMoonAltWaxingCrescent4,
        WaxingCrescent5: WiMoonAltWaxingCrescent5,
        WaxingCrescent6: WiMoonAltWaxingCrescent6,
        WaxingGibbous1: WiMoonAltWaxingGibbous1,
        WaxingGibbous2: WiMoonAltWaxingGibbous2,
        WaxingGibbous3: WiMoonAltWaxingGibbous3,
        WaxingGibbous4: WiMoonAltWaxingGibbous4,
        WaxingGibbous5: WiMoonAltWaxingGibbous5,
        WaxingGibbous6: WiMoonAltWaxingGibbous6,
    };

    const MoonPhraseIcon = icons[params.data.phase_icon]

    return (
        <Grid.Column computer={8} tablet={16} mobile={16}>
            <div className={'tile moon ' + params.widget.color}>
                <Grid columns={3}>
                    <Grid.Row stretched>
                        <Grid.Column textAlign='left' width={7}>
                            <div>
                                Возраст (дней): <b>{Number((params.data.age).toFixed(2))}</b>
                            </div>
                            <div>
                                Освещенность: <b>{Number((params.data.illumination).toFixed(2)) * 100}%</b>
                            </div>
                            <div>
                                Расстояние (км): <b>{Number((params.data.distance).toFixed(0))}</b>
                            </div>
                            <div>
                                Фаза Луны: <b>{params.data.phase_name}</b>
                            </div>
                        </Grid.Column>
                        <Grid.Column width={2} className='icon-holder'>
                            <MoonPhraseIcon className='icon' />
                        </Grid.Column>
                        <Grid.Column textAlign='right' width={7}>
                            <div className='icon-info-container'>
                                <WiMoonrise className='icon-info' /> Восход Луны: <b>{moment.unix(params.data.rise).format("H:mm")}</b>
                            </div>
                            <div className='icon-info-container'>
                                <WiMoonset className='icon-info' /> Закат Луны: <b>{moment.unix(params.data.set).format("H:mm")}</b>
                            </div>
                            <div>
                                Новолуние: <b>{moment.unix(params.data.phase_new).format("DD.MM.Y")}</b>
                            </div>
                            <div>
                                Полнолуние: <b>{moment.unix(params.data.phase_full).format("DD.MM.Y")}</b>
                            </div>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        </Grid.Column>
    )
}

export default Moon