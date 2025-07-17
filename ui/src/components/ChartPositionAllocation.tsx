import { PieChart, type PieChartProps } from "@mui/x-charts/PieChart";
import { rainbowSurgePalette } from '@mui/x-charts/colorPalettes';
import { useTheme } from '@mui/material/styles';
import { assetAllocation } from "./ZDummyDB";

export default function ChartPositionAllocation() {
    const theme = useTheme();
    const palette = rainbowSurgePalette(theme.palette.mode);
    let colorPalet: number = 0;


    const data1 = Object.entries(assetAllocation).map(([assetType, assetDetail]) => {
        const mktValAry: number[] = Object.values(assetDetail).map(stock => (stock.marketValue))
        const mktVal: number = mktValAry.reduce((acc: number, curr: number) => acc + curr, 0)
        colorPalet += 1;

        return { label: assetType, value: mktVal, color: palette[colorPalet] }
    })
    const data2 = Object.keys(assetAllocation).map((assetType) => {
        const key = assetType as keyof typeof assetAllocation;
        const groupData = Object.entries(assetAllocation[key]).map(([stockCode, stockDetail]) => {
            colorPalet += 1;
            return { label: stockCode, value: stockDetail.marketValue, color: palette[colorPalet] }
        })
        return groupData
    }).flat()

    const total1 = data1.reduce((sum, d) => sum + d.value, 0);
    
    const setting = {
        series: [
            {
                id: 'inner',
                innerRadius: 0,
                outerRadius: 80,
                data: data1,
                arcLabel: (item) => `${item.label}: ${(item.value / total1 * 100).toFixed(0)}%`,
                arcLabelMinAngle: 35,
                highlightScope: { fade: 'series', highlight: 'item' },
                faded: { innerRadius: 0, additionalRadius: -50, color: 'gray' },
            },
            {
                id: 'outer',
                innerRadius: 100,
                outerRadius: 120,
                data: data2,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 50, additionalRadius: -50, color: 'gray' },
            },
        ],
        height: 300,
        hideLegend: true, 
    } satisfies PieChartProps;


    return (
        <div className="elementCardR2 ">
            <PieChart  {...setting} />
        </div>
    );
}
