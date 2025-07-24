import { Autocomplete, Avatar, Box, Button, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import { LoadingBox, MessageBox, styleMainColBox, styleModalBox } from "./ZCommonComponents";
import { useContext, useEffect, useState } from "react";
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
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Sydney");


export default function AddTransaction(props: { open: boolean, onClose: () => void }) {
    const appContext = useContext(AppContext);
    const portfolioContext = useContext(PortfolioContext);

    const stockList = appContext?.stockList;
    const tickerOpts = Object.keys(stockList || {});
    const [selectedTicker, setSelectedTicker] = useState<string | undefined>(undefined)

    const [tTime, setTTime] = useState<number>(dayjs().valueOf());
    const [amount, setAmount] = useState<number>(0);
    const [currentTickerAmount, setCurrentTickerAmount] = useState<number>(0)
    const [price, setPrice] = useState<number>(0);
    const typeOptions = ['buy', 'sell'];
    const [selectedType, setSelectedType] = useState<'buy' | 'sell'>('buy');

    const [commission, setCommission] = useState<number>(0);
    const [otherFees, setOtherFees] = useState<number>(0);
    const [note, setNote] = useState<string>('');

    const [totalCF, setTotalCF] = useState<number>(0)

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    function handleBuy() {
        // 1. check if there is enough cash balance -> log a entry in cashflow
        // 2. create a new transaction object -> add it to corresponding month document
        // 3. update the stock position
        // 4. update summary figures in `portfolioContext.selectedPortPath`
        if (!selectedTicker) { setErrorMessage('Please select a ticker'); return; }
        if (amount <= 0 || price <= 0) { setErrorMessage('Amount and Price must be greater than 0'); return; }
        if (!portfolioContext) return;

        // ------ 1. if there is enough cash balance -> deduct cash balance
        if (portfolioContext.cashBalance - totalCF < 0) {
            setErrorMessage(`Not enough cash balance. Cash needed: $${totalCF.toLocaleString('en-US')}, Cash available: $${portfolioContext.cashBalance.toLocaleString('en-US')}`);
            return;
        }
        const newCfIdCount = portfolioContext.cashflowCount + 1;
        const newCfId = `cf_${newCfIdCount.toString().padStart(6, '0')}`;
        const cfYear = dayjs(tTime).tz().format('YYYY');
        const cfSumDocRef = doc(db, `${portfolioContext.selectedPortPath}/cashflow_summary/${cfYear}`);
        const newCashFlow: CashflowEntry = {
            date: dayjs(tTime).tz().format('YYYY-MM-DD'),
            type: 'out',
            amount: totalCF,
            bal_prev: portfolioContext.cashBalance,
            bal_after: portfolioContext.cashBalance - totalCF,
            reason: 'buy',
            time_stamp: tTime,
            note: `Buy ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount}`,
            created_at: dayjs().tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
        };
        setDoc(cfSumDocRef, { [newCfId]: newCashFlow }, { merge: true }).then(() => {
            console.log(`Cashflow deducted: (${newCfId}) - $${newCashFlow.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        }).catch((error) => {
            console.error(`Error adding cashflow: ${error.message}`);
            setErrorMessage(`Error adding cashflow: ${error.message}`);
            return;
        });

        // ------ 2. update monthly transaction summary
        const newOrderCount = portfolioContext.transactionCount + 1;
        const newOrderId = `tx_${newOrderCount.toString().padStart(6, '0')}`;
        const monthlyOrderSumPath = `${portfolioContext.selectedPortPath}/transactions/${dayjs(tTime).tz().format('YYYY-MM')}`;
        const monthlyOrderSumDocRef = doc(db, monthlyOrderSumPath);
        const newOrder: TransactionEntry = {
            ticker: selectedTicker,
            amount: amount,
            price: price,
            type: selectedType,
            time_stamp: tTime,
            time: dayjs(tTime).tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
            commission: commission,
            other_fees: otherFees,
            total_cost: totalCF,
            note: note,
            created_at: dayjs().tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
        }
        setDoc(monthlyOrderSumDocRef, { [newOrderId]: newOrder }, { merge: true }).then(() => {
            console.log(`Transaction added: ${newOrderId} - ${selectedTicker} x ${amount}`);
        }).catch((error) => {
            console.error(`Error adding transaction: ${error.message}`);
            setErrorMessage(`Error adding transaction: ${error.message}`);
            return;
        });

        // ------ 3. update the asset allocation
        let updatedPosition: SinglePosition | undefined;
        if (currentTickerAmount > 0) {
            // update the existing position
            const currentTickerPosition: SinglePosition = portfolioContext.currentPositions![selectedTicker];
            const updatedAmount = currentTickerPosition.amount + amount;
            const updatedAvgCost = (currentTickerPosition.total_cost + totalCF) / updatedAmount;
            updatedPosition = {
                ...currentTickerPosition,
                amount: updatedAmount,
                avg_cost: updatedAvgCost,
                total_cost: updatedAmount * updatedAvgCost,
                marketPrice: price,
                marketValue: updatedAmount * price,
                pnl: (price - updatedAvgCost) * updatedAmount,
                pnlPct: ((price - updatedAvgCost) / updatedAvgCost * 100).toFixed(2) + '%',
            };
        } else {
            // create a new position
            updatedPosition = {
                ticker: selectedTicker,
                amount: amount,
                avg_cost: price,
                total_cost: totalCF,
                marketPrice: price,
                marketValue: amount * price,
                pnl: 0, // no PnL for new position
                pnlPct: '0.00%',
            };
        }
        setDoc(doc(db, `${portfolioContext.selectedPortPath}/position_summary/current`), { [selectedTicker]: updatedPosition }, { merge: true }).then(() => {
            console.log(`Position updated: ${selectedTicker} - ${amount} shares @ $${price.toLocaleString('en-US')}`);
        }).catch((error) => {
            console.error(`Error updating position: ${error.message}`);
            setErrorMessage(`Error updating position: ${error.message}`);
            return;
        });

        // ------ 4. update the account summary
        const portSumDocRef = doc(db, portfolioContext.selectedPortPath!);
        setDoc(portSumDocRef, {
            cashflow_count: newCfIdCount,
            transaction_count: newOrderCount,
            cash: newCashFlow.bal_after,
            position_value: portfolioContext.positionValue + (amount * price),
            net_worth: newCashFlow.bal_after + (portfolioContext.positionValue + (amount * price)),
        }, { merge: true }).then(() => {
            setSuccessMessage(`Order ${newOrderId} done successfully`);
        }).catch((error) => {
            console.error(`Error updating portfolio summary: ${error.message}`);
            setErrorMessage(`Error updating portfolio summary: ${error.message}`);
        });
    }



    function handleSell() {
        // 1. create a new transaction object -> add it to corresponding month document
        // 2. update the stock position
        // 3. log a entry in cashflow
        // 4. update the account summary in `portfolioContext.selectedPortPath`
        if (!selectedTicker) { setErrorMessage('Please select a ticker'); return; }
        if (amount <= 0 || price < 0) { setErrorMessage('Amount and Price must be greater than 0'); return; }
        if (amount > currentTickerAmount) { setErrorMessage(`Not enough shares to sell for ${selectedTicker}`); return; }
        if (!portfolioContext) return;

        // ------ 1. update monthly transaction summary
        const newOrderCount = portfolioContext.transactionCount + 1;
        const newOrderId = `tx_${newOrderCount.toString().padStart(6, '0')}`;
        const monthlyOrderSumPath = `${portfolioContext.selectedPortPath}/transactions/${dayjs(tTime).tz().format('YYYY-MM')}`;
        const monthlyOrderSumDocRef = doc(db, monthlyOrderSumPath);
        const newOrder: TransactionEntry = {
            ticker: selectedTicker,
            amount: amount,
            price: price,
            type: selectedType,
            time_stamp: tTime,
            time: dayjs(tTime).tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
            commission: commission,
            other_fees: otherFees,
            total_cost: totalCF,
            note: note,
            created_at: dayjs().tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
        };
        setDoc(monthlyOrderSumDocRef, { [newOrderId]: newOrder }, { merge: true }).then(() => {
            console.log(`Transaction added: ${newOrderId} : ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount}`);
        }).catch((error) => {
            console.error(`step 2: Error adding transaction: ${error.message}`);
            setErrorMessage(`Error adding transaction: ${error.message}`);
            return;
        });

        // ------ 2. update the asset allocation
        const currentTickerPosition: SinglePosition = portfolioContext.currentPositions![selectedTicker];
        const updatedAmount = currentTickerPosition.amount - amount;
        const updatedTickerPosition: SinglePosition = {
            ...currentTickerPosition,
            amount: updatedAmount,
            total_cost: currentTickerPosition.avg_cost * updatedAmount,
            marketPrice: price,
            marketValue: updatedAmount * price,
            pnl: (price - currentTickerPosition.avg_cost) * updatedAmount,
            pnlPct: ((price / currentTickerPosition.avg_cost - 1) * 100).toFixed(2) + '%',
        };
        setDoc(doc(db, `${portfolioContext.selectedPortPath}/position_summary/current`), { [selectedTicker]: updatedTickerPosition }, { merge: true }).then(() => {
            console.log(`Position updated: ${selectedTicker} - ${updatedAmount} shares`);
        }).catch((error) => {
            console.error(`step3: Error updating position: ${error.message}`);
            setErrorMessage(`Error updating position: ${error.message}`);
            return;
        });

        // ------ 3. log a entry in cashflow
        const newCfIdCount = portfolioContext.cashflowCount + 1;
        const newCfId = `cf_${newCfIdCount.toString().padStart(6, '0')}`;
        const cfYear = dayjs(tTime).tz().format('YYYY');
        const cfSumDocRef = doc(db, `${portfolioContext.selectedPortPath}/cashflow_summary/${cfYear}`);
        const newCashFlow: CashflowEntry = {
            date: dayjs(tTime).tz().format('YYYY-MM-DD'),
            type: 'in',
            amount: totalCF,
            bal_prev: portfolioContext.cashBalance,
            bal_after: portfolioContext.cashBalance + totalCF,
            reason: 'sell',
            time_stamp: tTime,
            note: `Sell ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount}`,
            created_at: dayjs().tz().format('YYYY-MM-DD HH:mm:ss GMT z'),
        };
        setDoc(cfSumDocRef, { [newCfId]: newCashFlow }, { merge: true }).then(() => {
            setSuccessMessage(`Order done! ${newOrderId}: Sell ${selectedTicker} @ $${price.toLocaleString('en-US')} x ${amount}`);
            console.log(`Cashflow added: (${newCfId}): +$${newCashFlow.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        }).catch((error) => {
            console.error(`step 4: Error adding cashflow: ${error.message}`);
            setErrorMessage(`Error adding cashflow: ${error.message}`);
            return;
        });

        // ------ 4. update the account summary
        const portSumDocRef = doc(db, portfolioContext.selectedPortPath!);
        setDoc(portSumDocRef, {
            cash: newCashFlow.bal_after,
            position_value: portfolioContext.positionValue - (amount * currentTickerPosition.avg_cost),
            net_worth: newCashFlow.bal_after + (portfolioContext.positionValue - (amount * currentTickerPosition.avg_cost)),
            cashflow_count: newCfIdCount,
            transaction_count: newOrderCount,
            mtm_time_stamp: tTime,
        }, { merge: true }).then(() => {
            console.log(`Portfolio summary updated: ${portfolioContext.selectedPortPath}`);
        }).catch((error) => {
            console.error(`step 5: Error updating portfolio summary: ${error.message}`);
            setErrorMessage(`Error updating portfolio summary: ${error.message}`);
            return;
        });
    }

    function cleanUpOnClose() {
        setSelectedTicker(undefined);
        setTTime(dayjs().valueOf());
        setAmount(0);
        setCurrentTickerAmount(0);
        setPrice(0);
        setSelectedType('buy');
        setCommission(0);
        setOtherFees(0);
        setNote('');
        setTotalCF(0);
        props.onClose();
    }

    // calculate the total cash flow, return the absolute value of the total cash flow
    useEffect(() => {
        switch (selectedType) {
            case 'buy':
                setTotalCF(amount * price + commission + otherFees);
                break;
            case 'sell':
                setTotalCF(amount * price - commission - otherFees);
                break;
        }
    }, [amount, price, commission, otherFees, selectedType]);

    // get reference mkt price and current position amount
    useEffect(() => {
        // set post request to get the ticker price
        if (!portfolioContext || !selectedTicker) return;
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
        if (portfolioContext.currentPositions && selectedTicker && portfolioContext.currentPositions[selectedTicker]) {
            console.log(`Current position for ${selectedTicker}:`, portfolioContext.currentPositions[selectedTicker]);
            setCurrentTickerAmount(portfolioContext.currentPositions[selectedTicker].amount);
        } else {
            setCurrentTickerAmount(0);
        }
    }, [tTime, selectedTicker, portfolioContext?.currentPositions]);


    return (
        <Modal open={props.open} onClose={cleanUpOnClose}>
            <Box sx={styleModalBox}>
                {tickerOpts && portfolioContext && stockList &&
                    <Box sx={styleMainColBox}>
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> <ReceiptIcon /> </Avatar>
                        <Typography component="h1" variant="h5">
                            New Order
                        </Typography>
                        <Grid container spacing={2} my={2}>
                            <Grid size={{ xs: 12 }}>            {/* time */}
                                <FormControl fullWidth>
                                    <DateTimePicker
                                        label='Time'
                                        value={dayjs(tTime)}
                                        shouldDisableTime={(time: Dayjs) => {
                                            return time.valueOf() > dayjs().endOf('day').valueOf()
                                        }}
                                        onChange={(newValue) => {
                                            if (newValue) setTTime(newValue.valueOf())
                                        }}
                                    />
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
                                <Autocomplete
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
                                    {`Cash balance: $${portfolioContext.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary" align="center">
                                    {`Current position: ${currentTickerAmount.toLocaleString('en-US')} shares`}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary" align="center">
                                    {selectedType} {selectedTicker} @ ${price.toLocaleString('en-US')} x {amount}
                                    <ArrowRightAltIcon />
                                    ${selectedType === 'buy'
                                        ? - (amount * price + commission + otherFees).toLocaleString('en-US', { minimumFractionDigits: 2 })
                                        : + (amount * price - commission - otherFees).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                        </Grid>

                        {isLoading && <LoadingBox open={isLoading} onClose={() => setIsLoading(false)} />}
                        {infoMessage && <MessageBox open={infoMessage ? true : false} onClose={() => setInfoMessage(undefined)} type='info' message={infoMessage} />}
                        {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
                        {successMessage && <MessageBox open={successMessage ? true : false} onClose={() => {
                            setSuccessMessage(undefined);
                            cleanUpOnClose();
                        }} type='success' message={successMessage} />}
                    </Box>
                }
            </Box>
        </Modal>
    );
}
