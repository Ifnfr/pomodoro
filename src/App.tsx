import React, { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { Analytics } from './components/Analytics';
import { cn } from './lib/utils';
import { initAuth, googleSignIn, logout } from './lib/auth';
import type { User } from 'firebase/auth';

type View = 'timer' | 'analytics';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('timer');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Only init auth if we are in an environment that has valid config
    // Actually, initAuth will work but with dummy config it might fail initialization, 
    // we'll just handle it gracefully.
    try {
      const unsubscribe = initAuth(
        (u) => {
          setUser(u);
          setNeedsAuth(false);
        },
        () => {
          setUser(null);
          setNeedsAuth(true);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Auth initialization failed. Check config.", e);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a0a] text-white select-none overflow-hidden">
        
      {/* Navigation inside the app */}
      <header className="h-12 shrink-0 flex items-center px-6 bg-white/5 border-b border-white/5 titlebar">
        <div className="flex justify-between items-center w-full max-w-xl mx-auto">
          <nav className="flex gap-8">
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
          </nav>
          
          <div>
            {!user ? (
              <button 
                onClick={handleLogin}
                className="text-xs flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full font-medium"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs opacity-50">{user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="text-xs opacity-40 hover:opacity-100 transition-opacity"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
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
