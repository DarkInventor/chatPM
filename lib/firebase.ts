import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCy6eDVD1J8Rndt0WgDPw1CLcH22dAc3BA",
  authDomain: "chatpm-4ae86.firebaseapp.com",
  projectId: "chatpm-4ae86",
  storageBucket: "chatpm-4ae86.firebasestorage.app",
  messagingSenderId: "480478905629",
  appId: "1:480478905629:web:53e3dbef1a1b952e8e8df4",
  measurementId: "G-8G97XYVJBS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set auth persistence to local storage for longer sessions
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error);
  });
}

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };