import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Edit3 } from 'lucide-react';
import { Mode, Session } from '../types';
import { addSession, getSessions, subscribeToSessions } from '../lib/storage';
import { cn, getIsoDate } from '../lib/utils';
import { playChime } from '../lib/audio';
import { addEventToCalendar } from '../lib/calendar';

const MODE_DURATIONS: Record<Mode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABELS: Record<Mode, string> = {
  pomodoro: 'Pomodoro',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export function Timer({ themeColor = 'blue' }: { themeColor?: string }) {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS['pomodoro']);
  const [isActive, setIsActive] = useState(false);
  const [topic, setTopic] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('focus_sound') !== 'false';
  });
  
  // Daily Goal state
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(() => {
    const saved = localStorage.getItem('focus_daily_goal_minutes');
    return saved ? parseInt(saved, 10) : 120; // Default 2 hours
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoalMinutes));
  
  // Today's completed minutes
  const [todayCompletedMinutes, setTodayCompletedMinutes] = useState(0);

  const startTimeRef = useRef<number | null>(null);

  const existingTopics = Array.from(
    new Set(
      getSessions()
        .filter(s => s.topic)
        .map(s => s.topic as string)
    )
  );

  useEffect(() => {
    localStorage.setItem('focus_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('focus_daily_goal_minutes', String(dailyGoalMinutes));
  }, [dailyGoalMinutes]);

  useEffect(() => {
    const unsub = subscribeToSessions((sessions) => {
      const todayStr = getIsoDate(new Date());
      const todayMins = sessions
        .filter(s => s.mode === 'pomodoro' && getIsoDate(new Date(s.timestamp)) === todayStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      setTodayCompletedMinutes(todayMins);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      
      if (soundEnabled) {
        playChime();
      }

      // Save session if it was a work session
      if (mode === 'pomodoro') {
        addSession({
          id: crypto.randomUUID(),
          timestamp: startTimeRef.current || Date.now(),
          durationMinutes: MODE_DURATIONS.pomodoro / 60,
          mode: 'pomodoro',
          topic: topic.trim() || undefined,
        });
        
        // Sync to calendar
        addEventToCalendar(
          'Deep Work Session (Pomodoro)', 
          MODE_DURATIONS.pomodoro / 60,
          startTimeRef.current || Date.now()
        );
      }

      // Auto-switch mode or just wait for user
      const nextMode = mode === 'pomodoro' ? 'shortBreak' : 'pomodoro';
      setMode(nextMode);
      setTimeLeft(MODE_DURATIONS[nextMode]);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, soundEnabled, topic]);

  const toggleTimer = () => {
    if (!isActive) {
      startTimeRef.current = Date.now();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  const changeMode = (newMode: Mode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  };

  const handleSaveGoal = () => {
    const parsed = parseInt(goalInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDailyGoalMinutes(parsed);
    } else {
      setGoalInput(String(dailyGoalMinutes));
    }
    setIsEditingGoal(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Calculate session progress
  const totalDuration = MODE_DURATIONS[mode];
  const progress = (timeLeft / totalDuration) * 100;
  const strokeDasharray = 816.8; // 2 * pi * r (130)
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  // Calculate daily goal progress (including current active pomodoro time)
  let currentActivePomodoroMins = 0;
  if (isActive && mode === 'pomodoro') {
    currentActivePomodoroMins = (MODE_DURATIONS.pomodoro - timeLeft) / 60;
  }
  const currentTotalTodayMins = todayCompletedMinutes + currentActivePomodoroMins;
  const goalProgressRaw = (currentTotalTodayMins / dailyGoalMinutes) * 100;
  const goalProgress = Math.min(goalProgressRaw, 100);
  const goalDasharray = 911; // 2 * pi * r (145)
  const goalDashoffset = goalDasharray - (goalProgress / 100) * goalDasharray;

  const THEME_COLORS: Record<string, { stroke: string, strokeIdle: string, outerStroke: string, textObj: string, textIdle: string, textBold: string, button: string, buttonHover: string, shadow: string, focusBorder: string, tagBg: string, tagBorder: string, tagTextActive: string }> = {
    blue: { stroke: 'stroke-blue-500', strokeIdle: 'stroke-blue-400', outerStroke: 'stroke-blue-500/30', textObj: 'text-blue-500', textIdle: 'text-blue-400', textBold: 'text-blue-400', button: 'bg-blue-600', buttonHover: 'hover:bg-blue-500', shadow: 'shadow-blue-900/20', focusBorder: 'focus:border-blue-500/50', tagBg: 'bg-blue-500/20', tagBorder: 'border-blue-500/50', tagTextActive: 'text-blue-300' },
    yellow: { stroke: 'stroke-yellow-500', strokeIdle: 'stroke-yellow-400', outerStroke: 'stroke-yellow-500/30', textObj: 'text-yellow-500', textIdle: 'text-yellow-400', textBold: 'text-yellow-400', button: 'bg-yellow-600', buttonHover: 'hover:bg-yellow-500', shadow: 'shadow-yellow-900/20', focusBorder: 'focus:border-yellow-500/50', tagBg: 'bg-yellow-500/20', tagBorder: 'border-yellow-500/50', tagTextActive: 'text-yellow-300' },
    amber: { stroke: 'stroke-amber-500', strokeIdle: 'stroke-amber-400', outerStroke: 'stroke-amber-500/30', textObj: 'text-amber-500', textIdle: 'text-amber-400', textBold: 'text-amber-400', button: 'bg-amber-600', buttonHover: 'hover:bg-amber-500', shadow: 'shadow-amber-900/20', focusBorder: 'focus:border-amber-500/50', tagBg: 'bg-amber-500/20', tagBorder: 'border-amber-500/50', tagTextActive: 'text-amber-300' },
    slate: { stroke: 'stroke-slate-400', strokeIdle: 'stroke-slate-300', outerStroke: 'stroke-slate-400/30', textObj: 'text-slate-400', textIdle: 'text-slate-300', textBold: 'text-slate-300', button: 'bg-slate-500', buttonHover: 'hover:bg-slate-400', shadow: 'shadow-slate-900/20', focusBorder: 'focus:border-slate-500/50', tagBg: 'bg-slate-500/20', tagBorder: 'border-slate-500/50', tagTextActive: 'text-slate-300' },
    orange: { stroke: 'stroke-orange-500', strokeIdle: 'stroke-orange-400', outerStroke: 'stroke-orange-500/30', textObj: 'text-orange-500', textIdle: 'text-orange-400', textBold: 'text-orange-400', button: 'bg-orange-600', buttonHover: 'hover:bg-orange-500', shadow: 'shadow-orange-900/20', focusBorder: 'focus:border-orange-500/50', tagBg: 'bg-orange-500/20', tagBorder: 'border-orange-500/50', tagTextActive: 'text-orange-300' },
  };

  const theme = THEME_COLORS[themeColor] || THEME_COLORS.blue;

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60);
    const mins = Math.floor(m % 60);
    if (h > 0 && mins > 0) return `${h}h ${mins}m`;
    if (h > 0) return `${h}h`;
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full text-white overflow-y-auto scrollbar-hide">
      
      {/* Mode Selectors */}
      <div className="flex gap-4 mb-8 shrink-0">
        {(Object.keys(MODE_DURATIONS) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] transition-opacity",
              mode === m 
                ? `${theme.textBold} font-bold opacity-100` 
                : "opacity-30 hover:opacity-100"
            )}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center mb-8 w-[320px] h-[320px] shrink-0">
        <svg className="absolute w-[320px] h-[320px] transform -rotate-90">
          {/* Daily Goal Background */}
          {isActive && (
            <circle
              cx="160"
              cy="160"
              r="145"
              className="stroke-white/[0.03]"
              strokeWidth="2"
              fill="transparent"
            />
          )}
          {/* Daily Goal Progress */}
          {isActive && (
            <circle
              cx="160"
              cy="160"
              r="145"
              className={cn("transition-all duration-1000", theme.outerStroke)}
              strokeWidth="2"
              strokeLinecap="round"
              fill="transparent"
              style={{ strokeDasharray: goalDasharray, strokeDashoffset: goalDashoffset }}
            />
          )}

          {/* Session Timer Background */}
          <circle
            cx="160"
            cy="160"
            r="130"
            className="stroke-white/5"
            strokeWidth="4"
            fill="transparent"
          />
          {/* Session Timer Progress */}
          <circle
            cx="160"
            cy="160"
            r="130"
            className={cn(
              "transition-colors duration-500",
              mode === 'pomodoro' ? theme.stroke : theme.strokeIdle
            )}
            strokeWidth="4"
            strokeLinecap="round"
            fill="transparent"
            style={{ 
              strokeDasharray, 
              strokeDashoffset, 
              transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' 
            }}
          />
        </svg>

        <div className="absolute flex flex-col items-center w-full z-10 pointer-events-none">
          {/* Daily Goal Header */}
          <div className="flex flex-col items-center mb-2 group h-12 justify-end pointer-events-auto">
            <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Daily Goal</span>
            {isEditingGoal ? (
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1">
                <input 
                  autoFocus
                  type="number" 
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveGoal()}
                  onBlur={handleSaveGoal}
                  className="w-16 bg-transparent text-center font-medium text-white/90 focus:outline-none text-sm"
                  min="1"
                />
                <span className="text-xs text-white/50 font-medium">min</span>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditingGoal(true)}
                className="flex items-center gap-2 cursor-pointer hover:bg-black/30 backdrop-blur-md rounded-full px-3 py-1 transition-colors"
              >
                <span className="text-sm font-medium text-white/90">
                  {formatMin(currentTotalTodayMins)} / {formatMin(dailyGoalMinutes)}
                </span>
                <Edit3 size={12} className="text-white/30 group-hover:text-white/70" />
              </div>
            )}
          </div>

          <span className="text-7xl font-light tracking-tighter tabular-nums text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <div className="h-12 w-full max-w-[200px] pointer-events-auto flex items-center justify-center mt-2">
            {/* The input gets moved here so it's inside the bottom half of the circle */}
            {mode === 'pomodoro' && (
              <div className="w-full flex-col flex items-center group/input">
                <input
                  type="text"
                  placeholder="Focusing on..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isActive}
                  className={`w-full bg-transparent border-none rounded-lg px-2 py-1 text-sm text-center text-white/80 placeholder-white/20 focus:outline-none focus:ring-0 ${theme.focusBorder} transition-colors disabled:opacity-50`}
                />
                <div className={`h-[1px] w-1/2 bg-white/10 transition-all group-focus-within/input:w-3/4 group-focus-within/input:bg-white/30`}></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6 shrink-0 z-20">
        {mode === 'pomodoro' && existingTopics.length > 0 && (
          <div className="w-full max-w-[320px] flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-2 max-h-[80px] overflow-y-auto scrollbar-hide w-full px-2">
              {existingTopics.map(t => (
                <button
                  key={t}
                  onClick={() => setTopic(topic === t ? '' : t)}
                  disabled={isActive}
                  className={cn(
                    "text-[10px] uppercase font-medium tracking-wider px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50",
                    topic === t
                      ? `${theme.tagBg} ${theme.tagBorder} ${theme.tagTextActive}`
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20 hover:bg-white/10"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <RotateCcw size={16} /> <span className="text-sm">Reset</span>
          </button>
          
          <button
            onClick={toggleTimer}
            className={`px-8 py-3 ${theme.button} ${theme.buttonHover} text-white rounded-xl font-semibold transition-colors shadow-lg ${theme.shadow} flex items-center gap-2`}
          >
            {isActive ? <><Pause size={16} className="fill-current" /> <span className="text-sm">Pause</span></> : <><Play size={16} className="fill-current" /> <span className="text-sm">Start</span></>}
          </button>
  
          {isActive && (
            <button
              onClick={() => {
                setTimeLeft(2); // fast forward
              }}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/50 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm"
              title="Skip to end (Testing)"
            >
               <span className="text-xs tracking-wider">SKIP</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors shadow-sm opacity-60 hover:opacity-100"
            title={soundEnabled ? "Mute sound" : "Enable sound"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

    </div>
  );
}

