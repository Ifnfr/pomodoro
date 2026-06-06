import React, { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { Analytics } from './components/Analytics';
import { cn } from './lib/utils';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import type { User } from 'firebase/auth';
import { Palette } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

type View = 'timer' | 'analytics';

const BACKGROUNDS = [
  { id: 'default', name: 'Default Dark', value: 'bg-[#0a0a0a]', isImage: false, themeColor: 'blue' },
  { id: 'starry-night', name: 'Starry Night (Van Gogh)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'yellow' },
  { id: 'great-wave', name: 'The Great Wave (Hokusai)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Great_Wave_off_Kanagawa.jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'pearl-earring', name: 'Pearl Earring (Vermeer)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/1665_Girl_with_a_Pearl_Earring.jpg?width=1280', isImage: true, themeColor: 'amber' },
  { id: 'wanderer', name: 'Wanderer (Friedrich)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg?width=1280', isImage: true, themeColor: 'slate' },
  { id: 'impression', name: 'Impression, Sunrise (Monet)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Monet_-_Impression,_Sunrise.jpg?width=1280', isImage: true, themeColor: 'orange' },
  { id: 'cafe-terrace', name: 'Café Terrace (Van Gogh)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Terrasse_des_Caf%C3%A9s_an_der_Place_du_Forum_in_Arles_am_Abend1.jpeg?width=1280', isImage: true, themeColor: 'yellow' },
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('timer');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const [bgId, setBgId] = useState(() => localStorage.getItem('pomodoro_bg') || 'default');
  const [showBgPicker, setShowBgPicker] = useState(false);

  useEffect(() => {
    localStorage.setItem('pomodoro_bg', bgId);
  }, [bgId]);

  const currentBg = BACKGROUNDS.find(b => b.id === bgId) || BACKGROUNDS[0];

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setNeedsAuth(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("Auth initialization failed. Check config.", e);
    }
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
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
    <div 
      className={cn(
        "h-screen w-full flex flex-col text-white select-none overflow-hidden transition-all duration-700 relative",
        !currentBg.isImage && currentBg.value
      )}
    >
      {/* Image background with no-referrer to fix hotlinking issues */}
      {currentBg.isImage && (
        <img 
          src={currentBg.value}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700"
          referrerPolicy="no-referrer"
        />
      )}

      {/* Overlay for image backgrounds to ensure readability */}
      {currentBg.isImage && <div className="absolute inset-0 bg-black/60 pointer-events-none transition-opacity duration-700" />}
      
      {/* App content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Navigation inside the app */}
        <header className="h-12 shrink-0 flex items-center px-4 sm:px-6 bg-white/5 border-b border-white/5 backdrop-blur-md relative z-50">
          <div className="flex justify-between items-center w-full max-w-xl mx-auto">
            <nav className="flex gap-4 sm:gap-8 border-b-transparent">
              <button
                onClick={() => setCurrentView('timer')}
                className={cn(
                  "text-xs font-semibold py-3 transition-colors",
                  currentView === 'timer' ? "border-b-2 border-blue-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                Timer
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={cn(
                  "text-xs font-semibold py-3 transition-colors",
                  currentView === 'analytics' ? "border-b-2 border-blue-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                Dashboard
              </button>
            </nav>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowBgPicker(!showBgPicker)}
                  className="p-1.5 opacity-50 hover:bg-white/10 hover:opacity-100 rounded-lg transition-all text-white"
                  title="Change Background"
                >
                  <Palette size={16} />
                </button>
                {/* Background Picker Dropdown */}
                {showBgPicker && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#171717] border border-white/5 rounded-xl shadow-2xl p-2 z-50">
                    <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2 px-2 pt-1 font-semibold">Backgrounds</div>
                    <div className="flex flex-col gap-1 max-h-60 overflow-y-auto scrollbar-hide">
                      {BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => {
                            setBgId(bg.id);
                            setShowBgPicker(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                            bg.id === bgId ? "bg-blue-500/20 text-blue-300" : "hover:bg-white/5 text-white/70 hover:text-white"
                          )}
                        >
                          {bg.isImage ? (
                            <img
                              src={bg.value}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/20"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-4 h-4 rounded-full shrink-0 border border-white/20 ${bg.value}`} />
                          )}
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!user ? (
                <button 
                  onClick={handleLogin}
                  className="text-xs flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full font-medium"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center gap-3 pl-2 border-l border-white/10">
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

        {/* Global click to close bg picker */}
        {showBgPicker && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowBgPicker(false)} 
          />
        )}

        <div className="flex-1 overflow-hidden flex justify-center">
          <div className="w-full max-w-[440px] relative h-full">
            <div className={cn("absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pt-12 transition-opacity duration-300", currentView === 'timer' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <Timer themeColor={currentBg.themeColor} />
            </div>
            
            {currentView === 'analytics' && (
              <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pt-12 z-20">
                <Analytics />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
