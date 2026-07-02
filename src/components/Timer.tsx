import React, { useEffect, useRef } from 'react';
import { TimerSettings } from '../types';
import { Play, Pause, RefreshCw, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { playAlarm, playTick, playBtnSound } from '../lib/audio';
import { formatTime } from '../lib/utils';
import { PipWrapper } from './PipWrapper';

interface TimerProps {
  settings: TimerSettings;
  activeTodoText: string | null;
  onSessionComplete: (type: 'focus' | 'shortBreak' | 'longBreak', duration: number) => void;
  secondsRemaining: number;
  setSecondsRemaining: React.Dispatch<React.SetStateAction<number>>;
  timerMode: 'focus' | 'shortBreak' | 'longBreak';
  setTimerMode: React.Dispatch<React.SetStateAction<'focus' | 'shortBreak' | 'longBreak'>>;
  isActive: boolean;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  pomodorosCompleted: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const Timer: React.FC<TimerProps> = ({
  settings,
  activeTodoText,
  onSessionComplete,
  secondsRemaining,
  setSecondsRemaining,
  timerMode,
  setTimerMode,
  isActive,
  setIsActive,
  pomodorosCompleted,
  soundEnabled,
  setSoundEnabled,
}) => {
  const lastTickTimeRef = useRef<number | null>(null);

  // Determine current duration based on settings & mode
  const getDuration = (mode: typeof timerMode) => {
    if (mode === 'focus') return settings.focusTime * 60;
    if (mode === 'shortBreak') return settings.shortBreak * 60;
    return settings.longBreak * 60;
  };

  const totalDuration = getDuration(timerMode);

  // Sync timer remaining if settings change and timer is NOT running
  useEffect(() => {
    if (!isActive) {
      setSecondsRemaining(totalDuration);
    }
  }, [settings.focusTime, settings.shortBreak, settings.longBreak, timerMode, isActive, totalDuration, setSecondsRemaining]);

  // Main tick timer loop with delta-time compensation for background tab throttling
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (isActive) {
      lastTickTimeRef.current = Date.now();
      timerId = setInterval(() => {
        const now = Date.now();
        const delta = lastTickTimeRef.current ? Math.round((now - lastTickTimeRef.current) / 1000) : 1;
        lastTickTimeRef.current = now;

        setSecondsRemaining((prev) => {
          if (prev <= delta) {
            // Timer complete!
            setIsActive(false);
            handleTimerComplete();
            return 0;
          }
          if (soundEnabled) {
            playTick(settings.soundVolume);
          }
          return prev - delta;
        });
      }, 1000);
    } else {
      lastTickTimeRef.current = null;
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isActive, timerMode, soundEnabled, settings.soundVolume]);

  const handleTimerComplete = () => {
    // 1. Play synthesized completion sound
    playAlarm(settings.soundTheme, settings.soundVolume);

    // 2. Report completed session
    onSessionComplete(timerMode, totalDuration);

    // 3. Cycle modes automatically
    if (timerMode === 'focus') {
      const isNextLongBreak = (pomodorosCompleted + 1) % settings.longBreakInterval === 0;
      const nextMode = isNextLongBreak ? 'longBreak' : 'shortBreak';
      setTimerMode(nextMode);
      setSecondsRemaining(getDuration(nextMode));
      if (settings.autoStartBreaks) {
        setTimeout(() => setIsActive(true), 1000);
      }
    } else {
      setTimerMode('focus');
      setSecondsRemaining(getDuration('focus'));
      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsActive(true), 1000);
      }
    }
  };

  const togglePlay = () => {
    playBtnSound();
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    playBtnSound();
    setIsActive(false);
    setSecondsRemaining(totalDuration);
  };

  const skipTimer = () => {
    playBtnSound();
    setIsActive(false);
    
    // Cycle modes
    if (timerMode === 'focus') {
      const isNextLongBreak = pomodorosCompleted % settings.longBreakInterval === 0 && pomodorosCompleted > 0;
      const nextMode = isNextLongBreak ? 'longBreak' : 'shortBreak';
      setTimerMode(nextMode);
      setSecondsRemaining(getDuration(nextMode));
    } else {
      setTimerMode('focus');
      setSecondsRemaining(getDuration('focus'));
    }
  };

  // SVG Progress calculation
  const strokeDashoffset = 502 - (502 * secondsRemaining) / totalDuration;

  return (
    <div className="flex flex-col items-center justify-center p-4 text-slate-100 h-full select-none">
      {/* Timer Modes Buttons */}
      <div className="flex gap-1.5 bg-slate-950/40 p-1 rounded-lg border border-slate-800/80 mb-5 max-w-full overflow-x-auto">
        <button
          onClick={() => {
            playBtnSound();
            setTimerMode('focus');
            setIsActive(false);
            setSecondsRemaining(settings.focusTime * 60);
          }}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
            timerMode === 'focus'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sesi Fokus 🎯
        </button>
        <button
          onClick={() => {
            playBtnSound();
            setTimerMode('shortBreak');
            setIsActive(false);
            setSecondsRemaining(settings.shortBreak * 60);
          }}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
            timerMode === 'shortBreak'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Break Singkat ☕
        </button>
        <button
          onClick={() => {
            playBtnSound();
            setTimerMode('longBreak');
            setIsActive(false);
            setSecondsRemaining(settings.longBreak * 60);
          }}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
            timerMode === 'longBreak'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Break Panjang 🌴
        </button>
      </div>

      {/* SVG Countdown Display */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        <svg className="absolute w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            className="stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke={timerMode === 'focus' ? '#f43f5e' : timerMode === 'shortBreak' ? '#10b981' : '#0ea5e9'}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray="502"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>

        {/* Big Counter text */}
        <div className="flex flex-col items-center justify-center z-10 text-center">
          <span className="text-4xl font-bold tracking-tight font-mono tabular-nums leading-none">
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            {timerMode === 'focus' ? 'FOKUS' : 'ISTIRAHAT'}
          </span>
        </div>
      </div>

      {/* Active Task Name */}
      {timerMode === 'focus' && (
        <div className="h-6 mb-4 max-w-full px-4 text-center">
          {activeTodoText ? (
            <div className="text-xs text-rose-300 font-medium truncate max-w-[240px] bg-rose-950/20 px-3 py-1 rounded-full border border-rose-900/30">
              Mengerjakan: <span className="font-bold">"{activeTodoText}"</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 italic">Belum ada tugas aktif yang dipilih</span>
          )}
        </div>
      )}
      {timerMode !== 'focus' && <div className="h-6 mb-4"></div>}

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        {/* Toggle Sound */}
        <button
          onClick={() => {
            playBtnSound();
            setSoundEnabled(!soundEnabled);
          }}
          className={`p-2.5 rounded-full border transition-all ${
            soundEnabled
              ? 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
              : 'bg-slate-950/60 text-slate-500 border-slate-900'
          }`}
          title={soundEnabled ? 'Matikan Suara Detak' : 'Aktifkan Suara Detak'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Start/Pause Play */}
        <button
          onClick={togglePlay}
          className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-white ${
            isActive
              ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/10'
              : timerMode === 'focus'
              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/20'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
          }`}
        >
          {isActive ? (
            <>
              <Pause size={16} fill="white" />
              <span>JEDA TIMER</span>
            </>
          ) : (
            <>
              <Play size={16} fill="white" />
              <span>MULAI FOKUS</span>
            </>
          )}
        </button>

        {/* Reset Timer */}
        <button
          onClick={resetTimer}
          className="p-2.5 rounded-full bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 text-slate-300 transition-all hover:scale-[1.05]"
          title="Reset Sesi"
        >
          <RefreshCw size={16} />
        </button>

        {/* Skip Timer */}
        <button
          onClick={skipTimer}
          className="p-2.5 rounded-full bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700 text-slate-300 transition-all hover:scale-[1.05]"
          title="Lewati Sesi"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* PiP Wrapper Widget */}
      <div className="mt-5 shrink-0">
        <PipWrapper
          secondsRemaining={secondsRemaining}
          timerMode={timerMode}
          isActive={isActive}
          onTogglePlay={togglePlay}
          onReset={resetTimer}
        />
      </div>
    </div>
  );
};
