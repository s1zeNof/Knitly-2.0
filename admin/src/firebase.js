import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Той самий Firebase-проект що й у головному додатку
const firebaseConfig = {
    apiKey: 'AIzaSyCjuT0M8OvV1AYM7u4oOtIk0B8iN4CnEtc',
    authDomain: 'knitly-92828.firebaseapp.com',
    projectId: 'knitly-92828',
    storageBucket: 'knitly-92828.appspot.com',
    messagingSenderId: '123193175483',
    appId: '1:123193175483:web:cf32366c64021ab994a89e',
    measurementId: 'G-XJE6PQKYH6',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
