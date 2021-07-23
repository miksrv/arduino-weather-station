import React, { useState } from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'

import Highcharts from 'highcharts/highmaps'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'

import chart_config from '../data/chart_config'

HighchartsMore(Highcharts)

Highcharts.setOptions(Highcharts.theme = chart_config)

/**
 * The component for displaying the chart
 * @param params {config: {}, data: {}, height: (opt) int}
 * @returns {JSX.Element}
 * @constructor
 */
const Chart = params => {
    const [loader, setLoader] = useState(false)

    let isLoaded = false,
        index = 0,
        height = (typeof params.config.chart !== 'undefined' && typeof params.config.chart.height !== 'undefined') ?
                 params.config.chart.height : chart_config.chart.height

    for (let prop in params.data) {
        if (params.data[prop].length) {
            isLoaded = true
            params.config.series[index].data = params.data[prop]
            index++
        }
    }

    (typeof params.loader !== 'undefined' && params.loader !== loader) && (setLoader(params.loader))

    return (
        <section className='chart'>
            {! isLoaded || loader ? (
                <div className='informer' style={{height: height}}>
                    <Dimmer active>
                        <Loader />
                    </Dimmer>
                </div>
            ) : (
                <HighchartsReact
                    highcharts={Highcharts}
                    options={params.config}
                />
            )}
        </section>
    )
}

export default Chart