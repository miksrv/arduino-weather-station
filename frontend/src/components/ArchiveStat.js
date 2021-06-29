import React, { Component } from 'react'

import Highcharts from 'highcharts/highmaps'
import HighchartsReact from 'highcharts-react-official'
import HighchartsMore from 'highcharts/highcharts-more'

import chart_config from '../data/chart_config'

HighchartsMore(Highcharts)

Highcharts.setOptions(Highcharts.theme = chart_config)

class ArchiveStat extends Component {

  state = {
    chartArchive: {
      chart: {
        type: 'heatmap',
        height: 400,
        marginTop: 60,
      },

      boost: {
        useGPUTranslations: true
      },

      title: {
        text: 'Тепловая карта',
        align: 'left',
        x: 40
      },

      subtitle: {
        text: 'Изменение температуры в течение последних 10 месяцев',
        align: 'left',
        x: 40
      },

      xAxis: {
        type: 'datetime',
        // min: Date.UTC(2021, 6, 23),
        // max: Date.UTC(2021, 6, 25),
        labels: {
          align: 'left',
          x: 5,
          y: 14,
          format: '{value:%B}' // long month
        },
        showLastLabel: false,
        tickLength: 16
      },

      yAxis: {
        title: {
          text: null
        },
        labels: {
          format: '{value}:00'
        },
        minPadding: 0,
        maxPadding: 0,
        startOnTick: false,
        endOnTick: false,
        tickPositions: [0, 6, 12, 18, 24],
        tickWidth: 1,
        min: 0,
        max: 23,
        reversed: true
      },

      colorAxis: {
        stops: [
          [0, '#0625cf'],
          [0.3, '#2884bc'],
          [0.5, '#fffbbc'],
          [0.6, '#FFA500'],
          [0.8, '#e64b24'],
          [1, '#B22222']
        ],
        min: -37,
        max: 37,
        startOnTick: false,
        endOnTick: false,
        labels: {
          format: '{value}℃'
        }
      },

      legend: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        floating: false,
      },

      series: [{
        boostThreshold: 100,
        borderWidth: 0,
        nullColor: '#4e4e4e',
        colsize: 24 * 36e5, // one day
        tooltip: {
          headerFormat: 'Температура<br/>',
          pointFormat: '{point.x:%e %b, %Y} {point.y}:00: <b>{point.value} ℃</b>'
        },
        turboThreshold: Number.MAX_VALUE // #3404, remove after 4.0.5 release
      }]
    }
  }

  componentDidMount() {
    this.handleUpdateCharts()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.data !== prevProps.data) {
      this.handleUpdateCharts()
    }
  }

  handleUpdateCharts() {
    const { storeStatistic } = this.props

    this.setState({
      chartArchive: {
        ...this.state.chartArchive,
        series: [{
          data: storeStatistic.data
        }]
      }
    })
  }

  render() {
    const { chartArchive } = this.state

    return (
        <section className='chart'>
          <HighchartsReact
              highcharts={Highcharts}
              options={chartArchive}
          />
        </section>
    )
  }
}

export default ArchiveStat