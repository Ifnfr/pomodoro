import React from 'react';
import { TimerSettings } from '../types';
import { Volume2, VolumeX, Shield } from 'lucide-react';
import { playAlarm, playBtnSound } from '../lib/audio';

interface SettingsProps {
  settings: TimerSettings;
  onSave: (settings: TimerSettings) => void;
  isFirebaseConnected: boolean;
  onDeployRules?: () => void;
}

const THEME_WALLPAPERS = [
  { name: 'Starry Dark', value: 'linear-gradient(to right, #0f172a, #1e1b4b)' },
  { name: 'Classic Teal', value: '#008080' },
  { name: 'Solar Aurora', value: 'linear-gradient(to bottom right, #022c22, #064e3b, #0f172a)' },
  { name: 'Warm Sunset', value: 'linear-gradient(to right, #1e1b4b, #311042, #180018)' },
  { name: 'Cyberpunk Grid', value: 'radial-gradient(circle at center, #1e1b4b 0%, #03001e 100%)' }
];

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSave,
  isFirebaseConnected,
}) => {
  const handleChange = (key: keyof TimerSettings, value: unknown) => {
    const updated = { ...settings, [key]: value };
    onSave(updated);
  };

  const testSound = () => {
    playAlarm(settings.soundTheme, settings.soundVolume);
  };

  return (
    <div className="flex flex-col gap-5 p-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
        <h3 className="font-semibold text-sm tracking-wider uppercase text-slate-400">Durasi Sesi (Menit)</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Fokus</label>
          <input
            type="number"
            min="1"
            max="120"
            value={settings.focusTime}
            onChange={(e) => {
              playBtnSound();
              handleChange('focusTime', parseInt(e.target.value) || 25);
            }}
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-2.5 py-1.5 text-center text-sm focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Break Singkat</label>
          <input
            type="number"
            min="1"
            max="45"
            value={settings.shortBreak}
            onChange={(e) => {
              playBtnSound();
              handleChange('shortBreak', parseInt(e.target.value) || 5);
            }}
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-2.5 py-1.5 text-center text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Break Panjang</label>
          <input
            type="number"
            min="1"
            max="60"
            value={settings.longBreak}
            onChange={(e) => {
              playBtnSound();
              handleChange('longBreak', parseInt(e.target.value) || 15);
            }}
            className="w-full bg-slate-900/60 border border-slate-700/60 rounded px-2.5 py-1.5 text-center text-sm focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
          <label>Interval Break Panjang</label>
          <span className="text-rose-400">{settings.longBreakInterval} Sesi</span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          value={settings.longBreakInterval}
          onChange={(e) => {
            playBtnSound();
            handleChange('longBreakInterval', parseInt(e.target.value));
          }}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-700/50 pt-4">
        <h3 className="font-semibold text-sm tracking-wider uppercase text-slate-400 pb-1">Efek Suara</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Tema Suara</label>
            <select
              value={settings.soundTheme}
              onChange={(e) => {
                playBtnSound();
                handleChange('soundTheme', e.target.value as TimerSettings['soundTheme']);
              }}
              className="bg-slate-900/60 border border-slate-700/60 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-rose-500 transition-colors text-slate-200"
            >
              <option value="classic" className="bg-slate-900">Classic Beep</option>
              <option value="digital" className="bg-slate-900">Digital Synthesizer</option>
              <option value="soft" className="bg-slate-900">Soft Chime</option>
              <option value="nature" className="bg-slate-900">Nature Calm</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 justify-end">
            <button
              onClick={testSound}
              className="w-full border border-slate-600 hover:border-slate-400 hover:bg-slate-800 text-slate-300 font-medium rounded py-1.5 text-xs transition-colors"
            >
              Uji Coba Suara 🔊
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="flex items-center gap-1">
              {settings.soundVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              Volume Alarm
            </span>
            <span>{Math.round(settings.soundVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundVolume}
            onChange={(e) => handleChange('soundVolume', parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-700/50 pt-4">
        <h3 className="font-semibold text-sm tracking-wider uppercase text-slate-400 pb-1">Wallpaper Desktop</h3>
        <div className="flex flex-wrap gap-2">
          {THEME_WALLPAPERS.map((wall) => (
            <button
              key={wall.name}
              onClick={() => {
                playBtnSound();
                handleChange('themeBackground', wall.value);
              }}
              className={`text-xs px-2.5 py-1.5 rounded border transition-all font-medium ${
                settings.themeBackground === wall.value
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/80 shadow'
                  : 'bg-slate-800/40 border-slate-700/80 hover:border-slate-500 text-slate-300'
              }`}
            >
              {wall.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-700/50 pt-4 mt-1 bg-slate-800/20 p-2.5 rounded border border-slate-700/40">
        <Shield size={20} className={isFirebaseConnected ? "text-emerald-400 shrink-0" : "text-amber-400 shrink-0"} />
        <div className="flex flex-col text-xs leading-normal">
          <span className="font-bold text-slate-300">
            {isFirebaseConnected ? "Sinkronisasi Firebase Aktif" : "Mode Offline Lokal"}
          </span>
          <span className="text-slate-400 mt-0.5">
            {isFirebaseConnected 
              ? "Semua data Pomodoro, setelan, & tugas Anda tersimpan otomatis di Cloud Firestore." 
              : "Berjalan sepenuhnya di browser secara lokal. Hubungkan Firebase untuk sinkronisasi cloud."}
          </span>
        </div>
      </div>
    </div>
  );
};
