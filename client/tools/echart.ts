import { EChartsOption } from 'echarts'

export const getEChartBaseConfig = (theme: string | undefined = 'dark'): Partial<EChartsOption> => {
    const backgroundColor = theme === 'dark' ? '#2c2d2e' : '#ffffff' // --container-background-color
    const borderColor = theme === 'dark' ? '#444546' : '#cbcccd' // --input-border-color
    const textPrimaryColor = theme === 'dark' ? '#e1e3e6' : '#000000E5' // --text-color-primary

    return {
        backgroundColor,
        grid: {
            left: 10,
            right: 10,
            top: 15,
            bottom: 25,
            containLabel: true,
            borderColor: borderColor
        },
        legend: {
            type: 'plain',
            orient: 'horizontal',
            left: 5,
            bottom: 0,
            itemWidth: 20,
            itemHeight: 2,
            textStyle: {
                color: textPrimaryColor,
                fontSize: '12px'
            },
            icon: 'rect'
        }
    }
}
