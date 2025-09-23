
import { useContext, useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";

import { Avatar, Box, Button, Checkbox, Chip, Divider, FormControlLabel, Grid, Modal, TextField, Typography } from "@mui/material";
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AddIcon from '@mui/icons-material/Add';

import { auth, db } from '../utils/firebaseConfig';
import type { PortfolioBasicInfo } from "../utils/dataInterface";
import { AppContext, PortfolioContext } from "../utils/contexts";
import { LoadingBox, MessageBox, styleMainColBox, styleModalBox } from "./ZCommonComponents";


export default function EditPortfolioInfo(props: { open: boolean, onClose: () => void, }) {
    const appContext = useContext(AppContext);
    const portfolioContext = useContext(PortfolioContext);

    const [originalPortInfo, setOriginalPortInfo] = useState<PortfolioBasicInfo | undefined>(undefined)
    const [selectedPortfolio, setSelectedPortfolio] = useState<string | undefined>(undefined)
    const [portfolioName, setPortfolioName] = useState<string>('')
    const [broker, setBroker] = useState<string>('')
    const [note, setNote] = useState<string>('')

    const [openShareInput, setOpenShareInput] = useState<boolean>(false)
    const [newShareEmail, setNewShareEmail] = useState<string>('')
    const [sharedWithList, setSharedWithList] = useState<string[]>([])

    const [isDefault, setIsDefault] = useState<boolean>(false)

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)


    async function editPortfolio() {
        if (!selectedPortfolio) return;
        if (portfolioName === '') {
            setErrorMessage('Portfolio name is required');
            return;
        }
        setIsLoading(true);
        const targetPortfolioDocRef = doc(db, `portfolios`, selectedPortfolio);
        const newPortfolio: PortfolioBasicInfo = {
            ...originalPortInfo!,
            broker: broker,
            note: note,
            portfolio_name: portfolioName,
            shared_with: sharedWithList,
        }


        try {
            // update default portfolio for user
            if (isDefault) {
                const userDocRef = doc(db, `users/${auth.currentUser!.email}`);
                await setDoc(userDocRef, { defaultPortfolio: portfolioName, }, { merge: true });
            }

            // create new portfolio document
            await setDoc(targetPortfolioDocRef, newPortfolio, { merge: true });
            setIsLoading(false);
            setSuccessMessage(`Portfolio ${portfolioName} updated successfully`);
        } catch (error) {
            setErrorMessage(`Edit Portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

    }


    function handleAddShared() {
        if (newShareEmail === '') {
            setErrorMessage('Email is required');
            return;
        }
        if (sharedWithList.includes(newShareEmail)) {
            setInfoMessage('This email is already in the share list');
            setNewShareEmail('');
            return;
        }
        setSharedWithList([...sharedWithList, newShareEmail]);
        setNewShareEmail('');
    }


    function handleClose() {
        setPortfolioName('');
        setBroker('');
        setNote('');
        setIsDefault(false);
        setInfoMessage(undefined);
        setErrorMessage(undefined);
        setSuccessMessage(undefined);
        props.onClose();
    }

    useEffect(() => {
        if (portfolioContext) {
            setOriginalPortInfo({
                portfolio_name: portfolioContext.portfolio_name,
                broker: portfolioContext.broker,
                note: portfolioContext.note,
                owner: portfolioContext.owner,
                shared_with: portfolioContext.shared_with,
            });
            setSelectedPortfolio(portfolioContext.selectedPortfolio)
            setPortfolioName(portfolioContext.portfolio_name);
            setBroker(portfolioContext.broker);
            setNote(portfolioContext.note);
            setSharedWithList(portfolioContext.shared_with);
        } else {
            setSelectedPortfolio(undefined)
            setPortfolioName('');
            setBroker('');
            setNote('');
            setSharedWithList([]);
        }
    }, [portfolioContext])

    useEffect(() => {
        if (!appContext || !portfolioContext) return;
        if (appContext.defaultPortfolio === portfolioContext.selectedPortfolio) {
            setIsDefault(true);
        } else {
            setIsDefault(false);
        }
    }, [appContext])


    return (
        <Modal open={props.open} onClose={handleClose}>
            <Box sx={styleModalBox}>
                <Box sx={styleMainColBox}>
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}> <ManageAccountsIcon /> </Avatar>
                    <Typography component="h1" variant="h5">
                        Edit Portfolio
                    </Typography>
                    <Grid container spacing={2} my={2}>
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox checked={isDefault} onChange={() => { setIsDefault(!isDefault) }} />
                                }
                                label="Set as Default?"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>    {/* Portfolio Name */}
                            <TextField
                                fullWidth
                                label="Portfolio Name"
                                placeholder="e.g. My Portfolio"
                                value={portfolioName}
                                onChange={(e) => setPortfolioName(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>    {/* Broker Name */}
                            <TextField
                                fullWidth
                                label="Broker Name"
                                placeholder="e.g. Robinhood, E*TRADE"
                                value={broker}
                                onChange={(e) => setBroker(e.target.value)}
                            />
                        </Grid>
                        <Grid size={12}>    {/* Note */}
                            <TextField
                                fullWidth
                                label="Note"
                                placeholder="e.g. My main portfolio / Family Funds"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12 }}>
                            <Chip label={'share to others'} onClick={() => setOpenShareInput(!openShareInput)} />
                        </Grid>
                        {openShareInput && <>
                            <Grid size={8}>
                                <TextField
                                    fullWidth
                                    label="Share to"
                                    placeholder="Enter email to share with"
                                    value={newShareEmail}
                                    onChange={(e) => { setNewShareEmail(e.target.value) }}
                                />
                            </Grid>
                            <Grid size={4}>
                                <Button onClick={handleAddShared}><AddIcon /></Button>
                            </Grid>
                        </>}

                        {/* display share list */}
                        {sharedWithList && sharedWithList.length > 0 &&
                            <Grid size={{ xs: 12, sm: 12 }}>
                                <Typography variant="caption">Below users can see this portfolio</Typography>
                                <Divider />
                                {sharedWithList.map((email) => (
                                    <Chip key={email} label={email} onDelete={() => setSharedWithList(sharedWithList.filter(e => e !== email))} sx={{ m: 0.5 }} />
                                ))}
                            </Grid>
                        }

                        <Button variant="contained" sx={{ width: '50%', display: 'block', margin: 'auto', my: 1 }} onClick={editPortfolio} >
                            edit
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
