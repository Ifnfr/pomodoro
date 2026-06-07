import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // CRITICAL: Database ID
export const auth = getAuth(app);

export const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    // Use redirect instead of popup to bypass strict iframe/cookie constraints
    return signInWithRedirect(auth, provider);
};

export const logout = () => {
    return signOut(auth);
};

export const getAccessToken = async () => {
    return null; // Will be implemented when OAuth is set up properly
};

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connected successfully");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
