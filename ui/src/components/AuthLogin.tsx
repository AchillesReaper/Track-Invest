import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';

import { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, sendPasswordResetEmail, signInWithPopup, type UserCredential } from 'firebase/auth';
import { auth, authGoogleProvider } from '../utils/firebaseConfig';

import { AppBar, IconButton, Toolbar } from '@mui/material';
import Divider from '@mui/material/Divider';
import AuthSignUp from './AuthSignUp';
import { LoadingBox, MessageBox } from './ZCommonComponents';



export default function AuthLogin() {
    const [isSignUp, setIsSignUp] = useState<boolean>(false)
    const [isForgetPassword, setIsforgetPassword] = useState<boolean>(false)


    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const [login, setLogin] = useState({
        email: '',
        password: ''
    })

    function handleFormchange(e: React.ChangeEvent<HTMLInputElement>) {
        setLogin({
            ...login,
            [e.target.name]: e.target.value
        })
    }

    function handleLogin() {
        console.log('function login is called');
        setPersistence(auth, browserLocalPersistence).then(() => {
            signInWithEmailAndPassword(auth, login.email, login.password).then((result: UserCredential) => {
                console.log(`${result.user.displayName} has logged in successfully`);
                setInfoMessage('Login successful');
            }).catch((error) => {
                console.log(error.message);
                setErrorMessage(`authLogin: ${error.message}`);
            });
        });
    }

    function resetPassword() {
        if (login.email === '') {
            setErrorMessage('Please enter your email address');
            return
        } else {
            sendPasswordResetEmail(auth, login.email).then(() => {
                setSuccessMessage(`Password reset email has been sent to ${login.email}`);
            }).catch((error) => {
                setErrorMessage(`authLogin: ${error.message}`) // Set error message for consistency
            })
        }
    }

    function loginWithGoogle() {
        console.log('login with google is called');
        signInWithPopup(auth, authGoogleProvider).then((result: UserCredential) => {
            console.log(`${result.user.displayName} has logged in with Google successfully`);
            setInfoMessage('Login with Google successful');
        }).catch((error) => {
            console.log(error.message);
            setErrorMessage(`authLogin: ${error.message}`);
        })
    }

    const btnStyle = {
        maxWidth: '250px',
        width: '100%',
        display: 'block',
        margin: 'auto',
        my: 1
    }
    return (
        <Box>
            <AppBar position='sticky'>
                <Toolbar variant="dense">
                    <IconButton color="inherit" sx={{ display: { md: 'none' } }} >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant='h6' component="div" sx={{ flexGrow: 1, color: 'inherit' }} onClick={() => { setIsforgetPassword(false); setIsSignUp(false); }}>
                        Track Invest
                    </Typography>
                </Toolbar>
            </AppBar>

            {isSignUp && <AuthSignUp onClose={() => setIsSignUp(false)} />}
            {!isSignUp &&
                <Box maxWidth="xs" sx={{ marginTop: 4, marginX: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', }} >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography color='primary' component="h1" variant="h5"> Sign in </Typography>

                    {isForgetPassword
                        ? <> {/*reset password*/}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={login.email}
                                onChange={handleFormchange}
                            />
                            <Button variant='outlined' onClick={resetPassword}>
                                Reset Password
                            </Button>
                        </>
                        : <Box>
                            <Box component="form" noValidate sx={{ mt: 1 }}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    onChange={handleFormchange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { handleLogin() }
                                    }}
                                />

                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="password"
                                    autoComplete="current-password"
                                    onChange={handleFormchange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') { handleLogin() }
                                    }}
                                />
                                <Button variant="contained" sx={btnStyle} onClick={handleLogin} >
                                    login
                                </Button>
                                <Button variant='outlined' sx={btnStyle} onClick={() => { setIsSignUp(true); }}>
                                    sign up
                                </Button>
                                <Button variant='outlined' sx={btnStyle} onClick={() => { setIsforgetPassword(true); }}>
                                    forget password
                                </Button>
                            </Box>
                            <Divider variant='fullWidth' sx={{ my: 2 }}>Login in with</Divider>
                            <Button variant='contained' sx={{ width: '30%', display: 'block', margin: 'auto', my: 1, borderRadius: '50px', textTransform: 'none' }} onClick={loginWithGoogle}>
                                Google
                            </Button>
                        </Box>
                    }
                </Box>
            }

            {isLoading && <LoadingBox open={isLoading} onClose={() => setIsLoading(false)} />}
            {infoMessage && <MessageBox open={infoMessage ? true : false} onClose={() => setInfoMessage(undefined)} type='info' message={infoMessage} />}
            {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
            {successMessage && <MessageBox open={successMessage ? true : false} onClose={() => {setSuccessMessage(undefined);}} type='success' message={successMessage} />}
        </Box>
    );
}