import { Autocomplete, Avatar, Box, Button, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import { LoadingBox, MessageBox, styleMainColBox, styleModalBox, valueFormatter2D } from "./ZCommonComponents";
import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext, PortfolioContext } from "../utils/contexts";
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { DateTimePicker } from "@mui/x-date-pickers";
import axios from "axios";
import { auth, db } from "../utils/firebaseConfig";

// date time
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { serverURL } from "../utils/firebaseConfigDetails";
import type { CashflowEntry, SinglePosition, TransactionEntry } from "../utils/dataInterface";
import { doc, setDoc } from "firebase/firestore";
import { createMonthlyStatementIfNeeded, isDateTimeDisabled, portfolioMtmUpdate } from "../utils/monthlyPortfolioSummary";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Sydney");


export default function AddTransaction(props: { open: boolean, onClose: () => void }) {
    const appContext = useContext(AppContext);
    const portfolioContext = useContext(PortfolioContext);

    const assetClassOptions = ['stock', 'bond', 'fund', 'crypto'];
    const [assetClass, setAssetClass] = useState<string>('stock');
    const stockList = appContext!.stockList;
    const tickerOpts = Object.keys(stockList || {});
    const [selectedTicker, setSelectedTicker] = useState<string | undefined>(undefined)

    const [tTime, setTTime] = useState<number>(dayjs(portfolioContext?.mtmTimeStamp).valueOf()+1);
    const [amount, setAmount] = useState<number>(0);
    const [currentTickerAmount, setCurrentTickerAmount] = useState<number>(0)
    const [price, setPrice] = useState<number>(0);
    const typeOptions = ['buy', 'sell'];
    const [selectedType, setSelectedType] = useState<'buy' | 'sell'>('buy');

    const [commission, setCommission] = useState<number>(0);
    const [otherFees, setOtherFees] = useState<number>(0);
    const [note, setNote] = useState<string>('');

    const totalCF = useMemo(() => {
        switch (selectedType) {
            case 'buy':
                return amount * price + commission + otherFees;
            case 'sell':
                return amount * price - commission - otherFees;
            default:
                return 0;
        }
    }, [amount, price, commission, otherFees, selectedType]);

    const [isFinalStep , setIsFinalStep] = useState<boolean>(false)

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)


    const cashflowColPath = `${portfolioContext?.selectedPortPath}/cashflow_summary`
    const transactionColPath = `${portfolioContext?.selectedPortPath}/transactions`
    const portfolioSumDocPath = `${portfolioContext?.selectedPortPath}/portfolio_summary/current`

    async function handleBuy() {
        // 1. check if there is enough cash balance -> log a entry in cashflow
        // 2. create a new transaction object -> add it to corresponding month document
        // 3. update stock position in `portfolioContext.selectedPortPath/position_summary/current`
        // 4. mark to market the portfolio
        if (!selectedTicker) { setErrorMessage('Please select a ticker'); return; }
        if (amount <= 0 || price < 0) { setErrorMessage('Amount and Price must be greater than 0'); return; }
        if (!portfolioContext || !portfolioContext.selectedPortPath) return;

        // ------ 1. if there is enough cash balance -> deduct cash balance
        if (portfolioContext.cashBalance - totalCF < 0) {
            setErrorMessage(`Not enough cash balance. Cash needed: $${valueFormatter2D(totalCF)}, Cash available: $${valueFormatter2D(portfolioContext.cashBalance)}`);
            return;
        }

        try {
            setIsLoading(true);
            console.log(`---------------> Processing ${selectedType} order: ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount} <---------------`);
            await createMonthlyStatementIfNeeded(portfolioContext, tTime);

            const newCfIdCount = portfolioContext.cashflowCount + 1;
            const newCfId = `cf_${newCfIdCount.toString().padStart(6, '0')}`;
            const cfYear = dayjs(tTime).tz().format('YYYY');
            const cfSumDocRef = doc(db, `${cashflowColPath}/${cfYear}`);
            const newCashFlow: CashflowEntry = {
                date: dayjs(tTime).tz().format('YYYY-MM-DD'),
                type: 'out',
                amount: totalCF,
                balPrev: portfolioContext.cashBalance,
                balAfter: portfolioContext.cashBalance - totalCF,
                reason: 'buy',
                timeStamp: tTime,
                note: `Buy ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount}`,
                createdAt: dayjs().tz().format('YYYY-MM-DD HH:mm:ss z'),
            };

            // Execute all Firebase operations
            await setDoc(cfSumDocRef, { [newCfId]: newCashFlow }, { merge: true });
            console.log(`---> 1. Cashflow deducted: (${newCfId}) - ${valueFormatter2D(newCashFlow.amount)}`);

            // ------ 2. update monthly transaction summary
            const newOrderCount = portfolioContext.transactionCount + 1;
            const newOrderId = `tx_${newOrderCount.toString().padStart(6, '0')}`;
            const monthlyOrderSumDocRef = doc(db, `${transactionColPath}/${dayjs(tTime).tz().format('YYYY-MM')}`);
            const newOrder: TransactionEntry = {
                ticker: selectedTicker,
                assetClass: assetClass,
                amount: amount,
                price: price,
                type: selectedType,
                timeStamp: tTime,
                time: dayjs(tTime).tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
                commission: commission,
                otherFees: otherFees,
                totalCost: totalCF,
                note: note,
                createdAt: dayjs().tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
            };

            await setDoc(monthlyOrderSumDocRef, { [newOrderId]: newOrder }, { merge: true });
            console.log(`---> 2. Transaction added: ${newOrderId} - ${selectedTicker} x ${amount}`);

            // ------ 3. update the stock position
            let updatedPosition: SinglePosition | undefined;
            if (currentTickerAmount > 0) {
                // update the existing position
                const currentTickerPosition: SinglePosition = portfolioContext.currentPositions![selectedTicker];
                const updatedAmount = currentTickerPosition.amount + amount;
                const updatedAvgCost = (currentTickerPosition.totalCost + totalCF) / updatedAmount;
                updatedPosition = {
                    ...currentTickerPosition,
                    amount: updatedAmount,
                    avgCost: updatedAvgCost,
                    totalCost: updatedAmount * updatedAvgCost,
                    marketPrice: price,
                    marketValue: updatedAmount * price,
                    pnl: (price - updatedAvgCost) * updatedAmount,
                    pnlPct: ((price - updatedAvgCost) / updatedAvgCost * 100).toFixed(2) + '%',
                };
            } else {
                // create a new position
                updatedPosition = {
                    ticker: selectedTicker,
                    assetClass: assetClass,
                    amount: amount,
                    avgCost: price,
                    totalCost: totalCF,
                    marketPrice: price,
                    marketValue: amount * price,
                    pnl: 0, // no PnL for new position
                    pnlPct: '0.00%',
                };
            }

            const portSumDocRef = doc(db, portfolioSumDocPath);
            await setDoc(portSumDocRef, {
                cashBalance: newCashFlow.balAfter,
                cashflowCount: newCfIdCount,
                transactionCount: newOrderCount,
                currentPositions: {
                    // ...portfolioContext.currentPositions,
                    [selectedTicker]: updatedPosition,
                },
            }, { merge: true });

            console.log(`---> 3. current positions updated:`, updatedPosition);
            setIsFinalStep(true);

            // ------ 4. call mark to market update function to update the market price and summary figures


        } catch (error: any) {
            console.error(`Error processing buy order: ${error.message}`);
            setErrorMessage(`Error processing buy order: ${error.message}`);
        }
    }

    async function handleSell() {
        // 1. create a new transaction object -> log transaction entry to corresponding month document
        // 2. log cashflow entry in cashflow summary
        // 3. update ticker position in `portfolioContext.selectedPortPath/portfolio_summary/current`
        // 4. call mtm update function to update the market price and summary figures
        if (!selectedTicker) { setErrorMessage('Please select a ticker'); return; }
        if (amount <= 0 || price < 0) { setErrorMessage('Amount and Price must be greater than 0'); return; }
        if (amount > currentTickerAmount) { setErrorMessage(`Not enough shares to sell for ${selectedTicker}`); return; }
        if (!portfolioContext || !portfolioContext.currentPositions) return;
        try {
            setIsLoading(true);
            console.log(`---------------> Processing ${selectedType} order: ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount} <---------------`);
            await createMonthlyStatementIfNeeded(portfolioContext, tTime);

            // ------ 1. log transaction entry
            const newOrderCount = portfolioContext.transactionCount + 1;
            const newOrderId = `tx_${newOrderCount.toString().padStart(6, '0')}`;
            const monthlyOrderSumPath = `${portfolioContext.selectedPortPath}/transactions/${dayjs(tTime).tz().format('YYYY-MM')}`;
            const monthlyOrderSumDocRef = doc(db, monthlyOrderSumPath);
            const newOrder: TransactionEntry = {
                ticker: selectedTicker,
                assetClass: assetClass,
                amount: amount,
                price: price,
                type: selectedType,
                timeStamp: tTime,
                time: dayjs(tTime).tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
                commission: commission,
                otherFees: otherFees,
                totalCost: totalCF,
                note: note,
                createdAt: dayjs().tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
            };

            await setDoc(monthlyOrderSumDocRef, { [newOrderId]: newOrder }, { merge: true });
            console.log(`---> 1. Transaction added: ${newOrderId} : ${selectedType} ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount}`);

            // ------ 2. log cashflow entry
            const newCfIdCount = portfolioContext.cashflowCount + 1;
            const newCfId = `cf_${newCfIdCount.toString().padStart(6, '0')}`;
            const cfYear = dayjs(tTime).tz().format('YYYY');
            const cfSumDocRef = doc(db, `${portfolioContext.selectedPortPath}/cashflow_summary/${cfYear}`);
            const newCashFlow: CashflowEntry = {
                date: dayjs(tTime).tz().format('YYYY-MM-DD'),
                type: 'in',
                amount: totalCF,
                balPrev: portfolioContext.cashBalance,
                balAfter: portfolioContext.cashBalance + totalCF,
                reason: 'sell',
                timeStamp: tTime,
                note: `Sell ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount}`,
                createdAt: dayjs().tz().format('YYYY-MM-DD HH:mm:ss z'),
            };

            await setDoc(cfSumDocRef, { [newCfId]: newCashFlow }, { merge: true });
            console.log(`---> 2. Cashflow added: (${newCfId}): +${valueFormatter2D(newCashFlow.amount)}`);

            // ------ 3. update the asset allocation
            const currentTickerPosition: SinglePosition = portfolioContext.currentPositions[selectedTicker];
            const updatedAmount = currentTickerPosition.amount - amount;
            const updatedTickerPosition: SinglePosition = {
                ...currentTickerPosition,
                amount: updatedAmount,
                totalCost: currentTickerPosition.avgCost * updatedAmount,
                marketPrice: price,
                marketValue: updatedAmount * price,
                pnl: (price - currentTickerPosition.avgCost) * updatedAmount,
                pnlPct: ((price / currentTickerPosition.avgCost - 1) * 100).toFixed(2) + '%',
            };
            console.log(`updated amount for ${selectedTicker}: ${updatedAmount}`);
            const updatedPortPositions = portfolioContext.currentPositions;
            if (updatedAmount <= 0) {
                delete updatedPortPositions[selectedTicker];
            } else {
                updatedPortPositions[selectedTicker] = updatedTickerPosition;
            }
            console.log(`updatedPortPositions:`, updatedPortPositions);

            await setDoc(doc(db, portfolioSumDocPath), {
                ...portfolioContext,
                cashBalance: newCashFlow.balAfter,
                cashflowCount: newCfIdCount,
                transactionCount: newOrderCount,
                currentPositions: updatedPortPositions,
            })
            setIsFinalStep(true);

            console.log(`---> 3. current position updated: ${updatedPortPositions}`);

            // ------ 4. call mtm update function to update the market price and summary figures
            // --> follow with useEffect hook to update MTM after new transaction added

        } catch (error: any) {
            console.error(`Error processing sell order: ${error.message}`);
            setErrorMessage(`Error processing sell order: ${error.message}`);
        }
    }


    function handleClose() {
        setSelectedTicker(undefined);
        setAmount(0);
        setCurrentTickerAmount(0);
        setPrice(0);
        setSelectedType('buy');
        setCommission(0);
        setOtherFees(0);
        setNote('');
        setSuccessMessage(undefined);
        setErrorMessage(undefined);
        setInfoMessage(undefined);
        setIsLoading(false);
        props.onClose();
    }


    // mtm after new transaction added
    useEffect(() => {
        if (!isFinalStep || !portfolioContext) return;
        console.log(portfolioContext.currentPositions);
        portfolioMtmUpdate(
            portfolioContext,
            dayjs(tTime).tz().format('YYYY-MM-DD'),
            price
        ).then(() => {
            setIsLoading(false);
            setIsFinalStep(false);
            console.log('---> 4. Portfolio MTM updated successfully');
            console.log(`---------------> ${selectedType} order completed successfully <---------------`);
            setSuccessMessage(`Order ${selectedType} ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount} completed successfully.`);
        }).catch((error) => {
            setIsLoading(false);
            setIsFinalStep(false);
            console.error('Error updating portfolio MTM:', error);
            setErrorMessage(`Error updating portfolio MTM: ${error.message}`);
        });
            
    }, [portfolioContext, isFinalStep]);

    // get reference mkt price and current position amount
    useEffect(() => {
        // set post request to get the ticker price
        if (!portfolioContext || !selectedTicker || assetClass !== 'stock') return;
        setIsLoading(true);
        if (auth.currentUser) {
            auth.currentUser.getIdToken().then((token) => {
                axios.post(`${serverURL}/close-price`, {
                    ticker: selectedTicker,
                    date: dayjs(tTime).tz().format('YYYY-MM-DD'),
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }).then((response) => {
                    setPrice(response.data.historical.close);
                    console.log('close price loaded successfully:', response.data);
                }).catch((error) => {
                    console.error('Error loading close price:', error);
                }).finally(() => {
                    setIsLoading(false);
                });

            });
        }
    }, [tTime, assetClass, selectedTicker]);

    useEffect(() => {
        if (!portfolioContext || !selectedTicker) return;
        if (portfolioContext.currentPositions && portfolioContext.currentPositions?.[selectedTicker]) {
            setCurrentTickerAmount(portfolioContext.currentPositions?.[selectedTicker].amount);
        } else {
            setCurrentTickerAmount(0);
        }
    }, [portfolioContext, selectedTicker]);


    return (
        <Modal open={props.open} onClose={handleClose}>
            <Box sx={styleModalBox}>
                {tickerOpts && portfolioContext && stockList &&
                    <Box sx={styleMainColBox}>
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> <ReceiptIcon /> </Avatar>
                        <Typography component="h1" variant="h5">
                            New Order
                        </Typography>
                        <Grid container spacing={2} my={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>            {/* time */}
                                <FormControl fullWidth>
                                    <DateTimePicker
                                        label='Time'
                                        value={dayjs(tTime)}
                                        shouldDisableDate={(date: Dayjs) => isDateTimeDisabled(date, portfolioContext?.mtmTimeStamp)}
                                        onChange={(newValue) => {
                                            if (newValue) setTTime(newValue.valueOf())
                                        }}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>     {/* asset class */}
                                <FormControl fullWidth>
                                    <InputLabel> Asset Class</InputLabel>
                                    <Select
                                        fullWidth
                                        label={'Asset Class'}
                                        value={assetClass}
                                        onChange={(e) => setAssetClass(e.target.value)}
                                    >
                                        {assetClassOptions.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>     {/* type */}
                                <FormControl fullWidth>
                                    <InputLabel> Type</InputLabel>
                                    <Select
                                        fullWidth
                                        label={'Type'}
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value as 'buy' | 'sell')}
                                    >
                                        {typeOptions.map((option) => (
                                            <MenuItem key={option} value={option}>
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>     {/* ticker */}
                                {assetClass === 'stock'
                                    ? <Autocomplete
                                        fullWidth
                                        options={tickerOpts}
                                        value={selectedTicker}
                                        getOptionLabel={(option) => `${option} : ${stockList[option].longName}`}
                                        renderInput={(params) => <TextField {...params} label="Ticker" />}
                                        onChange={(event, newValue) => {
                                            console.log(event);
                                            if (newValue) setSelectedTicker(newValue);
                                        }}
                                    />
                                    : <TextField
                                        fullWidth
                                        label="ISIN Code"
                                        value={selectedTicker}
                                        onChange={(e) => setSelectedTicker(e.target.value)}
                                    />
                                }
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>     {/* amount */}
                                <TextField
                                    fullWidth
                                    label="Amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>     {/* price */}
                                <TextField
                                    fullWidth
                                    label="Price"
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>     {/* commission */}
                                <TextField
                                    fullWidth
                                    label="Commission"
                                    type="number"
                                    value={commission}
                                    onChange={(e) => setCommission(Number(e.target.value))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>     {/* other fees */}
                                <TextField
                                    fullWidth
                                    label="Other Fees"
                                    type="number"
                                    value={otherFees}
                                    onChange={(e) => setOtherFees(Number(e.target.value))}
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>            {/* note */}
                                <TextField
                                    fullWidth
                                    label="Note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary" align="center">
                                    {`Cash balance: ${valueFormatter2D(portfolioContext.cashBalance)}`}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary" align="center">
                                    {`Current position: ${currentTickerAmount.toLocaleString('en-US')} shares`}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary" align="center">
                                    {selectedType} {selectedTicker} @ ${valueFormatter2D(price)} x {amount}
                                    <ArrowRightAltIcon />
                                    {selectedType === 'buy'
                                        ? `-${valueFormatter2D(totalCF)}`
                                        : `+${valueFormatter2D(totalCF)}`
                                    }
                                </Typography>
                            </Grid>
                            <Button
                                variant="contained"
                                color={selectedType === 'buy' ? 'primary' : 'error'}  // Blue for buy, red for sell
                                sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }}
                                onClick={selectedType === 'buy' ? handleBuy : handleSell}
                            >
                                {selectedType}
                            </Button>
                            <Button variant="contained" sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }} onClick={handleClose} >
                                cancel
                            </Button>
                        </Grid>

                        {isLoading && <LoadingBox open={isLoading} onClose={() => setIsLoading(false)} />}
                        {infoMessage && <MessageBox open={infoMessage ? true : false} onClose={() => setInfoMessage(undefined)} type='info' message={infoMessage} />}
                        {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
                        {successMessage && <MessageBox open={successMessage ? true : false} onClose={handleClose} type='success' message={successMessage} />}
                    </Box>
                }
            </Box>
        </Modal>
    );
}
