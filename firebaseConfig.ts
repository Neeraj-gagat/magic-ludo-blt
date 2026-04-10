// firebaseConfig.ts
// Firebase Web SDK Configuration (Expo compatible)

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// Get this from Firebase Console -> Project Settings -> Your apps -> Web app

const firebaseConfig = {
  apiKey: "AIzaSyCBD3tphSXwACoQdo8b9FtPentv77ihCWo",
  authDomain: "roll-dice-display.firebaseapp.com",
  projectId: "roll-dice-display",
  storageBucket: "roll-dice-display.firebasestorage.app",
  messagingSenderId: "199303660809",
  appId: "1:199303660809:web:c8257afd6cd773cf1a3fd8",
  measurementId: "G-26B56MZQTV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

/*
HOW TO GET YOUR CONFIG:
 
1. Go to https://console.firebase.google.com/
2. Select your project (or create new one)
3. Click Settings ⚙️ (gear icon) -> Project settings
4. Scroll down to "Your apps"
5. Click Web icon (</>) to add a web app
6. Register your app (name it "Dice Roller")
7. Copy the firebaseConfig object
8. Paste it above replacing the placeholder values
9. Make sure databaseURL is included!
 
IMPORTANT: 
- If you don't see databaseURL in your config:
  Go to Realtime Database -> Create Database
  Then the URL will appear in your config
 
FIREBASE RULES (for testing):
Go to Realtime Database -> Rules tab
{
  "rules": {
    "diceControl": {
      ".read": true,
      ".write": true
    }
  }
}
 
⚠️ For production, add authentication!
*/
