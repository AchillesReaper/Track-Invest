// react components
import { useEffect, useRef, useState, type JSX } from 'react';

// thrid party libraries
import { AppBar, Box, Button, CircularProgress, Container, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

import MenuIcon from '@mui/icons-material/Menu';
import { btnBox } from './components/ZCommonComponents';

// local components


// date time

export default function App() {
    // 1. LHS: app bar
    const [appBarHeight, setAppBarHeight] = useState<number>(0)     //create ref height from app bar
    const appBarRef = useRef<HTMLDivElement>(null);

    // 2. set up the drawer list
    const [drawOpen, setDrawerOpen] = useState<boolean>(false)
    const [drawerWidth, setDrawerWidth] = useState<number>(250)

    const drawerList =
        <Box sx={{ width: drawerWidth, ml: 0, mt: 0, display: 'block' }} onClick={() => setDrawerOpen(false)}>
            <List sx={{ backgroundColor: '#1976d2', height: appBarHeight, padding: 0, boxShadow: 3 }} >
                <ListItem >
                    <ListItemIcon> < AccountCircle /> </ListItemIcon>
                    <ListItemText primary={'user name'} sx={{ color: 'white' }} />
                </ListItem>
            </List>
            <List>
                <ListItem >

                </ListItem>
            </List>
        </Box>

    // 3. view content
    const [view, setView] = useState<JSX.Element>(
        <Box sx={btnBox}> <CircularProgress size='5rem' /> </Box>
    )

    // ************ side effects ************

    useEffect(() => {    // Get the height of the AppBar
        if (!appBarRef.current) return;
        setAppBarHeight(appBarRef.current.getBoundingClientRect().height);
    }, [appBarRef])


    return (
        <Box sx={{ minHeight: '100vh' }}>
            {/* LHS: app bar + content view*/}
            <Box sx={{ width: { md: `calc(100% - ${drawerWidth}px)`, xs: '100%' } }}>
                <AppBar position='sticky' ref={appBarRef}>
                    <Toolbar variant="dense">
                        <Typography variant='h6' component="div" sx={{ flexGrow: 1 }}>
                            Portfolio Name
                        </Typography>
                        <IconButton color="inherit" sx={{ display: { md: 'none' } }} onClick={() => setDrawerOpen(true)} >
                            <MenuIcon />
                        </IconButton>

                    </Toolbar>
                </AppBar>
                {view}
            </Box>

            {/* RHS: side menu */}
            {/* xs view */}
            <Drawer anchor='right' sx={{ display: { md: 'none' } }} open={drawOpen} onClose={() => setDrawerOpen(false)}>
                {drawerList}
            </Drawer>
            {/* md view */}
            <Drawer anchor='right' sx={{ display: { xs: 'none', md: 'block' } }} variant='permanent'>
                {drawerList}
            </Drawer>



        </Box>
    )
}


