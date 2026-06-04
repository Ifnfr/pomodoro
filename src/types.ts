export type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface Session {
  id: string;
  timestamp: number; // Unix timestamp in MS
  durationMinutes: number;
  mode: Mode;
}

export interface DailyStat {
  dateStr: string; // YYYY-MM-DD
  totalWorkMinutes: number;
}
