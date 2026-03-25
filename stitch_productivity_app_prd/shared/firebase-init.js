import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg8991DcFWsmFxH2X-S71_yTPeLbQlnsY",
  authDomain: "prod-4fce7.firebaseapp.com",
  projectId: "prod-4fce7",
  storageBucket: "prod-4fce7.firebasestorage.app",
  messagingSenderId: "722342652369",
  appId: "1:722342652369:web:a272464337946230e918f0",
  measurementId: "G-FC4G9SXQZK",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

