

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { performance, accPnL } from './ZDummyDB';

export default function ChartPnL() {
    const xAxisLabels = Object.keys(performance)
    const mktVal = Object.values(performance).map((monthlyPos) => {
        const monthlyPosValList = Object.values(monthlyPos).map((stockDetail) => (stockDetail.marketValue))
        return monthlyPosValList.reduce((acc: number, curr: number) => acc + curr, 0)
    })
    const pnlVal = Object.values(accPnL)

    const chartData = xAxisLabels.map((label, index) => ({
        name: label,
        market_value: mktVal[index],
        accum_pnl: pnlVal[index]
    }))

    return (
        <div className="bg-white p-0 rounded-lg shadow-xl w-full max-w-5xl h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{
                        top: 50,
                        right: 10, // Increased right margin for the second Y-axis label
                        left: 10,  // Increased left margin for the first Y-axis label
                        bottom: 10,
                    }}
                >
                    {/* Grid lines for better readability */}
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                    {/* X-Axis configuration */}
                    <XAxis dataKey="name" />

                    {/* First Y-Axis for market value */}
                    <YAxis
                        yAxisId="mktValAxis" // Unique ID for the market value axis
                        label={{ value: 'Market ($ K)', angle: -90, position: 'insideLeft', fill: '#EF4444' }}
                        tickFormatter={(value) => (value / 1000).toFixed(0)}
                        stroke="#EF4444" // Match temperature series color
                    />

                    {/* Second Y-Axis for accumulated pnl, positioned on the right */}
                    <YAxis
                        yAxisId="pnlAxis" // Unique ID for the PnL axis
                        orientation="right" // Position the second axis on the right
                        label={{ value: 'PnL (USD)', angle: 90, position: 'insideRight', fill: '#3B82F6' }}
                        tickFormatter={(value) => (value / 1000).toFixed(0)}
                        stroke="#3B82F6" // Match humidity series color
                    />

                    {/* Tooltip for displaying data on hover */}
                    <Tooltip
                        formatter={(value) => (
                            value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        )}
                    />

                    {/* Legend to differentiate series */}
                    {/* <Legend /> */}

                    {/* Line for Temperature data */}
                    <Line
                        yAxisId="mktValAxis" // Link to the temperature Y-axis
                        type="monotone" // Smooth line
                        dataKey="market_value" // Data key from chartData
                        stroke="#EF4444" // Red color for temperature
                        activeDot={{ r: 8 }} // Larger dot on hover
                        name="mkt value ($)" // Label for the legend and tooltip
                    />

                    {/* Line for Humidity data */}
                    <Line
                        yAxisId="pnlAxis" // Link to the humidity Y-axis
                        type="monotone" // Smooth line
                        dataKey="accum_pnl" // Data key from chartData
                        stroke="#3B82F6" // Blue color for humidity
                        activeDot={{ r: 8 }} // Larger dot on hover
                        name="P/L ($)" // Label for the legend and tooltip
                    />
                </LineChart>

            </ResponsiveContainer>
        </div>
    );
}
