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
