import { Session } from '../types';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'focus_popup_sessions';

let cachedSessions: Session[] = [];
let isListening = false;
let sessionListeners: ((sessions: Session[]) => void)[] = [];

// Fallback to local storage
function getLocalSessions(): Session[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse sessions from local storage', error);
    return [];
  }
}

// Subscribe to state changes from anywhere
export function subscribeToSessions(callback: (sessions: Session[]) => void) {
  sessionListeners.push(callback);
  callback(getSessions()); // Send current state
  return () => {
    sessionListeners = sessionListeners.filter(l => l !== callback);
  };
}

function notifyListeners() {
  const current = getSessions();
  sessionListeners.forEach(listener => listener(current));
}

// Set up Firebase listener
auth.onAuthStateChanged((user) => {
  if (user) {
    if (!isListening) {
      isListening = true;
      const q = query(collection(db, `users/${user.uid}/sessions`));
      onSnapshot(q, (snapshot) => {
        const fbSessions: Session[] = [];
        snapshot.forEach((doc) => {
          fbSessions.push(doc.data() as Session);
        });
        cachedSessions = fbSessions;
        // Optionally cache locally as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fbSessions));
        notifyListeners();
      }, (error) => {
        handleFirestoreError(error, 'get', `users/${user.uid}/sessions`);
      });
    }
  } else {
    isListening = false;
    cachedSessions = [];
    notifyListeners();
  }
});

export function getSessions(): Session[] {
  if (auth.currentUser) {
    return cachedSessions;
  }
  return getLocalSessions();
}

export async function addSession(session: Session) {
  // Always give it an ID if it doesn't have one
  const sessionWithId = { ...session, id: session.id || crypto.randomUUID() };

  // Update locally right away for UI responsiveness
  if (!auth.currentUser) {
    const sessions = getLocalSessions();
    sessions.push(sessionWithId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      notifyListeners();
    } catch (error) {
      console.error('Failed to save session to local storage', error);
    }
  } else {
    // If logged in, send to Firebase
    try {
        sessionWithId.userId = auth.currentUser.uid;
        await setDoc(doc(db, `users/${auth.currentUser.uid}/sessions`, sessionWithId.id), sessionWithId);
        // Snapshot listener will update the local state implicitly shortly after
    } catch (error) {
        handleFirestoreError(error, 'write', `users/${auth.currentUser.uid}/sessions`);
    }
  }
}

export function clearSessions(): void {
  // If user wants to clear locally (not allowing fully clear firebase from app for safety unless fully implemented)
  localStorage.removeItem(STORAGE_KEY);
  cachedSessions = [];
  notifyListeners();
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // In production, might not throw here to avoid crashing UI for unhandled boundary
}
