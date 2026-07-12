import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEOJxOOnyk6CbKppp2Z1TOGnxrH4U7yVs",
  authDomain: "retainer-stats-pfx.firebaseapp.com",
  projectId: "retainer-stats-pfx",
  storageBucket: "retainer-stats-pfx.firebasestorage.app",
  messagingSenderId: "496931811879",
  appId: "1:496931811879:web:a736f75aa9244cd8dc9402"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut, onAuthStateChanged, doc, getDoc, collection, addDoc, updateDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp, setDoc };
