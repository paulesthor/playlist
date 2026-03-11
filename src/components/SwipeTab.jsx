import React from 'react';
import SwipeEngine from './SwipeEngine';
import PlaylistSelect from './PlaylistSelect';
import { Layers } from 'lucide-react';

export default function SwipeTab({
    songs,
    setSongs,
    user,
    targetPlaylist,
    setTargetPlaylist,
    onPlaylistSelected
}) {
    if (!targetPlaylist) {
        return (
            <div className="h-full bg-spotify-black overflow-y-auto">
                <div className="p-4 border-b border-[#282828] bg-[#121212] sticky top-0 z-10 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Layers size={20} className="text-spotify-green" /> Select Target
                    </h1>
                </div>
                <div className="p-4">
                    <PlaylistSelect user={user} onSelect={onPlaylistSelected} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-spotify-black relative">
            <div className="p-4 flex items-center justify-between z-10 sticky top-0 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-spotify-grey font-bold tracking-wider">Targeting</span>
                    <h2 className="text-white font-bold leading-tight truncate max-w-[200px]">{targetPlaylist.name}</h2>
                </div>
                <button
                    onClick={() => setTargetPlaylist(null)}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors font-medium border border-white/10"
                >
                    Change
                </button>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <SwipeEngine
                    songs={songs}
                    setSongs={setSongs}
                    playlist={targetPlaylist}
                    user={user}
                />
            </div>
        </div>
    );
}
