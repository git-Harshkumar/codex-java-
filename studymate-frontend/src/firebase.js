// src/firebase.js
// Firebase SDK initialization — reads config from Vite env variables
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

// Helper to strip accidental quotes (e.g., if copied as "AIza...")
const clean = (val) => (val ? String(val).replace(/^["']|["']$/g, '').trim() : '');

const firebaseConfig = {
  apiKey:            clean(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain:        clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId:         clean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket:     clean(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId:             clean(import.meta.env.VITE_FIREBASE_APP_ID),
};

let app = null;
let auth = null;
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

if (firebaseConfig.apiKey) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } catch (err) {
    console.error('[Firebase] Initialization error:', err);
  }
} else {
  console.warn('[Firebase] VITE_FIREBASE_API_KEY is not defined. Google Authentication will be disabled until set in Vercel.');
}

export {
  auth,
  provider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
};

