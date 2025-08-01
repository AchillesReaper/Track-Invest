import * as admin from 'firebase-admin';
import { serviceAccount } from './serviceAccount';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export const db = admin.firestore();
export const auth = admin.auth();