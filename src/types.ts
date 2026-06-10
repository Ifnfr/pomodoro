export type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface Session {
  id: string;
  userId?: string;
  timestamp: number; // Unix timestamp in MS
  durationMinutes: number;
  mode: Mode;
  topic?: string;
}

export interface DailyStat {
  dateStr: string; // YYYY-MM-DD
  totalWorkMinutes: number;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface CountdownEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
}
