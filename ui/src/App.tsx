// react components
import { useContext, useMemo, useState } from 'react';

// thrid party libraries
import { AppBar, Box, Button, CssBaseline, Divider, Drawer, Grid, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountSummary from './components/AccountSummary';
import ChartPositionAllocation from './components/ChartPositionAllocation';
import ChartPnL from './components/ChartPnL';
import DetailTables from './components/DetailTables';

// local components
import AuthLogin from './components/AuthLogin';
import { auth, db } from './utils/firebaseConfig';
import AddNewPortfolio from './components/AddNewPortfolio';
import { AppContext } from './utils/contexts';
import EditPortfolioInfo from './components/EditPortfolioInfo';
import DrawerContent from './components/DrawerContent';



export default function App() {
    const [isAddNewPortfolio, SetIsAddNewPortfolio] = useState<boolean>(false)
    const [isEditPortfolioInfo, setIsEditPortfolioInfo] = useState<boolean>(false)

    const appContext = useContext(AppContext);
    const isLoggedin = useMemo(() => appContext?.isLoggedin || false, [appContext]);
    const selectedPortfolio = useMemo(() => appContext?.selectedPortfolio, [appContext]);
    const selfPortList = useMemo(() => appContext?.selfPortfolioList, [appContext]);
    const sharedPortList = useMemo(() => appContext?.sharedPortfolioList, [appContext]);
    const [portOwner, portName] = useMemo(() => {
        if (!selectedPortfolio) return [undefined, undefined];
        if (selfPortList && Object.keys(selfPortList).includes(selectedPortfolio)) return [selfPortList[selectedPortfolio].owner, selfPortList[selectedPortfolio].portfolio_name];
        if (sharedPortList && Object.keys(sharedPortList).includes(selectedPortfolio)) return [sharedPortList[selectedPortfolio].owner, sharedPortList[selectedPortfolio].portfolio_name];
        return [undefined, undefined];
    }, [selfPortList, sharedPortList, selectedPortfolio]);
    const isOwner = useMemo(() => {
        if (!portOwner) return false;
        if (auth.currentUser?.email === portOwner) return true;
        return false;
    }, [portOwner, auth]);

    // 1. ---------- set up the drawer list ----------
    const drawerWidth = 250; // Define the width of the drawer
    const [drawOpen, setDrawerOpen] = useState<boolean>(false)


    return (
        <>
            {isLoggedin
                ?
                <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex' }}>
                    <CssBaseline />

                    <AppBar
                        position="fixed"
                        sx={{
                            width: { md: `calc(100% - ${drawerWidth}px)` },
                            ml: { md: `${drawerWidth}px` },
                        }}
                    >
                        <Toolbar>
                            <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={() => setDrawerOpen(true)} >
                                <MenuIcon />
                            </IconButton>
                            <Typography variant='h6' component="div" sx={{ flexGrow: 1 }}>
                                {portName && portOwner && isOwner && `${portName} `}
                                {portName && !isOwner && `${portName} - ${portOwner}`}
                            </Typography>
                            <IconButton color="inherit" disabled={!isOwner} onClick={() => setIsEditPortfolioInfo(true)} sx={{ ml: 1 }}>
                                <SettingsIcon />
                            </IconButton>
                        </Toolbar>
                    </AppBar>

                    <Box component="nav"
                        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}

                    >
                        <Drawer
                            variant="temporary"
                            open={drawOpen}
                            onClose={() => setDrawerOpen(false)}
                            ModalProps={{
                                keepMounted: true, // Better open performance on mobile.
                            }}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                                '& .MuiDrawer-paper': {
                                    width: drawerWidth,
                                },
                            }}
                        >
                            <DrawerContent 
                                setDrawerOpen={setDrawerOpen} 
                                setIsAddNewPortfolio={SetIsAddNewPortfolio} 
                            />
                        </Drawer>

                        <Drawer
                            variant="permanent"
                            sx={{
                                display: { xs: 'none', md: 'block' },
                                '& .MuiDrawer-paper': {
                                    width: drawerWidth,
                                    boxSizing: 'border-box',
                                },
                            }}
                            open
                        >
                            <DrawerContent 
                                setDrawerOpen={setDrawerOpen} 
                                setIsAddNewPortfolio={SetIsAddNewPortfolio} 
                            />
                        </Drawer>
                    </Box>

                    <Box component="main" className='main'
                        sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` } }}
                    >
                        <Toolbar />
                        <Divider />
                        <Grid container spacing={2} sx={{ maxWidth: '100vw', p: 2 }}>
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
                    <EditPortfolioInfo open={isEditPortfolioInfo} onClose={() => setIsEditPortfolioInfo(false)} />
                </Box>
                :
                <AuthLogin />
            }
        </>
    )
}


