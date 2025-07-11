import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYw0gy189KJMoGfpTY0QqlcdNhR22ORic",
  authDomain: "ai-cocktail-mixology-app.firebaseapp.com",
  projectId: "ai-cocktail-mixology-app",
  storageBucket: "ai-cocktail-mixology-app.appspot.com",
  messagingSenderId: "294048505467",
  appId: "1:294048505467:android:97ec1ea385f02c55f4ccde"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
