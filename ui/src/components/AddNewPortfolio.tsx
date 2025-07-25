import { Avatar, Box, Button, Checkbox, FormControlLabel, Grid, Modal, TextField, Typography } from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { LoadingBox, MessageBox, styleMainColBox, styleModalBox } from "./ZCommonComponents";
import { auth, db } from '../utils/firebaseConfig';
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";

export default function AddNewPortfolio(props: { open: boolean, onClose: () => void, }) {
    const [portfolioName, setPortfolioName] = useState<string>('')
    const [broker, setBroker] = useState<string>('')
    const [note, setNote] = useState<string>('')
    const [isDefault, setIsDefault] = useState<boolean>(true)

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    function addNewPort() {
        if (portfolioName === '') {
            setErrorMessage('Portfolio name is required');
            return;
        }
        const newPortDocRef = doc(db, `users/${auth.currentUser!.email}/portfolios`, portfolioName);
        setDoc(newPortDocRef, {
            broker: broker,
            note: note,
            created_at: dayjs().tz().format(),
        }).then(() => {
            setSuccessMessage(`Portfolio ${portfolioName} created successfully`);
            if (isDefault) {
                // set this portfolio as default
                const userDocRef = doc(db, `users/${auth.currentUser!.email}`);
                setDoc(userDocRef, {
                    default_portfolio: portfolioName,
                }, { merge: true }).then(() => {
                    setSuccessMessage(`Portfolio ${portfolioName} is set as default`);
                }).catch((error) => {
                    setErrorMessage(`set default: ${error.message}`);
                });
            }
        }).catch((error) => {
            setErrorMessage(`addNewPort: ${error.message}`);
        })

        // set portfolio summary
        const portfolioSumDocPath = `users/${auth.currentUser!.email}/portfolios/${portfolioName}/portfolio_summary/current`;
        setDoc(doc(db, portfolioSumDocPath), {
            cashBalance: 0,
            marginBalance: 0,
            positionValue: 0,
            netWorth: 0,
            cashflowCount: 0,
            transactionCount: 0,
            mtmTimeStamp: 0,
            currentPositions: {},
        }).then(() => {
            setInfoMessage(`Portfolio summary for ${portfolioName} created successfully`);
        }).catch((error) => {
            setErrorMessage(`addNewPort: ${error.message}`);
        });
    }

    return (
        <Modal open={props.open} onClose={props.onClose}>
            <Box sx={styleModalBox}>
                <Box sx={styleMainColBox}>
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> <PersonAddIcon /> </Avatar>
                    <Typography component="h1" variant="h5">
                        Add New Portfolio
                    </Typography>
                    <Grid container spacing={2} my={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Portfolio Name"
                                placeholder="e.g. My Portfolio"
                                value={portfolioName}
                                onChange={(e) => setPortfolioName(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Broker Name"
                                placeholder="e.g. Robinhood, E*TRADE"
                                value={broker}
                                onChange={(e) => setBroker(e.target.value)}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Note"
                                placeholder="e.g. My main portfolio / Family Funds"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox checked={isDefault} onChange={()=>{setIsDefault(!isDefault)}} />
                                }
                                label="Set as Default?"
                            />
                        </Grid>
                        <Button variant="contained" sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }} onClick={addNewPort} >
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
