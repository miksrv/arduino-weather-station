// Tree-shaken ECharts: only the chart types and components the site draws.
// Add a `use()` entry here before using a new series type or component in an option.
import { BarChart, CustomChart, GaugeChart, HeatmapChart, LineChart } from 'echarts/charts'
import {
    GraphicComponent,
    GridComponent,
    LegendComponent,
    MarkAreaComponent,
    MarkLineComponent,
    PolarComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
    BarChart,
    CustomChart,
    GaugeChart,
    HeatmapChart,
    LineChart,
    GraphicComponent,
    GridComponent,
    LegendComponent,
    MarkAreaComponent,
    MarkLineComponent,
    PolarComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent,
    CanvasRenderer
])

export default echarts
