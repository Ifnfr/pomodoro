import React, { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { Analytics } from './components/Analytics';
import { Todos } from './components/Todos';
import { Settings } from './components/Settings';
import { cn } from './lib/utils';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import type { User } from 'firebase/auth';
import { Palette, Volume2, Settings as SettingsIcon, CheckSquare } from 'lucide-react';
import { onAuthStateChanged, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { setCachedAccessToken } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';

type View = 'timer' | 'analytics' | 'todos' | 'settings';


const BACKGROUNDS = [
  { id: 'default', name: 'Default Dark', value: 'bg-[#0a0a0a]', isImage: false, themeColor: 'blue' },
  { id: 'starry-night', name: 'Starry Night (Van Gogh)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'yellow' },
  { id: 'great-wave', name: 'The Great Wave (Hokusai)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Great_Wave_off_Kanagawa.jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'pearl-earring', name: 'Pearl Earring (Vermeer)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/1665_Girl_with_a_Pearl_Earring.jpg?width=1280', isImage: true, themeColor: 'amber' },
  { id: 'wanderer', name: 'Wanderer (Friedrich)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg?width=1280', isImage: true, themeColor: 'slate' },
  { id: 'impression', name: 'Impression, Sunrise (Monet)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Monet_-_Impression,_Sunrise.jpg?width=1280', isImage: true, themeColor: 'orange' },
  { id: 'cafe-terrace', name: 'Café Terrace (Van Gogh)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Van_Gogh_-_Terrasse_des_Caf%C3%A9s_an_der_Place_du_Forum_in_Arles_am_Abend1.jpeg?width=1280', isImage: true, themeColor: 'yellow' },
  { id: 'mona-lisa', name: 'Mona Lisa (Da Vinci)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg?width=1280', isImage: true, themeColor: 'amber' },
  { id: 'kiss', name: 'The Kiss (Klimt)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Klimt_-_The_Kiss.jpg?width=1280', isImage: true, themeColor: 'yellow' },
  { id: 'sunday-afternoon', name: 'A Sunday on La Grande Jatte (Seurat)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/A_Sunday_on_La_Grande_Jatte,_Georges_Seurat,_1884.png?width=1280', isImage: true, themeColor: 'slate' },
  { id: 'birth-venus', name: 'Birth of Venus (Botticelli)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg?width=1280', isImage: true, themeColor: 'orange' },
  { id: 'parasol', name: 'Woman with a Parasol (Monet)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'water-lilies', name: 'Water Lilies (Monet)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'las-meninas', name: 'Las Meninas (Velázquez)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Las_Meninas,_by_Diego_Vel%C3%A1zquez,_from_Prado_in_Google_Earth.jpg?width=1280', isImage: true, themeColor: 'slate' },
  { id: 'night-watch', name: 'The Night Watch (Rembrandt)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Night_Watch_-_HD.jpg?width=1280', isImage: true, themeColor: 'amber' },
  { id: 'almond-blossoms', name: 'Almond Blossoms (Van Gogh)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'scream', name: 'The Scream (Munch)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg?width=1280', isImage: true, themeColor: 'orange' },
  { id: 'school-athens', name: 'School of Athens (Raphael)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sanzio_01.jpg?width=1280', isImage: true, themeColor: 'amber' },
  { id: 'creation-adam', name: 'Creation of Adam (Michelangelo)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Michelangelo_-_Creation_of_Adam_(cropped).jpg?width=1280', isImage: true, themeColor: 'yellow' },
  { id: 'the-swing', name: 'The Swing (Fragonard)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jean-Honor%C3%A9_Fragonard_-_The_Swing_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'slate' },
  { id: 'hay-wain', name: 'The Hay Wain (Constable)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/John_Constable_-_The_Hay_Wain_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'two-sisters', name: 'Two Sisters (Renoir)', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pierre-Auguste_Renoir_-_Two_Sisters_(On_the_Terrace)_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'orange' },
  { id: 'boating-party', name: 'Luncheon of the Boating Party', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pierre-Auguste_Renoir_-_Luncheon_of_the_Boating_Party_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'amber' },
  { id: 'liberty-leading', name: 'Liberty Leading the People', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg?width=1280', isImage: true, themeColor: 'slate' },
  { id: 'folies-bergere', name: 'A Bar at the Folies-Bergère', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Un_bar_aux_Folies_Berg%C3%A8re_d%27E._Manet_(Fondation_Vuitton,_Paris)_(34039014316).jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'bathers-asnieres', name: 'Bathers at Asnières', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Georges_Seurat_-_Bathers_at_Asni%C3%A8res_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'blue' },
  { id: 'arnolfini', name: 'The Arnolfini Portrait', value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jan_van_Eyck_-_The_Arnolfini_Portrait_-_Google_Art_Project.jpg?width=1280', isImage: true, themeColor: 'amber' },
  { id: 'live-howl', name: 'Howl\'s Moving Castle (Live)', value: '/howl.mp4', isImage: false, isVideo: true, themeColor: 'slate' },
  { id: 'live-gojo', name: 'Gojo Satoru (Live)', value: '/gojo.mp4', isImage: false, isVideo: true, themeColor: 'blue' },
  { id: 'live-windrises', name: 'The Wind Rises (Live)', value: '/the_wind_rises.mp4', isImage: false, isVideo: true, themeColor: 'orange' },
];

function VideoBackground({ src }: { src: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current) {
      // Force play it again whenever src changes if autoPlay didn't catch it
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (error.name !== 'AbortError') {
             console.warn('Video auto-play interrupted or prevented:', error);
          }
        });
      }
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      loop
      autoPlay
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('timer');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  const [bgId, setBgId] = useState(() => localStorage.getItem('pomodoro_bg') || 'default');
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgMusicUrl, setBgMusicUrl] = useState(() => localStorage.getItem('pomodoro_bg_music') || '');
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    localStorage.setItem('pomodoro_bg', bgId);
  }, [bgId]);

  useEffect(() => {
      const handleMusicChange = () => {
          setBgMusicUrl(localStorage.getItem('pomodoro_bg_music') || '');
      };
      window.addEventListener('bg_music_change', handleMusicChange);
      return () => window.removeEventListener('bg_music_change', handleMusicChange);
  }, []);

  useEffect(() => {
    const onInteract = () => setHasInteracted(true);
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);


  const currentBg = BACKGROUNDS.find(b => b.id === bgId) || BACKGROUNDS[0];

  useEffect(() => {
    try {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
              setCachedAccessToken(credential.accessToken);
            }
          }
        })
        .catch(e => {
        console.error("Redirect error: ", e);
      });
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
    } catch (err: any) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
  };

  return (
    <div className="h-screen w-full flex flex-col text-white select-none overflow-hidden relative bg-[#0a0a0a]">
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.div
            key={currentBg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={cn(
              "absolute inset-0 z-0", 
              (!currentBg.isImage && !(currentBg as any).isYoutube && !(currentBg as any).isVideo) ? currentBg.value : ""
            )}
          >
            {currentBg.isImage && (
              <>
                <img 
                  src={currentBg.value}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  {...(currentBg.value.includes('wikimedia') ? { referrerPolicy: 'no-referrer' } : {})}
                />
                <div className="absolute inset-0 bg-black/60 pointer-events-none z-10" />
              </>
            )}
            {(currentBg as any).isVideo && (
              <>
                <VideoBackground src={currentBg.value} />
                <div className="absolute inset-0 bg-black/60 pointer-events-none z-10" />
              </>
            )}
            {(currentBg as any).isYoutube && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-black">
                <ReactPlayer
                  url={`https://www.youtube.com/watch?v=${currentBg.value}`}
                  playing
                  loop
                  muted
                  controls={false}
                  width="110vw"
                  height="61.875vw"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ minWidth: '177.77vh', minHeight: '100vh' }}
                  onReady={() => console.log('Player ready')}
                  onError={(e) => console.log('Player error:', e)}
                  config={{
                    youtube: {
                      playerVars: { 
                        showinfo: 0, 
                        modestbranding: 1,
                        rel: 0,
                        vq: 'hd1080'
                      }
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/60 pointer-events-none z-10" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {bgMusicUrl && (
        <div className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden z-[-1]">
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${bgMusicUrl}`}
            playing={hasInteracted}
            loop={true}
            volume={0.5}
            width="100px"
            height="100px"
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1
                }
              }
            }}
          />
        </div>
      )}

      
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
                onClick={() => setCurrentView('todos')}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold py-3 transition-colors",
                  currentView === 'todos' ? "border-b-2 border-blue-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                <CheckSquare size={14} /> Todos
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
              <button
                onClick={() => setCurrentView('settings')}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold py-3 transition-colors",
                  currentView === 'settings' ? "border-b-2 border-blue-500 text-white" : "text-white/40 hover:text-white"
                )}
              >
                <SettingsIcon size={14} /> Settings
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
          <div className={cn(
            "w-full relative h-full transition-all duration-500",
            currentView === 'analytics' ? "max-w-4xl" : currentView === 'todos' ? "max-w-6xl" : currentView === 'settings' ? "max-w-2xl" : "max-w-[440px]"
          )}>
            <div className={cn("absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pt-12 transition-opacity duration-300", currentView === 'timer' ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")}>
              <Timer themeColor={currentBg.themeColor} />
            </div>
            
            {currentView === 'analytics' && (
              <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pt-12 z-20">
                <Analytics />
              </div>
            )}

            {currentView === 'todos' && (
              <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pt-12 z-20">
                <Todos />
              </div>
            )}

            {currentView === 'settings' && (
              <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide pt-12 z-20">
                <Settings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
