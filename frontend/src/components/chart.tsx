import chartConfig from 'charts/config'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'
import Highcharts from 'highcharts/highmaps'
import React from 'react'
import { Dimmer, Loader } from 'semantic-ui-react'

import { useAppSelector } from 'app/hooks'

HighchartsMore(Highcharts)

const Chart: React.FC<any> = (params) => {
    const { loader, config, data, windRose } = params
    const language = useAppSelector((state) => state.language.translate)

    let dIndex = 0
    let height =
        typeof config.chart !== 'undefined' && typeof config.chart.height
            ? config.chart.height
            : 300

    chartConfig.lang = language.charts

    Highcharts.setOptions(chartConfig)

    if (windRose) {
        data.forEach((item: any | undefined) => {
            if (typeof item !== 'undefined') {
                item.forEach((part: any, index: number) => {
                    config.series[index].data = part
                })
            }
        })
    } else {
        data.forEach((item: any | undefined) => {
            if (typeof item !== 'undefined') {
                config.series[dIndex].data = item
                dIndex++
            }
        })
    }

    return (
        <>
            {loader ? (
                <div
                    className='box'
                    style={{ height: height }}
                >
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
