import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDo4UIKRxXU2uhLr250iyXNuC8J5n_8hz0",
  authDomain: "knitly-92828.firebaseapp.com",
  projectId: "knitly-92828",
  storageBucket: "knitly-92828.appspot.com",
  messagingSenderId: "123193175483",
  appId: "1:123193175483:web:cf32366c64021ab994a89e",
  measurementId: "G-XJE6PQKYH6"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };