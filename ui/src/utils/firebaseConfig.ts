import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from "firebase/storage";

import { configDetails } from './firebaseConfigDetails';

const firebaseConfig = configDetails;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const authGoogleProvider = new GoogleAuthProvider();
const storage = getStorage(app);

auth.useDeviceLanguage();

export {db, auth, authGoogleProvider, storage};
