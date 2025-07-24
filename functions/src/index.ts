import { onRequest } from "firebase-functions/v2/https";
import express from 'express';
import cors from 'cors';

import yahooFinance from 'yahoo-finance2';

// // date time
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { auth } from './firebaseConfig';
import { authenticateUser } from "./middleware";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Sydney");


const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${auth}`);
    console.log(`******************** Server time: ${dayjs().tz().format('hh:mm A, DD MMM YYYY, UTCZ')} ********************`);
    console.log(`******************** endpoint: ${req.path} ********************`);
    console.log('req.headers: \n', req.headers);
    console.log('req.body: \n', req.body);
    console.log(``);
    next();
});


app.get('/', (req, res) => {
    res.send('This is Track Invest.');
});


// Endpoint to get the close price of a stock for a specific date
app.post('/close-price', authenticateUser, async (req, res) => {
    try {
        const ticker = req.body.ticker;
        const date = req.body.date;

        const requestedDate = dayjs(date, 'YYYY-MM-DD').endOf('day');
        const startDate = requestedDate.subtract(5, 'days').toDate();
        const endDate = requestedDate.add(1, 'days').toDate();

        const historical = await yahooFinance.historical(ticker, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });
        if (!historical || historical.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No historical data found for this symbol'
            });
        } else {
            return res.status(200).json({
                success: true,
                historical: historical.pop(),
                requestedDate: requestedDate.valueOf(),
            });
        }
    } catch (error) {
        console.error('Error fetching close price:', error);
        return res.status(500).send('Error fetching close price');
    }
});


app.post('/batch-mtm', authenticateUser, async (req, res) => {
    const tickerList = req.body.tickerList;
    const date = req.body.date;

    // Validate input
    if (!tickerList || !Array.isArray(tickerList) || tickerList.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid tickers array'
        });
    }

    if (!date) {
        return res.status(400).json({
            success: false,
            error: 'Date is required'
        });
    }

    const requestedDate = dayjs(date, 'YYYY-MM-DD').endOf('day');
    const startDate = requestedDate.subtract(5, 'days').toDate();
    const endDate = requestedDate.add(1, 'days').toDate();

    // Use Promise.allSettled to handle individual failures gracefully
    const historicalPromises = tickerList.map(async (ticker: string) => {
        try {
            const data = await yahooFinance.historical(ticker, {
                period1: startDate,
                period2: endDate,
                interval: '1d'
            });
            console.log(`Fetched data for ${ticker}:`, data.pop()?.close);
            return { ticker: ticker, closePrice: data[data.length - 1].close, success: true };
        } catch (error) {
            console.error(`Error fetching data for ${ticker}:`, error);
            return { ticker: ticker, success: false };
        }
    });

    const results = await Promise.allSettled(historicalPromises);
    const formattedResults: { [key: string]: number } = {};
    for (const result of results) {
        if (result.status === 'fulfilled') {
            formattedResults[result.value.ticker] = result.value.closePrice!;
        }
    }
    console.log(formattedResults);

    return res.status(200).json({
        data: formattedResults,
        requestedDate: requestedDate.valueOf(),
    });
});



// Configure the function to allow unauthenticated access
exports.app = onRequest({
    cors: true,
    invoker: "public"
}, app);