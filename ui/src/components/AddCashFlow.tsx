
import { useContext, useEffect, useMemo, useState } from "react";

import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';


import { LoadingBox, MessageBox, styleMainColBox, styleModalBox, valueFormatter2D } from "./ZCommonComponents";
import { db } from '../utils/firebaseConfig';
import type { CashflowEntry } from "../utils/dataInterface";
import { doc, setDoc } from "firebase/firestore";

// date time
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { PortfolioContext } from "../utils/contexts";
import { createMonthlyStatementIfNeeded, isDateTimeDisabled, portfolioMtmUpdate } from "../utils/monthlyPortfolioSummary";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Sydney");

// add cash flow entry and monthly cashflow summary
export default function AddCashFlow(props: { open: boolean, onClose: () => void, }) {
    const portfolioContext = useContext(PortfolioContext);

    const [cTime, setCTime] = useState<number>(dayjs(portfolioContext?.mtmTimeStamp).valueOf()+1)
    const typeOptions = ['in', 'out'];
    const [selectedType, setSelectedType] = useState<'in' | 'out'>('in');
    const [amount, setAmount] = useState<number>(0);
    const [selectedReason, setSelectedReason] = useState<string>('');
    const reasonOptions = useMemo(() => {
        if (selectedType === 'in') {
            setSelectedReason('cash in');
            return ['cash in', 'other'];
        } else {
            setSelectedReason('cash out');
            return ['cash out', 'other'];
        }
    }, [selectedType]);
    const [note, setNote] = useState<string>('');

    // const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const [dialogMessage, setDialogMessage] = useState<string | undefined>(undefined);
    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    async function processAddCashFlow() {
        // 1. add a new field in `cashflow_summary` in the corresponding year
        // 2. update the a) cashflow count, b)the cash_bal, c)net_worth in `portfolioContext.selectedPortPath/portfolio_summary/current`
        if (!portfolioContext) return;
        const newIdCount = portfolioContext.cashflowCount + 1;
        const cfID = `cf_${newIdCount.toString().padStart(6, '0')}`;
        const cfYear = dayjs(cTime).tz().format('YYYY');

        const cfSumDocRef = doc(db, `${portfolioContext.selectedPortPath}/cashflow_summary/${cfYear}`);
        const portSumDocRef = doc(db, `${portfolioContext.selectedPortPath}/portfolio_summary/current`);

        const newCashFlow: CashflowEntry = {
            date: dayjs(cTime).tz().format('YYYY-MM-DD'),
            type: selectedType,
            amount: amount,
            balPrev: portfolioContext.cashBalance,
            balAfter: selectedType === 'in' ? portfolioContext.cashBalance + amount : portfolioContext.cashBalance - amount,
            reason: selectedReason,
            timeStamp: cTime,
            note: note,
            createdAt: dayjs().tz().format('YYYY-MM-DD HH:mm:ss z'),
        };
        try {
            setIsLoading(true);
            await createMonthlyStatementIfNeeded(portfolioContext, cTime);

            await setDoc(cfSumDocRef, { [cfID]: newCashFlow }, { merge: true })

            let updatedSelfCapital = portfolioContext.selfCapital;
            switch (selectedReason) {
                case 'cash in':
                    console.log(`cash in, amount: `, amount);
                    updatedSelfCapital += amount;
                    break;
                case 'cash out':
                    console.log(`cash out, amount: `, amount);
                    updatedSelfCapital -= amount;
                    break;
            }

            const updateContent = {
                cashflowCount: newIdCount,
                cashBalance: newCashFlow.balAfter,
                netWorth: newCashFlow.balAfter + portfolioContext.positionValue,
                selfCapital: updatedSelfCapital,
                mtmTimeStamp: cTime,
            }

            await setDoc(portSumDocRef, updateContent, { merge: true }).then(() => {
                console.log(`addCashFlow: ${cfID} added successfully`);
            })
        } catch (error: any) {
            console.error(`addCashFlow: ${error.message}`);
            setErrorMessage(`Failed to add cash flow: ${error.message}`);
        }
    }

    function addCashFlow() {
        if ((selectedReason === 'cash in' || selectedReason === 'cash out') && note !== '') {
            setDialogMessage(`Are you sure you want to process a "${selectedReason}" operation? It will contribute to self funded capital calculation.`);
            return;
        } else if (selectedReason === 'other' && note === '') {
            setDialogMessage('You chose "other" as reason, but did not provide a note. Sure you want to proceed?');
            return;
        }
        processAddCashFlow();
    }

    function handleConfirm() {
        setDialogMessage(undefined);
        processAddCashFlow();
    }

    function handleAbort() {
        setDialogMessage(undefined);
        setInfoMessage("Operation aborted by user.");
    }

    function handleClose() {
        setSelectedType('in');
        setAmount(0);
        setNote('');
        setInfoMessage(undefined);
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        setIsLoading(false);
        props.onClose();
    }

    // use isLoading to control if market-to-market update is needed
    useEffect(() => {
        if (!portfolioContext || !isLoading) return;
        portfolioMtmUpdate(portfolioContext, dayjs(cTime + 1).tz().format('YYYY-MM-DD')).then(() => {
            console.log('Portfolio MTM update completed');
            setSuccessMessage(`Cashflow: ${selectedType} ${valueFormatter2D(amount)} for ${selectedReason} added successfully`);
        }).catch((error) => {
            console.error(`Error in portfolio MTM update: ${error.message}`);
        });
    }, [portfolioContext]);

    return (
        <Modal open={props.open} onClose={handleClose}>
            <Box sx={styleModalBox}>
                <Box sx={styleMainColBox}>
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> <CurrencyExchangeOutlinedIcon /> </Avatar>
                    <Typography component="h1" variant="h5">
                        New Cashflow
                    </Typography>
                    <Grid container spacing={2} my={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <DateTimePicker
                                    label='Time'
                                    value={dayjs(cTime)}
                                    shouldDisableDate={(date: Dayjs) => isDateTimeDisabled(date, portfolioContext!.mtmTimeStamp)}
                                    onChange={(newValue) => {
                                        if (newValue) setCTime(newValue.valueOf())
                                    }}
                                />
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel> Type</InputLabel>
                                <Select
                                    fullWidth
                                    label={'Type'}
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value as 'in' | 'out')}
                                >
                                    {typeOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel> Reason </InputLabel>
                                <Select
                                    fullWidth
                                    label={'Reason'}
                                    value={selectedReason}
                                    onChange={(e) => setSelectedReason(e.target.value as string)}
                                >
                                    {reasonOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </Grid>
                        <Button variant="contained" sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }} onClick={addCashFlow} >
                            add
                        </Button>
                        <Button variant="contained" sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }} onClick={handleClose} >
                            cancel
                        </Button>
                    </Grid>

                    <Dialog open={dialogMessage ? true : false} onClose={handleAbort}>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogContent>
                            {dialogMessage}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleAbort} color="secondary">Abort</Button>
                            <Button onClick={handleConfirm} color="primary">Confirm</Button>
                        </DialogActions>
                    </Dialog>
                    {isLoading && <LoadingBox open={isLoading} onClose={() => setIsLoading(false)} />}
                    {infoMessage && <MessageBox open={infoMessage ? true : false} onClose={() => setInfoMessage(undefined)} type='info' message={infoMessage} />}
                    {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
                    {successMessage && <MessageBox open={successMessage ? true : false} onClose={() => {
                        handleClose();
                    }} type='success' message={successMessage} />}
                </Box>
            </Box>
        </Modal>
    );
}
