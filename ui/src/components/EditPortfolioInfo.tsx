import { Avatar, Box, Button, Checkbox, FormControlLabel, Grid, Modal, TextField, Typography } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

import { LoadingBox, MessageBox, styleMainColBox, styleModalBox } from "./ZCommonComponents";
import { auth, db } from '../utils/firebaseConfig';
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";
import type { NewPortfolio, PortfolioContextType } from "../utils/dataInterface";


export default function EditPortfolioInfo(props: { open: boolean, onClose: () => void, }) {
    const [portfolioName, setPortfolioName] = useState<string>('')
    const [broker, setBroker] = useState<string>('')
    const [note, setNote] = useState<string>('')
    const [isDefault, setIsDefault] = useState<boolean>(true)

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    async function addNewPort() {
        if (portfolioName === '') {
            setErrorMessage('Portfolio name is required');
            return;
        }
        const newPortDocRef = doc(db, `users/${auth.currentUser!.email}/portfolios`, portfolioName);

        try {
            // create new portfolio document
            const newPortfolio: NewPortfolio = {
                broker: broker,
                note: note,
                created_at: dayjs().tz().format(),
                owner: auth.currentUser!.email!, // Set the owner
                sharedWith: [], // Initialize empty sharing array
                sharePermissions: {}, // Initialize empty permissions object
                isPublic: false, // Default to private
            }
            await setDoc(newPortDocRef, newPortfolio);

            // update default portfolio for user
            if (isDefault) {
                const userDocRef = doc(db, `users/${auth.currentUser!.email}`);
                await setDoc(userDocRef, { defaultPortfolio: portfolioName, }, { merge: true });
            }
            // set portfolio summary
            const portfolioSumDocPath = `users/${auth.currentUser!.email}/portfolios/${portfolioName}/portfolio_summary/current`;
            const portfolioSummary: PortfolioContextType = {
                cashBalance: 0,
                marginBalance: 0,
                positionValue: 0,
                netWorth: 0,
                selfCapital: 0,
                cashflowCount: 0,
                transactionCount: 0,
                mtmTimeStamp: 0,
                currentPositions: {},
            }
            await setDoc(doc(db, portfolioSumDocPath), portfolioSummary)
            setSuccessMessage(`Portfolio ${portfolioName} created successfully`);
        } catch (error) {
            setErrorMessage(`addNewPort: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

    }


    function handleClose() {
        setPortfolioName('');
        setBroker('');
        setNote('');
        setIsDefault(true);
        setInfoMessage(undefined);
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        props.onClose();
    }

    return (
        <Modal open={props.open} onClose={handleClose}>
            <Box sx={styleModalBox}>
                <Box sx={styleMainColBox}>
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> <ManageAccountsIcon /> </Avatar>
                    <Typography component="h1" variant="h5">
                        Edit Portfolio
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
                                    <Checkbox checked={isDefault} onChange={() => { setIsDefault(!isDefault) }} />
                                }
                                label="Set as Default?"
                            />
                        </Grid>
                        <Button variant="contained" sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }} onClick={addNewPort} >
                            add
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
            </Box>
        </Modal>
    );
}
