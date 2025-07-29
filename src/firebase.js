import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyC-VEZBhela7pKdJjRhTwpGiLPsnefDkzU",
  authDomain: "rasail-43c5b.firebaseapp.com",
  databaseURL: "https://rasail-43c5b-default-rtdb.firebaseio.com",
  projectId: "rasail-43c5b",
  storageBucket: "rasail-43c5b.firebasestorage.app",
  messagingSenderId: "633516803448",
  appId: "1:633516803448:web:8b08b984902605bd44f48d",
  measurementId: "G-H2Z89PZBQP"
};

const app = initializeApp(firebaseConfig);

export { app };