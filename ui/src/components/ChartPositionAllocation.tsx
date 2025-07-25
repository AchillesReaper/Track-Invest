import { PieChart, type PieChartProps } from "@mui/x-charts/PieChart";
import { rainbowSurgePalette } from '@mui/x-charts/colorPalettes';
import { useTheme } from '@mui/material/styles';
import { useContext, useEffect, useState } from "react";
import { PortfolioContext } from "../utils/contexts";
import type { SinglePosition } from "../utils/dataInterface";

export default function ChartPositionAllocation() {
    const theme = useTheme();
    const palette = rainbowSurgePalette(theme.palette.mode);
    let colorPalet: number = 0;

    const portfolioContext = useContext(PortfolioContext);
    const [marketValue , setMarketValue] = useState<number | undefined>(undefined)
    const [assetClassAllocation, setAssetClassAllocation] = useState<any | undefined>(undefined)
    const [tickerAllocation, setTickerAllocation] = useState<any | undefined>(undefined)

    useEffect(() => {
        console.log(portfolioContext);
        if (!portfolioContext || !portfolioContext.currentPositions) return;
        setMarketValue(portfolioContext.positionValue);
        const currentPositions: Record<string, SinglePosition> = portfolioContext.currentPositions;
        // sort the positions by asset class
        const sortedPositions = Object.entries(currentPositions).sort((a, b) => {
            const assetClassA = a[1].assetClass.toLowerCase();
            const assetClassB = b[1].assetClass.toLowerCase();
            return assetClassA.localeCompare(assetClassB);
        });

        const tkrAllo = sortedPositions.map(([ticker, position]) => {
            colorPalet += 1;
            return { label: position.ticker, ticker: ticker, value: position.marketValue, assetClass: position.assetClass, color: palette[colorPalet] }
        });
        console.log(tkrAllo);

        // sum up the market value of each asset class
        const assAllo = tkrAllo.reduce((acc, curr) => {
            const existing = acc.find(item => item.assetClass === curr.assetClass);
            if (existing) {
                // If asset class already exists, add to its value
                existing.value += curr.value;
            } else {
                // If new asset class, create new entry
                acc.push({
                    label: curr.assetClass,
                    value: curr.value,
                    color: curr.color,
                    assetClass: curr.assetClass
                });
            }
            return acc; // Always return the accumulator!
        }, [] as Array<{ label: string, value: number, color: string, assetClass: string }>);

        console.log(assAllo);

        setAssetClassAllocation(assAllo);
        setTickerAllocation(tkrAllo);

    }, [portfolioContext]);



    const setting = {
        series: [
            {
                id: 'inner',
                innerRadius: 0,
                outerRadius: 80,
                data: assetClassAllocation,
                arcLabel: (item) => `${item.label}: ${(item.value / marketValue * 100).toFixed(0)}%`,
                // arcLabel: (item) => `${item.label}: $${item.value.toLocaleString()}`,
                arcLabelMinAngle: 35,
                highlightScope: { fade: 'series', highlight: 'item' },
                faded: { innerRadius: 0, additionalRadius: -50, color: 'gray' },
            },
            {
                id: 'outer',
                innerRadius: 100,
                outerRadius: 120,
                data: tickerAllocation,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 50, additionalRadius: -50, color: 'gray' },
            },
        ],
        height: 300,
        hideLegend: true,
    } satisfies PieChartProps;


    return (
        <div className="elementCardR2 md:grow-0">
            {assetClassAllocation && tickerAllocation && tickerAllocation.length > 0 && marketValue &&
                <PieChart  {...setting} />
            }
        </div>
    );
}
