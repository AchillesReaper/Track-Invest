
import { useContext, useState } from "react";

import { Avatar, Box, Button, FormControl, Grid, InputLabel, MenuItem, Modal, Select, TextField, Typography } from "@mui/material";
import CurrencyExchangeOutlinedIcon from '@mui/icons-material/CurrencyExchangeOutlined';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';


import { LoadingBox, MessageBox, styleMainColBox, styleModalBox } from "./ZCommonComponents";
import { db } from '../utils/firebaseConfig';
import type { CashflowEntry } from "../utils/dataInterface";
import { doc, setDoc } from "firebase/firestore";

// date time
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { AppContext } from "../utils/contexts";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Sydney");

// add cash flow entry and monthly cashflow summary
export default function AddCashFlow(props: { open: boolean, onClose: () => void, }) {
    const appContext = useContext(AppContext);

    const [cTime, setCTime] = useState<number>(dayjs().valueOf())
    const typeOptions = ['in', 'out'];
    const [selectedType, setSelectedType] = useState<'in' | 'out'>('in');
    const [amount, setAmount] = useState<number>(0);
    const reasonOptions = ['cash in', 'sell', 'buy', 'cash out', 'other'];
    const [selectedReason, setSelectedReason] = useState<'cash in' | 'sell' | 'buy' | 'cash out' | 'other'>('cash in');
    const [note, setNote] = useState<string>('');

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    function addCashFlow() {
        // add a new cash flow entry in collection `cashflow`; -> no need!!
        // add a new field in `cashflow_summary` in the corresponding year
        // update the a) cashflow count, b)the cash_bal, c)net_worth in `appContext.selectedPortPath`
        if (!appContext) return;
        const newIdCount = appContext.cashflowCount + 1;
        const cfID = `cf_${newIdCount.toString().padStart(6, '0')}`;
        const cfYear = dayjs(cTime).tz().format('YYYY');
        const cfSumDocRef = doc(db, `${appContext.selectedPortPath}/cashflow_summary/${cfYear}`);
        const newCashFlow: CashflowEntry = {
            date: dayjs(cTime).tz().format('YYYY-MM-DD'),
            type: selectedType,
            amount: amount,
            bal_prev: appContext.cashBalance,
            bal_after: selectedType === 'in' ? appContext.cashBalance + amount : appContext.cashBalance - amount,
            reason: selectedReason,
            time_stamp: cTime,
            note: note,
            created_at: dayjs().tz().format(),
        };
        setDoc(cfSumDocRef, {[cfID]: newCashFlow}, { merge: true }).then(() => {
            const portSumDocRef = doc(db, appContext.selectedPortPath!);
            setDoc(portSumDocRef, {
                cashflow_count: newIdCount,
                cash: newCashFlow.bal_after,
                net_worth: newCashFlow.bal_after + appContext.positionValue
            }, { merge: true }).then(() => {
                setSuccessMessage(`Cash flow ${cfID} added successfully`);
            })
        }).catch((error) => {
            console.error(`addCashFlow: ${error.message}`);
        })

    }

    return (
        <Modal open={props.open} onClose={props.onClose}>
            <Box sx={styleModalBox}>
                <Box sx={styleMainColBox}>
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> <CurrencyExchangeOutlinedIcon /> </Avatar>
                    <Typography component="h1" variant="h5">
                        Add New Portfolio
                    </Typography>
                    <Grid container spacing={2} my={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth>
                                <DateTimePicker
                                    label='Time'
                                    value={dayjs(cTime)}
                                    shouldDisableTime={(time: Dayjs) => {
                                        return time.valueOf() > dayjs().endOf('day').valueOf()
                                    }}
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
                                    onChange={(e) => setSelectedReason(e.target.value as 'cash in' | 'sell' | 'buy' | 'cash out' | 'other')}
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
                    </Grid>

                    {isLoading && <LoadingBox open={isLoading} onClose={() => setIsLoading(false)} />}
                    {infoMessage && <MessageBox open={infoMessage ? true : false} onClose={() => setInfoMessage(undefined)} type='info' message={infoMessage} />}
                    {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
                    {successMessage && <MessageBox open={successMessage ? true : false} onClose={() => {
                        setSuccessMessage(undefined);
                        props.onClose();
                    }} type='success' message={successMessage} />}
                </Box>
            </Box>
        </Modal>
    );
}
