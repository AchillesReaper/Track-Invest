


import { LineChart } from '@mui/x-charts/LineChart';
import { portfolioPosition, accumPnL } from './ZDummyDB';

export default function ChartPnL() {
    const xAxisLabels = Object.keys(portfolioPosition)
    
    // ---------- market value of the portfolio ----------
    const mktVal = Object.values(portfolioPosition).map((monthlyPos) => {
        const monthlyPosValList = Object.values(monthlyPos).map((stockDetail) => (stockDetail.marketValue))
        return monthlyPosValList.reduce((acc: number, curr: number) => acc + curr, 0)
    })


    // ---------- accumulated PnL ----------
    const pnlVal = Object.values(accumPnL)

    return (
        <div className="elementCardR2 sm:w-1/2 lg:w-3/5 xl:w-2/3">
            <LineChart
                height={300}
                grid={{ horizontal: true }}
                series={[
                    { data: mktVal, label: 'market value', yAxisId: 'leftAxisId' },
                    { data: pnlVal, label: 'accum P/L', yAxisId: 'rightAxisId' },
                ]}
                xAxis={[{ scaleType: 'point', data: xAxisLabels }]}
                yAxis={[
                    { 
                        id: 'leftAxisId', 
                        position: 'left', 
                        valueFormatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
                    },
                    { 
                        id: 'rightAxisId', 
                        position: 'right',
                        valueFormatter: (value: number) => `${(value / 1000).toFixed(0)}k` 
                    },
                ]}
            />

        </div>
    );
}
