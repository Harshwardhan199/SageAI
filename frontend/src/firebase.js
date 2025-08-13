import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB6Vro97551toXDOZJJBI5xH5iOWUwCk1U",
  authDomain: "chatbot-ai-7470d.firebaseapp.com",
  projectId: "chatbot-ai-7470d",
  storageBucket: "chatbot-ai-7470d.firebasestorage.app",
  messagingSenderId: "473031483278",
  appId: "1:473031483278:web:dba45275990890c0d6cedf"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);