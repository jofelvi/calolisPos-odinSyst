import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA9RlCTktrgCh-E_zex9CPJE1LfBbK6e4E',
  authDomain: 'odinsysnext.firebaseapp.com',
  projectId: 'odinsysnext',
  storageBucket: 'odinsysnext.firebasestorage.app',
  messagingSenderId: '480159663912',
  appId: '1:480159663912:web:1a105ccf7dd364af54321d',
  measurementId: 'G-PS3MTXSJFR',
};
let firebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0]; // if already initialized, use that one
}
// Initialize Firestore and Auth
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

export { db, auth, storage };
