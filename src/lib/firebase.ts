import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const getDatabase = () => {
    const configId = (firebaseConfig as any).firestoreDatabaseId;
    if (configId) return getFirestore(app, configId);
    
    // Fallback to the specific database ID ONLY if using the auto-provisioned workspace project
    if (firebaseConfig.projectId === 'plexiform-notch-k8gvj') {
        return getFirestore(app, 'ai-studio-9ec373ba-a904-4930-b2d3-e67a89457644');
    }
    
    // Otherwise fallback to default database instance for custom projects
    return getFirestore(app);
};

export const db = getDatabase();
export const auth = getAuth(app);

let cachedAccessToken: string | null = null;

export const loginWithGoogle = async (useRedirect = false) => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    
    if (useRedirect) {
        await signInWithRedirect(auth, provider);
        return;
    }

    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
            setCachedAccessToken(credential.accessToken);
        }
        return result;
    } catch (error: any) {
        console.error('Sign in error:', error);
        
        // Fallback to Redirect automatically if popup is blocked, closed, or restricted by third-party cookies
        if (
            error.code === 'auth/popup-blocked' || 
            error.code === 'auth/popup-closed-by-user' || 
            error.code === 'auth/network-request-failed' ||
            error.code === 'auth/internal-error'
        ) {
            console.log('Popup blocked or failed, falling back to signInWithRedirect...');
            await signInWithRedirect(auth, provider);
            return;
        }
        
        alert(`Login Gagal: ${error.message}\n\nPastikan Anda telah menyalin konfigurasi Firebase dari project "podomoro-app-84734" ke dalam file firebase-applet-config.json di aplikasi Anda, serta menambahkan domain Netlify Anda ke "Authorized domains" di Firebase Console.`);
        throw error;
    }
};

export const checkRedirectResult = async () => {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                setCachedAccessToken(credential.accessToken);
            }
            return result;
        }
    } catch (error: any) {
        console.error('Error processing redirect sign-in:', error);
    }
    return null;
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
