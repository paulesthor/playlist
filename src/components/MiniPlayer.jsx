import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, MonitorSpeaker } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext';
import FullScreenPlayer from './FullScreenPlayer';

export default function MiniPlayer() {
    const { currentTrack, isPlaying, togglePlay, progress, skipNext, skipPrevious, seek, isPremium } = usePlayer();
    const [isExpanded, setIsExpanded] = useState(false);
    const [localProgress, setLocalProgress] = useState(null);

    if (!currentTrack) return null;

    const totalDuration = !isPremium ? 30000 : (currentTrack.duration_ms || 30000);
    const displayProgress = localProgress !== null ? localProgress : progress;
    const progressPercent = totalDuration ? Math.min((displayProgress / totalDuration) * 100, 100) : 0;

    return (
        <>
            <div
                onClick={() => setIsExpanded(true)}
                className="mx-2 mb-2 bg-[#2a2a2a] rounded-md shadow-2xl overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform relative"
            >
                {/* The main hit area */}
                <div className="flex items-center p-2 gap-3 relative">
                    <img
                        src={currentTrack.album?.images?.[0]?.url || currentTrack.image}
                        alt="Album Art"
                        className="w-[40px] h-[40px] rounded shadow-sm object-cover"
                    />

                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-white text-[13px] font-bold truncate leading-tight">
                            {currentTrack.name}
                        </h4>
                        <p className="text-[#B3B3B3] text-[11px] truncate">
                            {currentTrack.artists?.[0]?.name || currentTrack.artist}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pr-2">
                        <button className="text-[#a7a7a7] hover:text-white transition-colors hidden sm:block">
                            <MonitorSpeaker size={20} className="stroke-[1.5]" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); skipPrevious(); }} className="text-white hover:scale-110 active:scale-95 transition-transform p-1">
                            <SkipBack size={20} className="fill-current" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="text-white hover:scale-110 active:scale-95 transition-transform flex items-center justify-center p-1"
                        >
                            {isPlaying ? <Pause size={24} className="fill-current stroke-white stroke-[1.5]" /> : <Play size={24} className="fill-current stroke-white stroke-[1.5]" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); skipNext(); }} className="text-white hover:scale-110 active:scale-95 transition-transform p-1">
                            <SkipForward size={20} className="fill-current" />
                        </button>
                    </div>
                </div>

                {/* Bottom edge interactive progress bar */}
                <div className="relative h-[4px] w-full bg-[#4f4f4f] rounded-b-md opacity-80 cursor-pointer group flex items-center">
                    <div
                        className="absolute left-0 h-full bg-white group-active:bg-spotify-green rounded-r-full pointer-events-none"
                        style={{ width: `${progressPercent}%` }}
                    />
                    <div className="absolute h-2 w-2 bg-white rounded-full pointer-events-none opacity-0 group-active:opacity-100 shadow z-10" style={{ left: `calc(${progressPercent}% - 4px)` }} />

                    {/* Fat invisible hit area */}
                    <input
                        type="range"
                        min="0"
                        max={totalDuration}
                        value={displayProgress}
                        onChange={e => setLocalProgress(Number(e.target.value))}
                        onMouseUp={e => { seek(Number(e.target.value)); setLocalProgress(null); e.stopPropagation(); }}
                        onTouchEnd={e => { seek(Number(e.target.value)); setLocalProgress(null); e.stopPropagation(); }}
                        onClick={e => e.stopPropagation()}
                        onPointerDown={e => e.stopPropagation()}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-[20px] -top-[10px]"
                    />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && <FullScreenPlayer onClose={() => setIsExpanded(false)} />}
            </AnimatePresence>
        </>
    );
}
