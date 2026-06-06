import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Mode } from '../types';
import { addSession, getSessions } from '../lib/storage';
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

export function Timer({ themeColor = 'blue' }: { themeColor?: string }) {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS['pomodoro']);
  const [isActive, setIsActive] = useState(false);
  const [topic, setTopic] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('focus_sound') !== 'false';
  });
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

  const THEME_COLORS: Record<string, { stroke: string, strokeIdle: string, textObj: string, textIdle: string, textBold: string, button: string, buttonHover: string, shadow: string, focusBorder: string, tagBg: string, tagBorder: string, tagTextActive: string }> = {
    blue: { stroke: 'stroke-blue-500', strokeIdle: 'stroke-blue-400', textObj: 'text-blue-500', textIdle: 'text-blue-400', textBold: 'text-blue-400', button: 'bg-blue-600', buttonHover: 'hover:bg-blue-500', shadow: 'shadow-blue-900/20', focusBorder: 'focus:border-blue-500/50', tagBg: 'bg-blue-500/20', tagBorder: 'border-blue-500/50', tagTextActive: 'text-blue-300' },
    yellow: { stroke: 'stroke-yellow-500', strokeIdle: 'stroke-yellow-400', textObj: 'text-yellow-500', textIdle: 'text-yellow-400', textBold: 'text-yellow-400', button: 'bg-yellow-600', buttonHover: 'hover:bg-yellow-500', shadow: 'shadow-yellow-900/20', focusBorder: 'focus:border-yellow-500/50', tagBg: 'bg-yellow-500/20', tagBorder: 'border-yellow-500/50', tagTextActive: 'text-yellow-300' },
    amber: { stroke: 'stroke-amber-500', strokeIdle: 'stroke-amber-400', textObj: 'text-amber-500', textIdle: 'text-amber-400', textBold: 'text-amber-400', button: 'bg-amber-600', buttonHover: 'hover:bg-amber-500', shadow: 'shadow-amber-900/20', focusBorder: 'focus:border-amber-500/50', tagBg: 'bg-amber-500/20', tagBorder: 'border-amber-500/50', tagTextActive: 'text-amber-300' },
    slate: { stroke: 'stroke-slate-400', strokeIdle: 'stroke-slate-300', textObj: 'text-slate-400', textIdle: 'text-slate-300', textBold: 'text-slate-300', button: 'bg-slate-500', buttonHover: 'hover:bg-slate-400', shadow: 'shadow-slate-900/20', focusBorder: 'focus:border-slate-500/50', tagBg: 'bg-slate-500/20', tagBorder: 'border-slate-500/50', tagTextActive: 'text-slate-300' },
    orange: { stroke: 'stroke-orange-500', strokeIdle: 'stroke-orange-400', textObj: 'text-orange-500', textIdle: 'text-orange-400', textBold: 'text-orange-400', button: 'bg-orange-600', buttonHover: 'hover:bg-orange-500', shadow: 'shadow-orange-900/20', focusBorder: 'focus:border-orange-500/50', tagBg: 'bg-orange-500/20', tagBorder: 'border-orange-500/50', tagTextActive: 'text-orange-300' },
  };

  const theme = THEME_COLORS[themeColor] || THEME_COLORS.blue;

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
                ? `${theme.textBold} font-bold opacity-100` 
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

        <div className="absolute flex flex-col items-center">
          <span className="text-7xl font-light tracking-tighter tabular-nums text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        {mode === 'pomodoro' && (
          <div className="w-full max-w-[320px] flex flex-col items-center gap-3">
            <input
              type="text"
              placeholder="What are you focusing on? (Add a tag)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isActive}
              className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-center text-white placeholder-white/30 focus:outline-none ${theme.focusBorder} transition-colors disabled:opacity-50`}
            />
            {existingTopics.length > 0 && (
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
            )}
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
