import React, { useState } from 'react';
import { Timer } from './components/Timer';
import { Analytics } from './components/Analytics';
import { cn } from './lib/utils';

type View = 'timer' | 'analytics';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('timer');

  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a0a] text-white select-none overflow-hidden">
        
      {/* Navigation inside the app */}
      <header className="h-12 shrink-0 flex items-center px-6 bg-white/5 border-b border-white/5 titlebar">
        <div className="flex gap-8 w-full max-w-xl mx-auto">
          <button
            onClick={() => setCurrentView('timer')}
            className={cn(
              "text-xs font-semibold py-3 transition-colors",
              currentView === 'timer' ? "border-b-2 border-blue-500 text-white" : "text-white opacity-40 hover:opacity-100"
            )}
          >
            Timer
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={cn(
              "text-xs font-semibold py-3 transition-colors",
              currentView === 'analytics' ? "border-b-2 border-blue-500 text-white" : "text-white opacity-40 hover:opacity-100"
            )}
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center">
        <div className="w-full max-w-[440px] pt-12">
          {currentView === 'timer' ? <Timer /> : <Analytics />}
        </div>
      </div>
    </div>
  );
}
