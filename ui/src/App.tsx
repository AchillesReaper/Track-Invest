// react components
import { useEffect, useState } from 'react';

// thrid party libraries
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountSummary from './components/AccountSummary';
import ChartPositionAllocation from './components/ChartPositionAllocation';
import ChartPnL from './components/ChartPnL';
import DetailTables from './components/DetailTables';

// local components
import AuthLogin from './components/AuthLogin';
import { auth, db } from './utils/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// date time
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import AddNewPortfolio from './components/AddNewPortfolio';
// import { auth } from './firebaseConfig';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Sydney");

export default function App() {
    const [isLoggedin , setIsLoggedin] = useState<boolean>(false)
    const [isAddNewPortfolio , SetIsAddNewPortfolio] = useState<boolean >(false)

    // 1. ---------- set up the drawer list ----------
    const [drawOpen, setDrawerOpen] = useState<boolean>(false)
    const drawerList =
        <div className="w-[250px] h-full sticky" onClick={() => setDrawerOpen(false)}>
            <AppBar position='sticky'>
                <Toolbar variant="dense" >
                    <IconButton color="inherit" onClick={() => setDrawerOpen(true)} >
                        < AccountCircle />
                    </IconButton>
                    <Typography variant='h6' component="div" sx={{ flexGrow: 1 }}>
                        {auth.currentUser?.displayName || 'Guest'}
                    </Typography>
                </Toolbar>
            </AppBar>
            <List>
                <ListItem >
                    

                </ListItem>
                <ListItemButton onClick={() => SetIsAddNewPortfolio(true)}> Add Portfolio </ListItemButton>
                <Divider />
                <ListItemButton onClick={() => handleLogOut()}>
                    <ListItemIcon> <Logout /> </ListItemIcon>
                    <ListItemText primary={`Log Out`} />
                </ListItemButton>
            </List>
        </div>

    // ---------- 2. functions ----------
    const handleLogOut = () => {
        auth.signOut().then(() => {
            console.log('logout success');
        }).catch((error) => {
            console.log('logout error:', error);
        })
    }

    // ************ side effects ************
    useEffect(() => {
        console.log(auth.currentUser?.email);
        // any side effects can be added here
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setIsLoggedin(true);
                console.log(`User is signed in: ${user.email}`);
                // check if user acc is set in the database
                const userPathRef = doc(db, `/users/${user.email}`);
                getDoc(userPathRef).then((userAcc) => {
                    if (!userAcc.exists()) {
                        console.log('No user account found, creating a new one...');
                        setDoc(userPathRef, {
                            email: user.email,
                            createdAt: dayjs().tz().format(),
                        }).then(() => {
                            console.log('New user account created successfully');
                        }).catch((error) => {
                            console.error('Error creating user account:', error);
                        });
                    }
                }).catch((error) => {
                    console.error('Error fetching user account:', error);
                });
            } else {
                setIsLoggedin(false);
                console.log('No user is signed in');
            }
        });
        return () => unsubscribe();
    }, [auth])

    return (
        <>
            {isLoggedin
                ?
                <Box className='main' sx={{ minHeight: '100vh', display: 'flex' }}>
                    {/* md view */}
                    <Drawer anchor='left' variant='permanent' sx={{ display: { xs: 'none', md: 'block' }, width: 250 }} >
                        {drawerList}
                    </Drawer>
                    {/* xs view */}
                    <Drawer anchor='left' variant="temporary" sx={{ display: { md: 'none' } }} open={drawOpen} onClose={() => setDrawerOpen(false)}>
                        {drawerList}
                    </Drawer>

                    <Box sx={{ flexGrow: 1, flexShrink: 1, display: 'flex', flexDirection: 'column' }}>
                        <AppBar position='sticky'>
                            <Toolbar variant="dense">
                                <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={() => setDrawerOpen(true)} >
                                    <MenuIcon />
                                </IconButton>
                                <Typography variant='h6' component="div" sx={{ flexGrow: 1 }}>
                                    Portfolio Name
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        <div className="grid grid-cols-1">
                            <AccountSummary />
                            <div className="mainRow2">
                                <ChartPositionAllocation />
                                <ChartPnL />
                            </div>
                            <DetailTables />
                        </div>
                    </Box>
                </Box>
                :
                <AuthLogin />
            }
            <AddNewPortfolio open={isAddNewPortfolio} onClose={() => SetIsAddNewPortfolio(false)} />
        </>

    )
}


