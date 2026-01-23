// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAy9PTj3IqjZXD-G-xYx17-zzrekyr8KHc",
  authDomain: "aitian-b662d.firebaseapp.com",
  projectId: "aitian-b662d",
  storageBucket: "aitian-b662d.firebasestorage.app",
  messagingSenderId: "123539392690",
  appId: "1:123539392690:web:263c18abab58f3905ce1ab",
  measurementId: "G-B6LPJCGF54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

