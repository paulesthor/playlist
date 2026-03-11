import { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import LoadingScreen from './components/LoadingScreen';
import { handleCallback, isAuthenticated, logout } from './lib/auth';
import { getCurrentUser, fetchAllLikedSongs } from './lib/spotify';
import { getSwipedIds, getTargetPlaylist, clearTargetPlaylist, setTargetPlaylist as setStorageTargetPlaylist } from './lib/storage';

import SwipeTab from './components/SwipeTab';
import BottomNav from './components/BottomNav';
import LibraryTab from './components/LibraryTab';
import SearchTab from './components/SearchTab';
import InsightsTab from './components/InsightsTab';
import AIHubTab from './components/AIHubTab';
import MiniPlayer from './components/MiniPlayer';
import { PlayerProvider } from './context/PlayerContext';

function MainApp() {
  const [activeTab, setActiveTab] = useState('library');
  const [view, setView] = useState('loading'); // loading | login | main
  const [user, setUser] = useState(null);
  const [songs, setSongs] = useState([]);
  const [targetPlaylist, setTargetPlaylist] = useState(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState(null);

  const loadSongs = useCallback(async () => {
    try {
      const allSongs = await fetchAllLikedSongs((loaded, total) => {
        setLoadProgress({ loaded, total });
      });

      // Filter out already swiped songs
      const swipedIds = getSwipedIds();
      const unswiped = allSongs.filter((s) => !swipedIds.has(s.id));
      setSongs(unswiped);
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to fetch library.');
    }
  }, []);

  // Handle OAuth callback & auth check
  useEffect(() => {
    async function init() {
      try {
        const wasCallback = await handleCallback();

        if (isAuthenticated()) {
          const me = await getCurrentUser();
          setUser(me);

          const saved = getTargetPlaylist();
          if (saved) {
            setTargetPlaylist(saved);
          }

          await loadSongs();
          setView('main');
        } else {
          setView('login');
        }
      } catch (err) {
        console.error('Init error:', err);
        setError(err.message);
        setView('login');
      }
    }
    init();
  }, [loadSongs]);

  const handlePlaylistSelected = useCallback((playlist) => {
    setTargetPlaylist(playlist);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    setSongs([]);
    setTargetPlaylist(null);
    clearTargetPlaylist();
    setView('login');
  }, []);

  if (error && view === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-spotify-black text-white p-6">
        <div className="text-red-400 text-lg mb-4">Something went wrong</div>
        <p className="text-spotify-grey text-sm mb-6 text-center">{error}</p>
        <button
          onClick={() => { setError(null); setView('login'); }}
          className="px-6 py-3 bg-spotify-green text-black font-bold rounded-full"
        >
          Try Again
        </button>
      </div>
    );
  }

  switch (view) {
    case 'loading':
      return <LoadingScreen progress={loadProgress} />;
    case 'login':
      return <LoginScreen />;
    case 'main':
      return (
        <div className="h-full flex flex-col bg-spotify-black text-white relative w-full overflow-hidden">

          {/* Main content area needs enough padding to scroll past the fixed MiniPlayer + Nav */}
          <div className="flex-1 overflow-y-auto pb-[140px] z-0">
            {activeTab === 'swipe' && (
              <SwipeTab
                songs={songs}
                setSongs={setSongs}
                user={user}
                targetPlaylist={targetPlaylist}
                setTargetPlaylist={setTargetPlaylist}
                onPlaylistSelected={handlePlaylistSelected}
              />
            )}
            {activeTab === 'search' && (
              <SearchTab targetPlaylist={targetPlaylist} />
            )}
            {activeTab === 'library' && (
              <LibraryTab />
            )}
            {activeTab === 'insights' && (
              <InsightsTab />
            )}
            {activeTab === 'ai' && (
              <AIHubTab />
            )}
          </div>

          {/* Persistent Floating Controls & Navigation */}
          <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-none pb-safe">
            <div className="pointer-events-auto bg-gradient-to-t from-black/60 to-transparent pt-4">
              <MiniPlayer />
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>

        </div>
      );
    default:
      return <LoadingScreen progress={loadProgress} />;
  }
}

export default function App() {
  return (
    <PlayerProvider>
      <MainApp />
    </PlayerProvider>
  );
}
