// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  // apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-estate-aa0c1.firebaseapp.com",
  projectId: "mern-estate-aa0c1",
  storageBucket: "mern-estate-aa0c1.firebasestorage.app",
  messagingSenderId: "919377466126",
  appId: "1:919377466126:web:5ad22b5a5eb9e2daddbd5f"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);