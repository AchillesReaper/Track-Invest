import * as admin from 'firebase-admin';
import serviceAccount from './family-funds-f9628-firebase-adminsdk-fbsvc-a245153b34.json';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export const db = admin.firestore();
export const auth = admin.auth();