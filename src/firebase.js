import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB8cKVZvz658mc5Gtq-jMN5jNYiFdFEXUY",
  authDomain: "fanoclinic-1de51.firebaseapp.com",
  projectId: "fanoclinic-1de51",
  storageBucket: "fanoclinic-1de51.firebasestorage.app",
  messagingSenderId: "550211921231",
  appId: "1:550211921231:web:ce2f77fa5c90dfd9e4513a",
  databaseURL: "https://fanoclinic-1de51-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);