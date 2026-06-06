import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Mode } from '../types';
import { addSession } from '../lib/storage';
import { cn } from '../lib/utils';
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

export function Timer() {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS['pomodoro']);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('focus_sound') !== 'false';
  });
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('focus_sound', String(soundEnabled));
  }, [soundEnabled]);

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
  }, [isActive, timeLeft, mode]);

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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Calculate progress for the circular ring
  const totalDuration = MODE_DURATIONS[mode];
  const progress = (timeLeft / totalDuration) * 100;
  const strokeDasharray = 816.8; // 2 * pi * r (130)
  const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

  return (
    <div className="flex flex-col items-center justify-center p-6 h-full text-white">
      
      {/* Mode Selectors */}
      <div className="flex gap-4 mb-10">
        {(Object.keys(MODE_DURATIONS) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] transition-opacity",
              mode === m 
                ? "text-blue-400 font-bold opacity-100" 
                : "opacity-30 hover:opacity-100"
            )}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center mb-12">
        <svg className="w-[280px] h-[280px] transform -rotate-90">
          <circle
            cx="140"
            cy="140"
            r="130"
            className="stroke-white/5"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="140"
            cy="140"
            r="130"
            className={cn(
              "transition-colors duration-500",
              mode === 'pomodoro' ? 'stroke-blue-500' : 'stroke-blue-400'
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

        <div className="absolute flex flex-col items-center">
          <span className="text-7xl font-light tracking-tighter tabular-nums text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={resetTimer}
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <RotateCcw size={16} /> <span className="text-sm">Reset</span>
        </button>
        
        <button
          onClick={toggleTimer}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
        >
          {isActive ? <><Pause size={16} className="fill-current" /> <span className="text-sm">Pause</span></> : <><Play size={16} className="fill-current" /> <span className="text-sm">Start</span></>}
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors shadow-sm opacity-60 hover:opacity-100"
          title={soundEnabled ? "Mute sound" : "Enable sound"}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

    </div>
  );
}
