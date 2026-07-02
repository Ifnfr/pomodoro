import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query
} from 'firebase/firestore';
import { TimerSettings, TodoItem, StudySession } from '../types';
import { LocalStorage } from './storage';

// Default mock config in case config is missing
const fallbackConfig = {
  apiKey: "MOCK_KEY_DISCONNECTED",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "12345",
  appId: "1:12345:web:mockid"
};

// We will export a boolean indicating if Firebase is active & connected
let isFirebaseEnabled = false;
let app;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

// Check if we can load the actual configuration
try {
  // We use standard hardcoded values from the user's previously provided config
  const firebaseConfig = {
    apiKey: "AIzaSyD9TnuPsxAmgddHf5aL1bZuazgku8QudQc",
    authDomain: "podomoro-app-84734.firebaseapp.com",
    projectId: "podomoro-app-84734",
    storageBucket: "podomoro-app-84734.firebasestorage.app",
    messagingSenderId: "266486868410",
    appId: "1:266486868410:web:b0ce0a234b8db6da8a5583",
    measurementId: "G-RGDF6DXP1V"
  };

  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "MOCK_KEY_DISCONNECTED") {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseEnabled = true;
  } else {
    app = initializeApp(fallbackConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.warn("Failed to initialize Firebase SDK, starting in offline-only mode:", error);
  app = initializeApp(fallbackConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db, isFirebaseEnabled };

// Auth actions
export async function loginWithGoogle(): Promise<User | null> {
  if (!isFirebaseEnabled) {
    throw new Error("Firebase tidak diaktifkan. Silakan periksa file konfigurasi.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: unknown) {
    console.error("Auth login failed:", error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  if (!isFirebaseEnabled) return;
  await signOut(auth);
}

// Resilient sync system that wraps Firestore queries and falls back to LocalStorage
export const FirebaseSync = {
  async saveSettings(userId: string, settings: TimerSettings): Promise<void> {
    LocalStorage.saveSettings(settings); // Always save locally first (INV-03)
    if (!isFirebaseEnabled) return;

    try {
      await setDoc(doc(db, 'users', userId, 'config', 'settings'), settings, { merge: true });
    } catch (e) {
      console.warn("Firestore saveSettings failed (operating offline):", e);
    }
  },

  async loadSettings(userId: string): Promise<TimerSettings> {
    const local = LocalStorage.getSettings();
    if (!isFirebaseEnabled) return local;

    try {
      // Create a task that resolves or times out to avoid blocking UI
      const promise = getDocs(query(collection(db, 'users', userId, 'config')));
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      
      const result = await Promise.race([promise, timeout]);
      if (result && !result.empty) {
        const docSnap = result.docs.find(d => d.id === 'settings');
        if (docSnap) {
          const remoteSettings = docSnap.data() as TimerSettings;
          LocalStorage.saveSettings(remoteSettings);
          return remoteSettings;
        }
      }
    } catch (e) {
      console.warn("Firestore loadSettings failed (using local cache):", e);
    }
    return local;
  },

  async syncTodos(userId: string, localTodos: TodoItem[]): Promise<TodoItem[]> {
    LocalStorage.saveTodos(localTodos); // Always save locally first (INV-03)
    if (!isFirebaseEnabled) return localTodos;

    try {
      // 1. Upload local items
      const userTodosRef = collection(db, 'users', userId, 'todos');
      const uploadPromises = localTodos.map(todo => 
        setDoc(doc(userTodosRef, todo.id), todo, { merge: true })
      );
      
      await Promise.all(uploadPromises.slice(0, 10)); // throttle standard limits

      // 2. Fetch remote items to merge
      const q = query(userTodosRef);
      const snapshot = await getDocs(q);
      
      const remoteTodos: TodoItem[] = [];
      snapshot.forEach(doc => {
        remoteTodos.push(doc.data() as TodoItem);
      });

      // Merge by ID, keeping the latest modifications
      const mergedMap = new Map<string, TodoItem>();
      localTodos.forEach(t => mergedMap.set(t.id, t));
      remoteTodos.forEach(t => {
        const existing = mergedMap.get(t.id);
        if (!existing || t.createdAt > existing.createdAt) {
          mergedMap.set(t.id, t);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      LocalStorage.saveTodos(mergedList);
      return mergedList;
    } catch (e) {
      console.warn("Firestore syncTodos failed (using local copy):", e);
      return localTodos;
    }
  },

  async addStudySession(userId: string, session: Omit<StudySession, 'id'>): Promise<StudySession> {
    const newSession = LocalStorage.addSession(session); // Always save locally first (INV-03)
    if (!isFirebaseEnabled) return newSession;

    try {
      const userSessionsRef = collection(db, 'users', userId, 'sessions');
      await setDoc(doc(userSessionsRef, newSession.id), newSession);
    } catch (e) {
      console.warn("Firestore addStudySession failed (cached locally):", e);
    }
    return newSession;
  },

  async loadStudySessions(userId: string): Promise<StudySession[]> {
    const local = LocalStorage.getSessions();
    if (!isFirebaseEnabled) return local;

    try {
      const userSessionsRef = collection(db, 'users', userId, 'sessions');
      const snapshot = await getDocs(userSessionsRef);
      
      const remoteSessions: StudySession[] = [];
      snapshot.forEach(doc => {
        remoteSessions.push(doc.data() as StudySession);
      });

      // Merge list uniquely by ID
      const mergedMap = new Map<string, StudySession>();
      local.forEach(s => mergedMap.set(s.id, s));
      remoteSessions.forEach(s => mergedMap.set(s.id, s));

      const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      LocalStorage.saveSessions(mergedList);
      return mergedList;
    } catch (e) {
      console.warn("Firestore loadStudySessions failed (using local):", e);
      return local;
    }
  }
};
