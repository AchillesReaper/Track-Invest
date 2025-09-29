import { PieChart, type PieChartProps } from "@mui/x-charts/PieChart";
import { rainbowSurgePalette } from '@mui/x-charts/colorPalettes';
import { useTheme } from '@mui/material/styles';
import { useContext, useEffect, useMemo, useState } from "react";
import { PortfolioContext } from "../utils/contexts";
import type { SinglePosition } from "../utils/dataInterface";

export default function ChartPositionAllocation() {
    const theme = useTheme();
    const palette = rainbowSurgePalette(theme.palette.mode);
    let colorPalet: number = 0;

    const portfolioContext = useContext(PortfolioContext);
    const cashBalance = useMemo(() => portfolioContext?.cashBalance, [portfolioContext]);
    const netWorth = useMemo(() => portfolioContext?.netWorth, [portfolioContext]);
    const [assetClassAllocation, setAssetClassAllocation] = useState<any | undefined>(undefined)
    const [tickerAllocation, setTickerAllocation] = useState<any | undefined>(undefined)

    useEffect(() => {
        if (!portfolioContext || !portfolioContext.currentPositions || cashBalance === undefined) return;
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
        assAllo.push({ label: 'Cash', assetClass: 'cash', value: cashBalance, color: palette[colorPalet + 1] });
        tkrAllo.push({ label: 'Cash', ticker: 'cash', value: cashBalance, assetClass: 'cash', color: palette[colorPalet + 1] });


        setAssetClassAllocation(assAllo);
        setTickerAllocation(tkrAllo);

    }, [portfolioContext]);

    const valueFormatter = (item: { value: number }) => `${(item.value / netWorth! * 100).toFixed(2)}%`;


    const setting = {
        series: [
            {
                id: 'inner',
                innerRadius: 0,
                outerRadius: 80,
                data: assetClassAllocation,
                valueFormatter: valueFormatter,
                arcLabel: (item) => `${item.label}`,
                arcLabelMinAngle: 35,
                highlightScope: { fade: 'series', highlight: 'item' },
                faded: { innerRadius: 0, additionalRadius: -50, color: 'gray' },
            },
            {
                id: 'outer',
                innerRadius: 100,
                outerRadius: 120,
                data: tickerAllocation,
                valueFormatter: valueFormatter,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 50, additionalRadius: -50, color: 'gray' },
            },
        ],
        height: 365,
        // width: 300,
        hideLegend: true,
    } satisfies PieChartProps;


    return (
        <div className="R2Card md:grow-0">
            {netWorth && assetClassAllocation && tickerAllocation
                ?
                <PieChart  {...setting} />
                :
                <div></div>
            }
        </div>
    );
}
