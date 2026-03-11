import React, { useState, useEffect } from 'react';
import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, MonitorSpeaker, Share2, Heart, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import { checkSavedTrack, saveTrack, removeSavedTrack } from '../lib/spotify';
import TrackContextMenu from './TrackContextMenu';

function formatTime(ms) {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function FullScreenPlayer({ onClose }) {
    const { currentTrack, isPlaying, togglePlay, progress, skipNext, skipPrevious, seek, isPremium } = usePlayer();
    const [localProgress, setLocalProgress] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [menuTrack, setMenuTrack] = useState(null);

    useEffect(() => {
        if (currentTrack) {
            checkSavedTrack(currentTrack.id).then(setIsSaved);
        }
    }, [currentTrack]);

    if (!currentTrack) return null;

    const totalDuration = !isPremium ? 30000 : (currentTrack.duration_ms || 30000);
    const displayProgress = localProgress !== null ? localProgress : progress;
    const progressPercent = totalDuration ? Math.min((displayProgress / totalDuration) * 100, 100) : 0;

    const toggleSave = async () => {
        const nextState = !isSaved;
        setIsSaved(nextState);
        if (nextState) {
            await saveTrack(currentTrack.id);
        } else {
            await removeSavedTrack(currentTrack.id);
        }
    };

    const handleDragEnd = (event, info) => {
        if (info.offset.x < -100) {
            skipNext();
        } else if (info.offset.x > 100) {
            skipPrevious();
        }
    };

    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-gradient-to-b from-[#5a5a5a] to-spotify-black flex flex-col px-6 pb-12 pt-12"
        >
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8">
                <button onClick={onClose} className="p-2 -ml-2 text-white active:scale-95 transition-transform cursor-pointer">
                    <ChevronDown size={30} className="stroke-[2]" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-white uppercase text-[10px] font-bold tracking-widest opacity-80">Playing from Album</span>
                    <span className="text-white text-xs font-bold truncate max-w-[200px]">{currentTrack.album?.name || "Spotiflow"}</span>
                </div>
                <button onClick={() => setMenuTrack(currentTrack)} className="p-2 -mr-2 text-white active:scale-95 transition-transform cursor-pointer">
                    <MoreHorizontal size={24} className="stroke-[2]" />
                </button>
            </div>

            {/* Album Art with Swipe Gestures */}
            <div className="flex-1 flex flex-col justify-center mb-8 h-full min-h-0">
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.8}
                    onDragEnd={handleDragEnd}
                    className="w-full aspect-square relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing rounded"
                >
                    <img
                        src={currentTrack.album?.images?.[0]?.url || currentTrack.image}
                        alt={currentTrack.name}
                        className="w-full h-full object-cover rounded pointer-events-none"
                    />
                </motion.div>
            </div>

            {/* Track Info */}
            <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col min-w-0 pr-4">
                    <h2 className="text-white text-2xl font-bold truncate leading-tight">{currentTrack.name}</h2>
                    <p className="text-[#b3b3b3] text-[16px] truncate mt-1">{currentTrack.artists?.[0]?.name || currentTrack.artist}</p>
                </div>
                <button onClick={toggleSave} className="p-2 -mr-2 active:scale-95 transition-transform">
                    {isSaved ? <Check size={26} className="text-spotify-green" /> : <Heart size={26} className="text-white" />}
                </button>
            </div>

            {/* Seek Bar */}
            <div className="mb-6">
                <div className="relative w-full h-8 flex items-center group cursor-pointer">
                    <div className="absolute left-0 right-0 h-1 bg-[#4f4f4f] rounded-full pointer-events-none" />
                    <div className="absolute left-0 h-1 bg-white group-active:bg-spotify-green rounded-full pointer-events-none" style={{ width: `${progressPercent}%` }} />
                    <div className="absolute h-3 w-3 bg-white rounded-full pointer-events-none opacity-0 group-active:opacity-100 shadow z-10" style={{ left: `calc(${progressPercent}% - 6px)` }} />
                    <input
                        type="range"
                        min="0"
                        max={totalDuration}
                        value={displayProgress}
                        onChange={e => setLocalProgress(Number(e.target.value))}
                        onMouseUp={e => { seek(Number(e.target.value)); setLocalProgress(null); }}
                        onTouchEnd={e => { seek(Number(e.target.value)); setLocalProgress(null); }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <div className="flex justify-between text-[#a7a7a7] text-xs font-medium mt-1">
                    <span>{formatTime(displayProgress)}</span>
                    <span>{formatTime(totalDuration)}</span>
                </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between mb-8">
                <button className="text-[#a7a7a7] hover:text-white transition-colors p-2 -ml-2">
                    <Shuffle size={24} className="stroke-[1.5]" />
                </button>
                <button onClick={skipPrevious} className="text-white p-2 hover:scale-110 active:scale-95 transition-transform">
                    <SkipBack size={36} className="fill-current" />
                </button>
                <button onClick={togglePlay} className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-lg">
                    {isPlaying ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current ml-1" />}
                </button>
                <button onClick={skipNext} className="text-white p-2 hover:scale-110 active:scale-95 transition-transform">
                    <SkipForward size={36} className="fill-current" />
                </button>
                <button className="text-[#a7a7a7] hover:text-white transition-colors p-2 -mr-2">
                    <Repeat size={24} className="stroke-[1.5]" />
                </button>
            </div>

            {/* Bottom Footer Actions */}
            <div className="flex justify-between items-center mb-4">
                <button className="text-[#a7a7a7] hover:text-white transition-colors flex items-center gap-1">
                    <MonitorSpeaker size={20} className="stroke-[1.5]" />
                </button>
                <button className="text-[#a7a7a7] hover:text-white transition-colors flex items-center gap-1">
                    <Share2 size={20} className="stroke-[1.5]" />
                </button>
            </div>

            {/* Injected Context Menu */}
            <TrackContextMenu track={menuTrack} onClose={() => setMenuTrack(null)} />
        </motion.div>
    );
}
