import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Music } from 'lucide-react';

export function Settings() {
  const [strictMode, setStrictMode] = useState(() => localStorage.getItem('pomodoro_strict_mode') !== 'false');
  const [bgMusicUrl, setBgMusicUrl] = useState(() => localStorage.getItem('pomodoro_bg_music') || '');

  const MUSIC_OPTIONS = [
    { id: '', name: 'None' },
    { id: 'jfKfPfyJRdk', name: 'Lofi Hip Hop Radio (24/7)' }, // Lofi Girl
    { id: '4xDzrDKg11J', name: 'Classical Piano (24/7)' }, // classical
    { id: 'Ftm2uvZ0Zu0', name: 'Deep Focus Ambient (24/7)' }, // Space ambient
    { id: 'lTRiuFIWV54', name: 'Rain & Thunder' } // Rain
  ];

  useEffect(() => {
    localStorage.setItem('pomodoro_strict_mode', String(strictMode));
    // Trigger generic dispatch for app
    window.dispatchEvent(new Event('strict_mode_change'));
  }, [strictMode]);

  useEffect(() => {
    localStorage.setItem('pomodoro_bg_music', bgMusicUrl);
    window.dispatchEvent(new Event('bg_music_change'));
  }, [bgMusicUrl]);

  return (
    <div className="flex flex-col p-8 h-full text-white max-w-lg mx-auto w-full">
      <h2 className="text-xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-6">
        {/* Strict Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <h3 className="font-semibold text-sm">Strict Mode</h3>
            <p className="text-xs text-white/50 mt-1">Disables the stop button during active focus sessions to prevent breaking the flow.</p>
          </div>
          <button 
            onClick={() => setStrictMode(!strictMode)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {strictMode ? <ToggleRight size={32} className="text-blue-400" /> : <ToggleLeft size={32} className="text-white/30" />}
          </button>
        </div>

        {/* Background Music */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Music size={16} className="text-white/70" />
            <h3 className="font-semibold text-sm">Background Music / Ambiance</h3>
          </div>
          <p className="text-xs text-white/50 mb-4">Plays long, continuous streams during your sessions.</p>
          
          <div className="flex flex-col gap-2">
            {MUSIC_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setBgMusicUrl(opt.id)}
                className={`p-3 rounded-lg text-sm font-medium text-left transition-colors flex items-center justify-between ${
                  bgMusicUrl === opt.id 
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-200' 
                  : 'bg-black/30 border border-transparent hover:bg-white/10 text-white/70'
                }`}
              >
                {opt.name}
                {bgMusicUrl === opt.id && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
