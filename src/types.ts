export interface TimerSettings {
  focusTime: number; // in minutes
  shortBreak: number; // in minutes
  longBreak: number; // in minutes
  longBreakInterval: number; // number of focus sessions before a long break
  soundVolume: number; // 0 to 1
  soundTheme: 'classic' | 'digital' | 'soft' | 'nature';
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  themeBackground: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  pomodorosEstimated: number;
  pomodorosCompleted: number;
  createdAt: number;
}

export interface StudySession {
  id: string;
  type: 'focus' | 'shortBreak' | 'longBreak';
  duration: number; // in seconds
  timestamp: number; // epoch
  taskId?: string;
  taskTitle?: string;
}

export interface AppWindowState {
  id: 'timer' | 'todos' | 'settings' | 'analytics' | 'calendar';
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  focusDuration: number; // in seconds
  pomodorosCount: number;
  tasksCompleted: number;
}
