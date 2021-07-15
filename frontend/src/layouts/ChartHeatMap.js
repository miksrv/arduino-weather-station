import React  from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'

import Highcharts from 'highcharts/highmaps'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'

import chart_config from '../data/chart_config'
import chartHeatMap from '../data/chart_heatmap'

HighchartsMore(Highcharts)

Highcharts.setOptions(Highcharts.theme = chart_config)

const ChartHeatMap = params => {
    (params.data.length!== 0) && (chartHeatMap.series[0].data = params.data)

    return (
        <section className='chart'>
            {(params.data.length === 0) ? (
                <div className='informer' style={{height: 330}}>
                    <Dimmer active>
                        <Loader />
                    </Dimmer>
                </div>
            ) : (
                <HighchartsReact
                    highcharts={Highcharts}
                    options={chartHeatMap}
                />
            )}
        </section>
    )
}

export default ChartHeatMap