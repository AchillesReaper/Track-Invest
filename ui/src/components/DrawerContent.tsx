import { Divider, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import { auth } from "../utils/firebaseConfig";
import { useContext, useMemo, useState } from "react";
import { AppContext } from "../utils/contexts";
import { AccountCircle, Logout } from '@mui/icons-material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import { sendPasswordResetEmail } from "firebase/auth";
import { MessageBox } from "./ZCommonComponents";

export default function DrawerContent(props: {
    setDrawerOpen: (open: boolean) => void,
    setIsAddNewPortfolio: (open: boolean) => void
}) {
    const appContext = useContext(AppContext);
    const portList = useMemo(() => appContext?.portList, [appContext]);
    const selectedPortfolio = useMemo(() => appContext?.selectedPortfolio, [appContext]);

    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)

    function handleLogOut() {
        auth.signOut().then(() => {
            console.log('logout success');
        }).catch((error) => {
            console.log('logout error:', error);
        })
    }

    function handlePortfolioSelect(portfolioId: string) {
        if (appContext?.updateSelectedPortfolio) {
            appContext.updateSelectedPortfolio(portfolioId);
            props.setDrawerOpen(false); // Close drawer on mobile after selection
        }
    };

    function handleResetPassword() {
        if (auth.currentUser?.email) {
            sendPasswordResetEmail(auth, auth.currentUser.email).then(() => {
                console.log('Password reset email sent');
                setSuccessMessage(`Password reset email sent to ${auth.currentUser!.email}. Please check from sender: noreply@family-funds-f9628.firebaseapp.com.`);
            }).catch((error) => {
                console.log('Error sending password reset email:', error);
                setErrorMessage('Error sending password reset email');
            });
        } else {
            setErrorMessage('No user is currently logged in.');
        }
    }

    return (
        <div >
            <Toolbar sx={{ backgroundColor: '#1976d2', color: '#fff' }}>
                <IconButton color="inherit"  >
                    < AccountCircle />
                </IconButton>
                <Typography variant='h6' component="div" sx={{ flexGrow: 1 }}>
                    {auth.currentUser?.displayName || 'Guest'}
                </Typography>
            </Toolbar>
            <Divider />

            <List>
                {portList && portList.map((port) => (
                    <ListItemButton
                        key={port}
                        selected={selectedPortfolio === port}
                        onClick={() => handlePortfolioSelect(port)}
                    >
                        <ListItemIcon> <AccountBalanceWalletIcon /> </ListItemIcon>
                        <ListItemText primary={port} />
                    </ListItemButton>
                ))}
                <Divider />
                <ListItemButton onClick={() => props.setIsAddNewPortfolio(true)}>
                    <ListItemIcon> <AddToPhotosIcon /> </ListItemIcon>
                    <ListItemText primary='Add Portfolio' />
                </ListItemButton>
                <Divider />
                <ListItemButton onClick={() => handleResetPassword()}>
                    <ListItemIcon> <AccountCircle /> </ListItemIcon>
                    <ListItemText primary='Reset Password' />
                </ListItemButton>
                <Divider />
                <ListItemButton onClick={() => handleLogOut()}>
                    <ListItemIcon> <Logout /> </ListItemIcon>
                    <ListItemText primary={`Log Out`} />
                </ListItemButton>
            </List>


            {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
            {successMessage && <MessageBox open={successMessage ? true : false} onClose={() => { setSuccessMessage(undefined); }} type='success' message={successMessage} />}
        </div>
    );
}
