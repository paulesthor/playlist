import React, { useState, useEffect } from 'react';
import { X, PlusCircle, User, Disc, Share2, Check } from 'lucide-react';
import { fetchUserPlaylistsFiltered, getCurrentUser, addTrackToPlaylist, removeSavedTrack, saveTrack, checkSavedTrack } from '../lib/spotify';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrackContextMenu({ track, onClose }) {
    const [view, setView] = useState('menu'); // 'menu' | 'playlists'
    const [playlists, setPlaylists] = useState([]);
    const [loadingLists, setLoadingLists] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (track) {
            setView('menu');
            checkSavedTrack(track.id).then(setIsSaved);
        }
    }, [track]);

    const handleAddClick = async () => {
        setView('playlists');
        setLoadingLists(true);
        const user = await getCurrentUser();
        if (user) {
            const lists = await fetchUserPlaylistsFiltered(user.id);
            setPlaylists(lists);
        }
        setLoadingLists(false);
    };

    const handleAddToPlaylist = async (playlistId) => {
        try {
            await addTrackToPlaylist(playlistId, track.uri);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'ajout du titre.");
        }
    };

    const toggleSave = async () => {
        const nextState = !isSaved;
        setIsSaved(nextState);
        if (nextState) {
            await saveTrack(track.id);
        } else {
            await removeSavedTrack(track.id);
        }
    };

    return (
        <AnimatePresence>
            {track && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/80 flex flex-col justify-end"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="bg-[#282828] rounded-t-xl rounded-b-none w-full p-4 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto pb-8"
                        onClick={e => e.stopPropagation()}
                    >
                        {view === 'menu' ? (
                            <>
                                <div className="flex items-center gap-3 border-b border-[#3e3e3e] pb-4">
                                    <img src={track.image || track.album?.images?.[0]?.url || ''} className="w-12 h-12 object-cover rounded" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold truncate">{track.name}</h3>
                                        <p className="text-spotify-grey text-sm truncate">{track.artist}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <button onClick={toggleSave} className="flex items-center gap-4 text-white p-3 hover:bg-[#3e3e3e] rounded active:bg-[#4e4e4e] transition-colors text-left">
                                        {isSaved ? <Check size={24} className="text-spotify-green" /> : <PlusCircle size={24} className="text-spotify-grey" />}
                                        <span className="font-semibold text-[15px]">{isSaved ? "Remove from Liked Songs" : "Like"}</span>
                                    </button>
                                    <button onClick={handleAddClick} className="flex items-center gap-4 text-white p-3 hover:bg-[#3e3e3e] rounded active:bg-[#4e4e4e] transition-colors text-left">
                                        <PlusCircle size={24} className="text-spotify-grey" />
                                        <span className="font-semibold text-[15px]">Add to playlist</span>
                                    </button>
                                    <button className="flex items-center gap-4 text-white p-3 hover:bg-[#3e3e3e] rounded active:bg-[#4e4e4e] transition-colors text-left opacity-50">
                                        <User size={24} className="text-spotify-grey" />
                                        <span className="font-semibold text-[15px]">View Artist</span>
                                    </button>
                                    <button className="flex items-center gap-4 text-white p-3 hover:bg-[#3e3e3e] rounded active:bg-[#4e4e4e] transition-colors text-left opacity-50">
                                        <Disc size={24} className="text-spotify-grey" />
                                        <span className="font-semibold text-[15px]">View Album</span>
                                    </button>
                                    <button className="flex items-center gap-4 text-white p-3 hover:bg-[#3e3e3e] rounded active:bg-[#4e4e4e] transition-colors text-left opacity-50">
                                        <Share2 size={24} className="text-spotify-grey" />
                                        <span className="font-semibold text-[15px]">Share</span>
                                    </button>
                                </div>

                                <button onClick={onClose} className="mt-2 text-center text-white py-3 font-bold active:text-spotify-grey">
                                    Close
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between pb-4 border-b border-[#3e3e3e] mb-2">
                                    <h3 className="text-white font-bold text-lg">Add to Playlist</h3>
                                    <button onClick={() => setView('menu')} className="text-spotify-grey p-1"><X size={24} /></button>
                                </div>
                                {loadingLists ? (
                                    <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-spotify-green/20 border-t-spotify-green rounded-full animate-spin" /></div>
                                ) : (
                                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                                        {playlists.map(pl => (
                                            <div key={pl.id} onClick={() => handleAddToPlaylist(pl.id)} className="flex items-center gap-3 p-2 hover:bg-[#3e3e3e] rounded cursor-pointer active:bg-[#4e4e4e]">
                                                {pl.image ? <img src={pl.image} className="w-12 h-12 object-cover rounded shadow" /> : <div className="w-12 h-12 bg-[#333] flex items-center justify-center text-spotify-grey rounded font-bold shadow">{pl.name.charAt(0)}</div>}
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-white font-semibold truncate">{pl.name}</span>
                                                    <span className="text-spotify-grey text-xs truncate">by {pl.owner}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {playlists.length === 0 && <p className="text-spotify-grey text-sm text-center py-4">No modifiable playlists found.</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
