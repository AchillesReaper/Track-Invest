// react components
import { useContext, useState } from 'react';

// thrid party libraries
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import AccountSummary from './components/AccountSummary';
import ChartPositionAllocation from './components/ChartPositionAllocation';
import ChartPnL from './components/ChartPnL';
import DetailTables from './components/DetailTables';

// local components
import AuthLogin from './components/AuthLogin';
import { auth } from './utils/firebaseConfig';
import AddNewPortfolio from './components/AddNewPortfolio';
import { AppContext } from './utils/contexts';


export default function App() {
    const [isAddNewPortfolio, SetIsAddNewPortfolio] = useState<boolean>(false)

    const appContext = useContext(AppContext);
    const isLoggedin = appContext?.isLoggedin || false;
    const portList = appContext?.portList;
    const selectedPortfolio = appContext?.selectedPortfolio;

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
                <ListItemButton onClick={() => SetIsAddNewPortfolio(true)}>
                    <ListItemIcon> <AddToPhotosIcon /> </ListItemIcon>
                    <ListItemText primary='Add Portfolio' />
                </ListItemButton>
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

    const handlePortfolioSelect = (portfolioId: string) => {
        if (appContext?.updateSelectedPortfolio) {
            appContext.updateSelectedPortfolio(portfolioId);
            setDrawerOpen(false); // Close drawer on mobile after selection
        }
    };

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
                                    {selectedPortfolio}
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
                    <AddNewPortfolio open={isAddNewPortfolio} onClose={() => SetIsAddNewPortfolio(false)} />
                </Box>
                :
                <AuthLogin />
            }
        </>
    )
}


