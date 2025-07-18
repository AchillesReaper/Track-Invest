// react components
import { useState } from 'react';

// thrid party libraries
import { AppBar, Box, Drawer, IconButton, List, ListItem, Toolbar, Typography } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

import MenuIcon from '@mui/icons-material/Menu';
import AccountSummary from './components/AccountSummary';
import ChartPositionAllocation from './components/ChartPositionAllocation';
import ChartPnL from './components/ChartPnL';
import DetailTables from './components/DetailTables';

// local components


// date time

export default function App() {
    // 2. ---------- set up the drawer list ----------
    const [drawOpen, setDrawerOpen] = useState<boolean>(false)
    const drawerList =
        <div className="w-[250px] h-full sticky" onClick={() => setDrawerOpen(false)}>
            <AppBar position='sticky'>
                <Toolbar variant="dense" >
                    <IconButton color="inherit" onClick={() => setDrawerOpen(true)} >
                        < AccountCircle />
                    </IconButton>
                    <Typography variant='h6' component="div" sx={{ flexGrow: 1 }}>
                        {'user name'}
                    </Typography>
                </Toolbar>
            </AppBar>
            <List>
                <ListItem >

                </ListItem>
            </List>
        </div>

    // ---------- 3. view content ----------
    // const [view, setView] = useState<JSX.Element>(
    //     <Box sx={btnBox}> <CircularProgress size='5rem' /> </Box>
    // )

    // ************ side effects ************

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex' }}>
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

    )
}


