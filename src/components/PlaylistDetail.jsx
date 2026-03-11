import React, { useState, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Play, Heart } from 'lucide-react';
import { fetchPlaylistTracks, fetchAllLikedSongs } from '../lib/spotify';
import { usePlayer } from '../context/PlayerContext';
import TrackContextMenu from './TrackContextMenu';

export default function PlaylistDetail({ playlist, onClose }) {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuTrack, setMenuTrack] = useState(null);
    const { playTrack, currentTrack } = usePlayer();

    useEffect(() => {
        setLoading(true);
        if (playlist.id === 'liked') {
            fetchAllLikedSongs().then(data => {
                setTracks(data);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            fetchPlaylistTracks(playlist.id).then(data => {
                setTracks(data);
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [playlist.id]);

    const isLiked = playlist.id === 'liked';

    return (
        <div className="absolute inset-0 bg-spotify-black z-40 overflow-y-auto pb-24 flex flex-col transform transition-transform">
            {/* Header */}
            <div className={`pt-12 px-4 pb-4 bg-gradient-to-b ${isLiked ? 'from-[#4b14d2]' : 'from-[#535353]'} to-spotify-black flex flex-col`}>
                <button onClick={onClose} className="text-white mb-4 w-fit active:scale-95 transition-transform p-1">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex gap-4 items-end mt-4">
                    {isLiked ? (
                        <div className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-[#4b14d2] to-[#8c8de1] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,.5)]">
                            <Heart size={48} className="text-white fill-current shadow-lg" />
                        </div>
                    ) : (
                        playlist.image ? (
                            <img src={playlist.image} className="w-28 h-28 object-cover shadow-[0_8px_24px_rgba(0,0,0,.5)]" />
                        ) : (
                            <div className="w-28 h-28 bg-[#282828] flex items-center justify-center flex-shrink-0 shadow-[0_8px_24px_rgba(0,0,0,.5)] text-spotify-grey font-bold text-4xl">
                                {playlist.name.charAt(0)}
                            </div>
                        )
                    )}
                    <div className="flex flex-col justify-end pb-1 overflow-hidden">
                        <span className="text-xs uppercase text-white font-bold tracking-widest mb-1.5 opacity-80">Playlist</span>
                        <h1 className="text-white text-3xl font-bold leading-tight truncate">{playlist.name}</h1>
                        <p className="text-white/70 text-sm mt-1 truncate">
                            {isLiked ? 'Spotiflow • ' + tracks.length + ' songs' : `${typeof playlist.owner === 'object' ? playlist.owner?.display_name : playlist.owner || 'You'} • ${playlist.trackCount || 0} songs`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="px-4 py-4 flex items-center gap-6">
                <button
                    onClick={() => { if (tracks.length) playTrack(tracks[0]); }}
                    className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_12px_rgba(0,0,0,.5)]"
                >
                    <Play size={28} className="fill-current ml-1" />
                </button>
                <button className="text-spotify-grey hover:text-white active:scale-95 transition-transform">
                    <MoreHorizontal size={32} />
                </button>
            </div>

            {/* Track List */}
            <div className="px-4 flex flex-col pb-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-spotify-green/20 border-t-spotify-green rounded-full animate-spin" />
                    </div>
                ) : (
                    tracks.map((track, i) => (
                        <div key={track.id || i} onClick={() => playTrack(track)} className="flex items-center gap-3 cursor-pointer group active:bg-[#2a2a2a] p-2 -mx-2 rounded transition-colors">
                            <div className="w-4 flex justify-end">
                                <span className="text-spotify-grey font-medium text-sm w-4 text-right">{i + 1}</span>
                            </div>
                            {track.image ? (
                                <img src={track.image} className="w-12 h-12 object-cover" />
                            ) : (
                                <div className="w-12 h-12 bg-[#282828] flex items-center justify-center">
                                    <span className="text-[10px] text-spotify-grey font-bold">RAW</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0 pr-2">
                                <h4 className={`text-base font-normal truncate ${currentTrack?.id === track.id ? 'text-spotify-green' : 'text-white'}`}>{track.name}</h4>
                                <p className="text-spotify-grey text-[13px] truncate flex items-center gap-1 mt-0.5">
                                    {track.artist}
                                </p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setMenuTrack(track); }} className="text-spotify-grey hover:text-white transition-colors focus:outline-none p-1">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    ))
                )}
                {!loading && tracks.length === 0 && (
                    <div className="text-spotify-grey text-sm text-center py-10">This playlist is empty.</div>
                )}
            </div>

            <TrackContextMenu track={menuTrack} onClose={() => setMenuTrack(null)} />
        </div>
    );
}
