
import { useState } from "react"

import { browserLocalPersistence, createUserWithEmailAndPassword, setPersistence } from 'firebase/auth';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import { auth } from '../utils/firebaseConfig';
import { LoadingBox, MessageBox } from './ZCommonComponents';


export default function AuthSignUp(props: { onClose: () => void }) {
    // aim: let user create a new auth with email and password
    const [email, setEmail] = useState<string | undefined>(undefined)
    const [password, setPassword] = useState<string | undefined>(undefined)

    const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    function handleSignUp() {
        if (!email || !password) {
            setErrorMessage('authSignUp: email and password are required')
            return
        }
        setIsLoading(true)
        setPersistence(auth, browserLocalPersistence).then(() => {
            createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
                console.log('user created successfully');
                console.log(userCredential);
            }).catch((err) => {
                console.log(err.message);
                setErrorMessage(`authSignUp: ${err.message}`)
            })
        })

    }
    return (
        <Container component="main" maxWidth="sm" >
            <CssBaseline />
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', }}  >
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign Up
                </Typography>
                <Box sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid size={12}>
                            <TextField
                                required
                                fullWidth
                                label='Email Address'
                                autoComplete="email"
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSignUp()
                                    }
                                }}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                required
                                fullWidth
                                label='Password'
                                type="password"
                                autoComplete="new-password"
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSignUp()
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Button fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} onClick={handleSignUp} >
                        Sign Up
                    </Button>
                    <Grid container justifyContent="flex-end">
                        <Grid>
                            <Link variant="body2" onClick={() => { props.onClose() }}>
                                "Already have an account? Login"
                            </Link>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {isLoading && <LoadingBox open={isLoading} onClose={() => setIsLoading(false)} />}
            {infoMessage && <MessageBox open={infoMessage ? true : false} onClose={() => setInfoMessage(undefined)} type='info' message={infoMessage} />}
            {errorMessage && <MessageBox open={errorMessage ? true : false} onClose={() => setErrorMessage(undefined)} type='error' message={errorMessage} />}
            {successMessage && <MessageBox open={successMessage ? true : false} onClose={() => { setSuccessMessage(undefined); }} type='success' message={successMessage} />}
        </Container>
    )
}