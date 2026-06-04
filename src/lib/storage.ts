import { Session } from '../types';

const STORAGE_KEY = 'focus_popup_sessions';

export function getSessions(): Session[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse sessions from local storage', error);
    return [];
  }
}

export function addSession(session: Session): void {
  const sessions = getSessions();
  sessions.push(session);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save session to local storage', error);
  }
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
