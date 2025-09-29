import { Box, Divider, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Typography } from "@mui/material";
import { auth } from "../utils/firebaseConfig";
import { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../utils/contexts";
import { Logout, ExpandLess, ExpandMore } from '@mui/icons-material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import LockResetIcon from '@mui/icons-material/LockReset';
import { sendPasswordResetEmail } from "firebase/auth";
import { MessageBox } from "./ZCommonComponents";

export default function DrawerContent(props: {
    setDrawerOpen: (open: boolean) => void,
    setIsAddNewPortfolio: (open: boolean) => void
}) {
    const appContext = useContext(AppContext);
    const selfPortList = useMemo(() => appContext?.selfPortfolioList, [appContext]);
    const sharedPortList = useMemo(() => appContext?.sharedPortfolioList, [appContext]);
    const selectedPortfolio = useMemo(() => appContext?.selectedPortfolio, [appContext]);

    const [isOpenSelfPortfolioList, setIsOpenSelfPortfolioList] = useState<boolean>(true);
    const [isOpenSharedPortfolioList, setIsOpenSharedPortfolioList] = useState<boolean>(false);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
    const availableLanguages: Record<string, string> = {
        'en': 'English',
        'zh-CN': '中文（简体）',
        'zh-TW': '中文（繁體）',
        'ja': '日本語',
        'fr': 'Français'
    };
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

    function handleLanguageChange(lang: string) {
        setSelectedLanguage(lang);
        setAnchorEl(null);
        localStorage.setItem('preferredLang', lang);
        const googleCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (googleCombo) {
            googleCombo.value = lang;
            googleCombo.dispatchEvent(new Event('change'));
        }
    }

    useEffect(() => {
        const preferredLang = localStorage.getItem('preferredLang');
        if (preferredLang && preferredLang != 'en'){
            handleLanguageChange(preferredLang);
        }
    }, []);

    return (
        <div >
            <Toolbar sx={{ backgroundColor: '#1976d2', color: '#fff' }}>
                <Box>
                    <IconButton color="inherit" onClick={(event) => setAnchorEl(event.currentTarget)}>
                        <GTranslateIcon />
                    </IconButton>
                    <Menu translate="no" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        {Object.keys(availableLanguages).map((lang) => (
                            <MenuItem key={lang} selected={lang === selectedLanguage} onClick={() => handleLanguageChange(lang)}>{availableLanguages[lang]}</MenuItem>
                        ))}
                    </Menu>

                </Box>
                <Typography translate="no" variant='h6' component="div" sx={{ flexGrow: 1 }}>
                    {availableLanguages[selectedLanguage]}
                </Typography>
            </Toolbar>
            <Divider />

            <List>
                <ListItemButton onClick={() => setIsOpenSelfPortfolioList(!isOpenSelfPortfolioList)}>
                    <ListItemIcon> <AccountBalanceWalletIcon /> </ListItemIcon>
                    <ListItemText primary='My Portfolios'/>
                    {isOpenSelfPortfolioList ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                {isOpenSelfPortfolioList && selfPortList && Object.keys(selfPortList).length > 0 && Object.keys(selfPortList).map((portId) => (
                    <ListItemButton key={portId} sx={{ pl: 4 }} selected={selectedPortfolio === portId} onClick={() => handlePortfolioSelect(portId)}>
                        <ListItemIcon><ArrowRightAltIcon /></ListItemIcon>
                        <ListItemText translate="no" primary={selfPortList[portId].portfolio_name} />
                    </ListItemButton>
                ))}
                {isOpenSelfPortfolioList && (!selfPortList || Object.keys(selfPortList).length === 0) &&
                    <ListItemButton disabled>
                        <ListItemText primary='No portfolios. Please add one.' />
                    </ListItemButton>
                }
                <Divider />

                <ListItemButton onClick={() => setIsOpenSharedPortfolioList(!isOpenSharedPortfolioList)}>
                    <ListItemIcon> <AccountBalanceWalletIcon /> </ListItemIcon>
                    <ListItemText primary='Shared With Me' />
                    {isOpenSharedPortfolioList ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                {isOpenSharedPortfolioList && sharedPortList && Object.keys(sharedPortList).length > 0 && Object.keys(sharedPortList).map((portId) => (
                    <ListItemButton key={portId} sx={{ pl: 4 }} selected={selectedPortfolio === portId} onClick={() => handlePortfolioSelect(portId)}>
                        <ListItemIcon><ArrowRightAltIcon /></ListItemIcon>
                        <ListItemText translate="no" primary={sharedPortList[portId].portfolio_name} />
                    </ListItemButton>
                ))}
                {isOpenSharedPortfolioList && (!sharedPortList || Object.keys(sharedPortList).length === 0) &&
                    <ListItemButton disabled>
                        <ListItemText primary='No portfolios shared with you' />
                    </ListItemButton>
                }
                <Divider />

                <ListItemButton onClick={() => props.setIsAddNewPortfolio(true)}>
                    <ListItemIcon> <AddToPhotosIcon /> </ListItemIcon>
                    <ListItemText primary='Add Portfolio' />
                </ListItemButton>
                <Divider />
                <ListItemButton onClick={() => handleResetPassword()}>
                    <ListItemIcon> <LockResetIcon /> </ListItemIcon>
                    <ListItemText primary='Reset Password' />
                </ListItemButton>
                <Divider />
                <ListItemButton onClick={() => handleLogOut()}>
                    <ListItemIcon> <Logout /> </ListItemIcon>
                    <ListItemText primary={`Log Out As (${auth.currentUser?.email})`} />
                </ListItemButton>
            </List>


            {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
            {successMessage && <MessageBox open={successMessage ? true : false} onClose={() => { setSuccessMessage(undefined); }} type='success' message={successMessage} />}
        </div>
    );
}
