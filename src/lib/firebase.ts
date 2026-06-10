import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-9ec373ba-a904-4930-b2d3-e67a89457644'); // CRITICAL: Database ID
export const auth = getAuth(app);

let cachedAccessToken: string | null = null;

export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    
    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
            setCachedAccessToken(credential.accessToken);
        }
        return result;
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

export const logout = async () => {
    await signOut(auth);
    cachedAccessToken = null;
};

export const getAccessToken = async () => {
    return cachedAccessToken;
};

export const setCachedAccessToken = (token: string) => {
    cachedAccessToken = token;
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
