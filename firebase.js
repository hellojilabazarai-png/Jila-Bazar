import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// ⚠️ Baad mein Firebase project badalna ho to sirf yahi config badalna hai.
const firebaseConfig = {
  apiKey: "AIzaSyDnzu6wRZpS7VY0XaxBp18Gt9sEmppLEA8",
  authDomain: "jila-baza.firebaseapp.com",
  projectId: "jila-baza",
  storageBucket: "jila-baza.firebasestorage.app",
  messagingSenderId: "765866393066",
  appId: "1:765866393066:web:269634c25b12b0dbde0693",
};

try {
  const app = initializeApp(firebaseConfig);
  // ignoreUndefinedProperties: app ke data mein kahin `undefined` ho to save fail na ho
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  // App.jsx isi object se Firestore use karti hai (window.__jbFirestore)
  window.__jbFirestore = { db, doc, getDoc, setDoc };
} catch (e) {
  console.error("Firebase init fail hua, localStorage fallback use hoga:", e);
}
