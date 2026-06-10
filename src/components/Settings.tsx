import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Music } from 'lucide-react';

export function Settings() {
  const [strictMode, setStrictMode] = useState(() => localStorage.getItem('pomodoro_strict_mode') !== 'false');

  useEffect(() => {
    localStorage.setItem('pomodoro_strict_mode', String(strictMode));
    // Trigger generic dispatch for app
    window.dispatchEvent(new Event('strict_mode_change'));
  }, [strictMode]);

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
      </div>
    </div>
  );
}
