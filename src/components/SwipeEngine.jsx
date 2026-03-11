import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from './SwipeCard';
import { addTrackToPlaylist, removeTrackFromPlaylist } from '../lib/spotify';
import { addSwipedId, removeSwipedId } from '../lib/storage';

export default function SwipeEngine({ songs, setSongs, playlist, user, onChangePlaylist, onLogout }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [undoStack, setUndoStack] = useState([]); // { song, action: 'right'|'left' }
    const [toast, setToast] = useState(null);
    const [swiping, setSwiping] = useState(false);
    const toastTimer = useRef(null);

    const showToast = (message, type = 'info') => {
        clearTimeout(toastTimer.current);
        setToast({ message, type });
        toastTimer.current = setTimeout(() => setToast(null), 2000);
    };

    const handleSwipeRight = useCallback(async () => {
        if (swiping || currentIndex >= songs.length) return;
        setSwiping(true);

        const song = songs[currentIndex];
        addSwipedId(song.id);
        setUndoStack((prev) => [...prev.slice(-19), { song, action: 'right' }]);
        setCurrentIndex((i) => i + 1);

        showToast(`Added "${song.name}"`, 'success');

        try {
            await addTrackToPlaylist(playlist.id, song.uri);
        } catch (err) {
            console.error('Add track error:', err);
            showToast('Failed to add track', 'error');
        }

        setSwiping(false);
    }, [currentIndex, songs, playlist, swiping]);

    const handleSwipeLeft = useCallback(() => {
        if (swiping || currentIndex >= songs.length) return;
        setSwiping(true);

        const song = songs[currentIndex];
        addSwipedId(song.id);
        setUndoStack((prev) => [...prev.slice(-19), { song, action: 'left' }]);
        setCurrentIndex((i) => i + 1);

        showToast(`Skipped "${song.name}"`, 'info');
        setSwiping(false);
    }, [currentIndex, songs, swiping]);

    const handleUndo = useCallback(async () => {
        if (undoStack.length === 0) return;

        const last = undoStack[undoStack.length - 1];
        setUndoStack((prev) => prev.slice(0, -1));
        removeSwipedId(last.song.id);
        setCurrentIndex((i) => i - 1);

        if (last.action === 'right') {
            showToast(`Removed "${last.song.name}"`, 'undo');
            try {
                await removeTrackFromPlaylist(playlist.id, last.song.uri);
            } catch (err) {
                console.error('Remove track error:', err);
            }
        } else {
            showToast(`Restored "${last.song.name}"`, 'undo');
        }
    }, [undoStack, playlist]);

    const handleButtonSwipe = (direction) => {
        if (SwipeCard._triggerSwipe) {
            SwipeCard._triggerSwipe(direction);
        }
    };

    const remaining = songs.length - currentIndex;
    const progress = songs.length > 0 ? Math.round((currentIndex / songs.length) * 100) : 0;

    // Done state
    if (currentIndex >= songs.length && songs.length > 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-spotify-black px-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-spotify-green/15 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-spotify-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-white text-2xl font-bold mb-2">All done!</h2>
                    <p className="text-spotify-grey mb-8">You've swiped through all your liked songs.</p>
                    <div className="space-y-3">
                        <button
                            onClick={onChangePlaylist}
                            className="w-full py-3.5 bg-spotify-green text-black font-bold rounded-full active:scale-95 transition-transform"
                        >
                            Choose another playlist
                        </button>
                        <button
                            onClick={onLogout}
                            className="w-full py-3.5 bg-spotify-card text-white font-medium rounded-full active:scale-95 transition-transform"
                        >
                            Log out
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Empty state
    if (songs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-spotify-black px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-spotify-card rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-spotify-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                    </div>
                    <h2 className="text-white text-xl font-bold mb-2">No songs to swipe</h2>
                    <p className="text-spotify-grey text-sm mb-6">You've already swiped all your liked songs, or your library is empty.</p>
                    <button
                        onClick={onChangePlaylist}
                        className="px-8 py-3 bg-spotify-green text-black font-bold rounded-full active:scale-95 transition-transform"
                    >
                        Go back
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-spotify-black overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2 relative z-20">
                <button onClick={onChangePlaylist} className="text-spotify-grey hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-center flex-1 px-4 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{playlist.name}</p>
                    <p className="text-spotify-dim text-xs">{remaining} songs left</p>
                </div>
                <button onClick={onLogout} className="text-spotify-grey hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>

            {/* Progress bar */}
            <div className="px-5 mb-2 relative z-20">
                <div className="w-full h-1 bg-spotify-card rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-spotify-green rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Card stack */}
            <div className="flex-1 relative flex items-center justify-center">
                <AnimatePresence>
                    {[2, 1, 0].map((offset) => {
                        const index = currentIndex + offset;
                        if (index >= songs.length) return null;
                        const isTop = offset === 0;
                        const scale = 1 - offset * 0.05;
                        const translateY = offset * 12;

                        return (
                            <SwipeCard
                                key={songs[index].id}
                                song={songs[index]}
                                isTop={isTop}
                                onSwipeRight={handleSwipeRight}
                                onSwipeLeft={handleSwipeLeft}
                                style={{
                                    scale,
                                    y: translateY,
                                }}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6 pb-8 pt-4 relative z-20">
                {/* Skip (left) */}
                <motion.button
                    onClick={() => handleButtonSwipe('left')}
                    className="w-16 h-16 bg-spotify-card hover:bg-red-500/20 border-2 border-spotify-dim hover:border-red-500 rounded-full flex items-center justify-center transition-colors"
                    whileTap={{ scale: 0.9 }}
                >
                    <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>

                {/* Undo */}
                <motion.button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="w-12 h-12 bg-spotify-card hover:bg-spotify-card/80 border-2 border-spotify-dim rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                    whileTap={{ scale: 0.9 }}
                >
                    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
                    </svg>
                </motion.button>

                {/* Like (right) */}
                <motion.button
                    onClick={() => handleButtonSwipe('right')}
                    className="w-16 h-16 bg-spotify-card hover:bg-spotify-green/20 border-2 border-spotify-dim hover:border-spotify-green rounded-full flex items-center justify-center transition-colors"
                    whileTap={{ scale: 0.9 }}
                >
                    <svg className="w-7 h-7 text-spotify-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </motion.button>
            </div>

            {/* Toast notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className={`fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-sm font-medium shadow-xl z-50 ${toast.type === 'success'
                                ? 'bg-spotify-green text-black'
                                : toast.type === 'error'
                                    ? 'bg-red-500 text-white'
                                    : toast.type === 'undo'
                                        ? 'bg-yellow-500 text-black'
                                        : 'bg-spotify-card text-white'
                            }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
