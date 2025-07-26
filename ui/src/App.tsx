// react components
import { useContext, useState } from 'react';

// thrid party libraries
import { AppBar, Box, CssBaseline, Divider, Drawer, Grid, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
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

    const drawerWidth = 250; // Define the width of the drawer

    // 1. ---------- set up the drawer list ----------
    const [drawOpen, setDrawerOpen] = useState<boolean>(false)
    const drawerContext = (
        <div >
            <Toolbar sx={{ backgroundColor: '#1976d2', color: '#fff' }}>
                <IconButton color="inherit" onClick={() => setDrawerOpen(true)} >
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
    )

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
                <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex' }}>
                    <CssBaseline />

                    <AppBar
                        position="fixed"
                        sx={{
                            width: { sm: `calc(100% - ${drawerWidth}px)` },
                            ml: { sm: `${drawerWidth}px` },
                        }}
                    >
                        <Toolbar>
                            <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={() => setDrawerOpen(true)} >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant='h6' component="div" sx={{ flexGrow: 1 }}>
                                {selectedPortfolio}
                            </Typography>
                        </Toolbar>
                    </AppBar>

                    <Box component="nav"
                        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}

                    >
                        <Drawer
                            variant="temporary"
                            open={drawOpen}
                            onClose={() => setDrawerOpen(false)}
                            ModalProps={{
                                keepMounted: true, // Better open performance on mobile.
                            }}
                            sx={{
                                display: { xs: 'block', sm: 'none' },
                                '& .MuiDrawer-paper': {
                                    width: drawerWidth,
                                },
                            }}
                        >
                            {drawerContext}
                        </Drawer>

                        <Drawer
                            variant="permanent"
                            sx={{
                                display: { xs: 'none', sm: 'block' },
                                '& .MuiDrawer-paper': {
                                    width: drawerWidth,
                                    boxSizing: 'border-box',
                                },
                            }}
                            open
                        >
                            {drawerContext}
                        </Drawer>
                    </Box>

                    <Box component="main" className='main'
                        sx={{ flexGrow: 1, px: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
                    >
                        <Toolbar />
                        <Divider />
                        <Grid container spacing={2} sx={{ maxWidth: '100vw', py: 2 }}>
                            <Grid size={{ xs: 12 }}>
                                <AccountSummary />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <ChartPositionAllocation />
                            </Grid>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <ChartPnL />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <DetailTables />
                            </Grid>
                        </Grid>
                        <AddNewPortfolio open={isAddNewPortfolio} onClose={() => SetIsAddNewPortfolio(false)} />

                    </Box>
                    <AddNewPortfolio open={isAddNewPortfolio} onClose={() => SetIsAddNewPortfolio(false)} />
                </Box>
                :
                <AuthLogin />
            }
        </>
    )
}


