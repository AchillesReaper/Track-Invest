import { Avatar, Box, Button, Grid, Modal, TextField, Typography } from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { LoadingBox, MessageBox, styleMainColBox, styleModalBox } from "./ZCommonComponents";
import { auth, db } from '../utils/firebaseConfig';
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import dayjs from "dayjs";

export default function AddNewPortfolio(props: { open: boolean, onClose: () => void, }) {
    const [portfolioNmae, setPortfolioName] = useState<string>('new portfolio')
    const [broker, setBroker] = useState<string>('')
    const [note, setNote] = useState<string>('')

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    function addNewPort() {
        if (portfolioNmae === '') {
            setErrorMessage('Portfolio name is required');
            return;
        }
        const newPortDocRef = doc(db, `users/${auth.currentUser!.email}/portfolios`, portfolioNmae);
        setDoc(newPortDocRef, {
            broker: broker,
            note: note,
            cash: 0,
            margin: 0,
            position_value: 0,
            net_worth: 0,
            created_at: dayjs().tz().format(),
        }).then(() => {
            setSuccessMessage(`Portfolio ${portfolioNmae} created successfully`);
        }).catch((error) => {
            setErrorMessage(`addNewPort: ${error.message}`);
        })
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
                                value={portfolioNmae}
                                onChange={(e) => setPortfolioName(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Broker Name"
                                value={broker}
                                onChange={(e) => setBroker(e.target.value)}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                fullWidth
                                label="Note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </Grid>
                        <Button variant="contained" sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }} onClick={addNewPort} >
                            login
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
