import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'
import Highcharts from 'highcharts/highmaps'
import HighchartsReact from 'highcharts-react-official'
import config from '../charts/config'

Highcharts.setOptions(config)

const Chart: React.FC<any> = (params) => {
    const { loader, config, data } = params
    let dIndex = 0
    let height = (typeof config.chart !== 'undefined' && typeof config.chart.height) ?
        config.chart.height : 300

    data.forEach((item: any | undefined) => {
        if (typeof item !== 'undefined') {
            config.series[dIndex].data = item
            dIndex++
        }
    })

    return (
        <>
            {loader ? (
                <div className='box' style={{height: height}}>
                    <Dimmer active>
                        <Loader />
                    </Dimmer>
                </div>
            ) : (
                <HighchartsReact
                    highcharts={Highcharts}
                    options={config}
                    immutable={true}
                />
            )}
        </>
    )
}

export default Chart
