import { LineChart } from '@mui/x-charts/LineChart';
import { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { PortfolioContext } from '../utils/contexts';
import { doc, getDoc } from 'firebase/firestore';
import type { PortfolioContextType } from '../utils/dataInterface';
import { db } from '../utils/firebaseConfig';
import { valueFormatter2D } from './ZCommonComponents';
import { chartsTooltipClasses } from '@mui/x-charts';
import { Button, ButtonGroup, Toolbar } from '@mui/material';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

export default function ChartPnL() {
    // 1. show the net worth of the portfolio over time
    // 2. show the position value over time
    const portfolioContext = useContext(PortfolioContext);
    const [displayYear, setDisplayYear] = useState<string>(dayjs().format('YYYY'));
    const [xAxisLabels, setXAxisLabels] = useState<string[] | undefined>(undefined)
    const [netWorth, setNetWorth] = useState<number[] | undefined>(undefined)
    const [mktVal, setMktVal] = useState<number[] | undefined>(undefined);
    const [cashBalance, setCashBalance] = useState<number[] | undefined>(undefined)
    const [selfCapital, setSelfCapital] = useState<number[] | undefined>(undefined);

    function handleYearChange(direction: 'prev' | 'next') {
        const newYear = dayjs(displayYear).add(direction === 'prev' ? -1 : 1, 'year').format('YYYY');
        setDisplayYear(newYear);
    }

    useEffect(() => {
        if (!portfolioContext || !portfolioContext.selectedPortPath) {
            setXAxisLabels(undefined);
            setNetWorth(undefined);
            return;
        }
        // check if the displayYear is the year of the current portfolio
        const isCurrentYear = dayjs(portfolioContext?.mtmTimeStamp).format('YYYY') === displayYear;
        const xAxis: string[] = [];
        const netWorthList: number[] = [];
        const mktValList: number[] = [];
        const cashBalList: number[] = [];
        const selfCapList: number[] = [];
        getDoc(doc(db, `${portfolioContext.selectedPortPath}/portfolio_summary/${displayYear}`)).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as Record<string, PortfolioContextType>;
                xAxis.push(...Object.keys(data).sort());
                xAxis.forEach((recordMonth) => {
                    const record = data[recordMonth];
                    netWorthList.push(record.netWorth);
                    mktValList.push(record.positionValue);
                    cashBalList.push(record.cashBalance);
                    selfCapList.push(record.selfCapital);
                });
                if (isCurrentYear) {
                    // if the current year, add the current month`
                    xAxis.push(`current`);
                    netWorthList.push(portfolioContext.netWorth || 0);
                    mktValList.push(portfolioContext.positionValue || 0);
                    cashBalList.push(portfolioContext.cashBalance || 0);
                    selfCapList.push(portfolioContext.selfCapital || 0);
                }
            } else {
                console.error('No data found for the selected year:', displayYear);
                xAxis.push(`current`);
                netWorthList.push(portfolioContext.netWorth || 0);
                mktValList.push(portfolioContext.positionValue || 0);
                cashBalList.push(portfolioContext.cashBalance || 0);
                selfCapList.push(portfolioContext.selfCapital || 0);
            }
        }).then(() => {
            setXAxisLabels(xAxis);
            setNetWorth(netWorthList);
            setMktVal(mktValList);
            setCashBalance(cashBalList);
            setSelfCapital(selfCapList);
        }).catch((error) => {
            console.error('Error fetching portfolio summary:', error)
            setXAxisLabels(undefined);
            setNetWorth(undefined);
            setMktVal(undefined);
            setCashBalance(undefined);
            setSelfCapital(undefined);
        });
    }, [portfolioContext, displayYear]);

    return (
        <div className="R2Card">
            <Toolbar sx={{ justifyContent: 'center' }}>
                <ButtonGroup variant="outlined" color='warning' size="small">
                    <Button onClick={() => handleYearChange('prev')}>
                        <KeyboardDoubleArrowLeftIcon fontSize="inherit" />
                    </Button>
                    <Button >{displayYear}</Button>
                    <Button onClick={() => handleYearChange('next')} disabled={displayYear === dayjs().format('YYYY')} >
                        <KeyboardDoubleArrowRightIcon fontSize="inherit" />
                    </Button>
                </ButtonGroup>
            </Toolbar>
            {xAxisLabels && mktVal && netWorth &&
                <LineChart
                    height={300}
                    grid={{ horizontal: true }}
                    series={[
                        { data: selfCapital, label: 'Self Capital', yAxisId: 'rightAxisId', valueFormatter: valueFormatter2D },
                        { data: cashBalance, label: 'Cash Balance', yAxisId: 'leftAxisId', valueFormatter: valueFormatter2D },
                        { data: mktVal, label: 'Position Value', yAxisId: 'rightAxisId', valueFormatter: valueFormatter2D },
                        { data: netWorth, label: 'Net Worth', yAxisId: 'rightAxisId', valueFormatter: valueFormatter2D },
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
                    hideLegend
                    slotProps={{
                        tooltip: {
                            sx: {
                                [`&.${chartsTooltipClasses.root} .${chartsTooltipClasses.valueCell}`]: {
                                    textAlign: 'right',
                                },
                            },
                        },
                    }}
                />
            }

        </div>
    );
}
