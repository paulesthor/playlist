import React, { useState, useEffect } from 'react';
import { Search, Plus, Heart, ArrowDownCircle, MoreVertical } from 'lucide-react';
import { fetchUserPlaylists, fetchAllLikedSongs, createPlaylist, getCurrentUser } from '../lib/spotify';
import PlaylistDetail from './PlaylistDetail';
import { AnimatePresence, motion } from 'framer-motion';

export default function LibraryTab() {
    const [playlists, setPlaylists] = useState([]);
    const [likedSongsCount, setLikedSongsCount] = useState(0);
    const [filter, setFilter] = useState('');

    const [activePlaylist, setActivePlaylist] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        getCurrentUser().then(setUser).catch(console.error);
        fetchUserPlaylists().then(data => setPlaylists(data)).catch(console.error);

        fetchAllLikedSongs().then(data => {
            setLikedSongsCount(data.length);
        }).catch(console.error);
    }, []);

    const handleCreate = async () => {
        if (!newName.trim() || !user) return;
        setCreating(true);
        try {
            const newPl = await createPlaylist(user.id, newName.trim());
            setPlaylists([newPl, ...playlists]);
            setShowCreate(false);
            setNewName('');
        } catch (e) {
            console.error(e);
        }
        setCreating(false);
    };

    const filters = ['Playlists', 'Podcasts', 'Albums', 'Artists', 'Downloaded'];

    return (
        <div className="flex flex-col h-full bg-spotify-black overflow-hidden relative">
            <AnimatePresence>
                {activePlaylist && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-0 z-50 bg-spotify-black"
                    >
                        <PlaylistDetail playlist={activePlaylist} onClose={() => setActivePlaylist(null)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#282828] w-full max-w-sm rounded-xl p-6"
                        >
                            <h2 className="text-white text-xl font-bold mb-6 text-center">Give your playlist a name</h2>
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="My Playlist #1"
                                className="w-full bg-[#3e3e3e] text-white border border-transparent focus:border-spotify-green px-4 py-3 rounded outline-none font-bold text-center placeholder-[#a7a7a7]"
                            />
                            <div className="flex items-center gap-4 mt-8">
                                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 text-white font-bold rounded-full hover:scale-105 active:scale-95 transition-transform">
                                    Cancel
                                </button>
                                <button onClick={handleCreate} disabled={creating || !newName.trim()} className="flex-1 py-3 bg-spotify-green text-black font-bold rounded-full disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform">
                                    {creating ? '...' : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col h-full overflow-y-auto pb-24">
                {/* Spotify Official Header */}
                <div className="bg-spotify-black z-20 pt-12 pb-2 px-4 shadow-sm relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                E
                            </div>
                            <h1 className="text-2xl font-bold text-white">Your Library</h1>
                        </div>
                        <div className="flex items-center gap-4 text-white">
                            <button><Search size={24} className="stroke-[2.5]" /></button>
                            <button onClick={() => setShowCreate(true)}><Plus size={24} className="stroke-[2.5]" /></button>
                        </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(filter === f ? '' : f)}
                                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border whitespace-nowrap ${filter === f
                                    ? 'bg-[#1DB954] text-black border-[#1DB954]'
                                    : 'bg-transparent text-white border-[#727272] hover:border-white'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List Content */}
                <div className="px-4 py-2 flex flex-col gap-4">

                    {/* Liked Songs Pinned Item */}
                    <div onClick={() => setActivePlaylist({ id: 'liked', name: 'Liked Songs' })} className="flex items-center gap-4 active:bg-[#282828] hover:bg-[#282828] p-1 -mx-1 rounded transition-colors cursor-pointer">
                        <div className="w-16 h-16 rounded overflow-hidden relative flex-shrink-0 bg-gradient-to-br from-[#4b14d2] to-[#8c8de1] flex items-center justify-center">
                            <Heart size={28} className="text-white fill-current shadow-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white text-base font-normal truncate">Liked Songs</h4>
                            <div className="flex items-center gap-1.5 text-spotify-grey text-[13px] mt-0.5">
                                <ArrowDownCircle size={14} className="text-[#1DB954] fill-transparent stroke-2" />
                                <span>Playlist • {likedSongsCount} songs</span>
                            </div>
                        </div>
                    </div>

                    {/* Playlists */}
                    {playlists.map(p => (
                        <div key={p.id} onClick={() => setActivePlaylist(p)} className="flex items-center gap-4 active:bg-[#282828] hover:bg-[#282828] p-1 -mx-1 rounded transition-colors cursor-pointer group">
                            {p.image ? (
                                <img src={p.image} alt={p.name} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-16 h-16 rounded bg-[#282828] flex items-center justify-center flex-shrink-0">
                                    <span className="text-spotify-grey font-bold text-xl">{p.name.charAt(0)}</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0 pr-4">
                                <h4 className="text-white text-base font-normal truncate">{p.name}</h4>
                                <p className="text-spotify-grey text-[13px] mt-0.5 truncate">
                                    Playlist • {typeof p.owner === 'object' ? p.owner?.display_name : p.owner || 'You'}
                                </p>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
