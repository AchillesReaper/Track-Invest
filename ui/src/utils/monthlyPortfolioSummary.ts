import dayjs from "dayjs";
import type { PortfolioContextType, SinglePosition } from "./dataInterface";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import axios from "axios";
import { serverURL } from "./firebaseConfigDetails";

// Helper to check if this is the first transaction of the month

export async function createMonthlyStatementIfNeeded(portfolioContext: PortfolioContextType, newTscTime: number): Promise<void> {

    if (!portfolioContext || !portfolioContext.selectedPortPath || !portfolioContext.mtmTimeStamp) {
        console.error("Portfolio context or selected portfolio path is not available.");
        return;
    }
    const prevMonthEndTime = dayjs(portfolioContext.mtmTimeStamp).endOf('month').valueOf();
    console.log(`Previous month end time: ${dayjs(prevMonthEndTime).tz().format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`New transaction time: ${dayjs(newTscTime).tz().format('YYYY-MM-DD HH:mm:ss')}`);
    if (newTscTime < prevMonthEndTime) {
        console.log("New transaction time is before the last month end, no need to create a new monthly statement.");
        return;
    } else {
        console.log("Creating new monthly statement for the current month.");
        // Here you would implement the logic to create a new monthly statement
        // This could involve updating the portfolio context or making an API call
        // For example:
        let monthEndSnapshot: PortfolioContextType = portfolioContext;
        const statementYear = dayjs(prevMonthEndTime).tz().format('YYYY');
        const statementMonth = dayjs(prevMonthEndTime).endOf('month').format('YYYY-MM');
        try {
            // Update the portfolio market prices first
            await portfolioMtmUpdate(portfolioContext, dayjs(prevMonthEndTime).tz().format('YYYY-MM-DD'));

            // Fetch the current portfolio summary
            await getDoc(doc(db, portfolioContext.selectedPortPath, 'portfolio_summary', 'current')).then((docSnap) => {
                if (docSnap.exists()) {
                    monthEndSnapshot = docSnap.data() as PortfolioContextType;
                } else {
                    console.warn("No current portfolio summary found, using existing portfolio context.");
                }
            });

            // Set the new monthly summary document
            await setDoc(doc(db, `${portfolioContext.selectedPortPath}/portfolio_summary/${statementYear}`), {
                [`${statementMonth}`]: monthEndSnapshot
            }, { merge: true });

            console.log(`Monthly statement for ${statementYear}-${statementMonth} created successfully.`);
        } catch (error) {
            console.error("Error creating monthly statement:", error);
            return;
        }
    }

}


export async function portfolioMtmUpdate(portfolioContext: PortfolioContextType, cutOffTime: string = dayjs().tz().format('YYYY-MM-DD')): Promise<void> {
    console.log('Updating portfolio market prices...');
    if (!portfolioContext || !portfolioContext.currentPositions) return;
    const portfolioSumDocPath = `${portfolioContext.selectedPortPath}/portfolio_summary/current`;

    const tickerList = Object.keys(portfolioContext.currentPositions);
    if (tickerList.length === 0) {
        console.warn('No positions to update');
        return;
    }

    try {
        const mktPriceList = await markToMarket(tickerList, cutOffTime);
        if (!mktPriceList) {
            console.log('Failed to update market prices');
            return;
        }

        const updatedPortPositions: { [key: string]: SinglePosition } = { ...portfolioContext.currentPositions };

        for (const ticker of tickerList) {
            if (!(mktPriceList[ticker])) {
                console.warn(`No market price found for ${ticker}`);
                continue;
            }
            const mktPrice = mktPriceList[ticker];
            updatedPortPositions[ticker].marketPrice = mktPrice;
            updatedPortPositions[ticker].marketValue = mktPrice * updatedPortPositions[ticker].amount;
            updatedPortPositions[ticker].pnl = (mktPrice - updatedPortPositions[ticker].avgCost) * updatedPortPositions[ticker].amount;
            updatedPortPositions[ticker].pnlPct = ((mktPrice / updatedPortPositions[ticker].avgCost - 1) * 100).toFixed(2) + '%';
        }

        const updatedPositionValue = Object.values(updatedPortPositions).reduce((acc, pos) => acc + pos.marketValue, 0);
        const updatedNetWorth = portfolioContext.cashBalance + updatedPositionValue;

        console.log(`Updated positions:`, updatedPortPositions);

        await setDoc(doc(db, portfolioSumDocPath), {
            positionValue: updatedPositionValue,
            netWorth: updatedNetWorth,
            currentPositions: updatedPortPositions,
            mtmTimeStamp: dayjs(cutOffTime, 'YYYY-MM-DD').valueOf(),
        }, { merge: true });

        console.log('Portfolio MTM update successful');

    } catch (error: any) {
        console.error(`Error in portfolioMtmUpdate: ${error.message}`);
        // Don't throw error - just log it so transaction doesn't fail
    }
}


export async function markToMarket(tickerList: string[], mtmDate: string): Promise<any | undefined> {
    if (!auth.currentUser) {
        console.warn('No authenticated user found');
        return undefined;
    }

    try {
        const token = await auth.currentUser.getIdToken();
        const response = await axios.post(`${serverURL}/batch-mtm`, {
            tickerList: tickerList,
            date: mtmDate,
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Market prices loaded successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error loading market prices:', error);
        return undefined;
    }
}

export function isDateTimeDisabled(dateTime: dayjs.Dayjs, mtmTimeStamp:number): boolean {
    const isAfter: boolean = dateTime.valueOf() > dayjs().endOf('day').valueOf();
    let isBefore: boolean; // prevent logging cashflow in the past
    if (!mtmTimeStamp) {
        isBefore = false;
    } else {
        isBefore = dateTime.add(1, 'day').valueOf() < mtmTimeStamp;
    }
    return isBefore || isAfter;
}