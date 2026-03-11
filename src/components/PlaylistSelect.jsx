import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUserPlaylists, createPlaylist } from '../lib/spotify';
import { setTargetPlaylist } from '../lib/storage';

export default function PlaylistSelect({ user, onSelect, onLogout }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchUserPlaylists(user.id)
            .then(setPlaylists)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const filtered = useMemo(() => {
        if (!search) return playlists;
        const q = search.toLowerCase();
        return playlists.filter((p) => p.name.toLowerCase().includes(q));
    }, [playlists, search]);

    const handleSelect = (playlist) => {
        const target = { id: playlist.id, name: playlist.name, image: playlist.image };
        setTargetPlaylist(target);
        onSelect(target);
    };

    const handleCreate = async () => {
        if (!newName.trim() || !user) return;
        setCreating(true);
        try {
            const playlist = await createPlaylist(user.id, newName.trim());
            const target = { id: playlist.id, name: playlist.name, image: '' };
            setTargetPlaylist(target);
            onSelect(target);
        } catch (err) {
            console.error('Create playlist error:', err);
        }
        setCreating(false);
    };

    return (
        <div className="flex flex-col h-full bg-spotify-black">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Choose a playlist</h1>
                    <p className="text-spotify-grey text-sm mt-1">Where should we add your songs?</p>
                </div>
                <button
                    onClick={onLogout}
                    className="text-spotify-grey hover:text-white text-sm transition-colors"
                >
                    Logout
                </button>
            </div>

            {/* Search */}
            <div className="px-5 mb-4">
                <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-spotify-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search your playlists..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-spotify-card text-white placeholder-spotify-dim py-3 pl-10 pr-4 rounded-lg outline-none focus:ring-2 focus:ring-spotify-green/50 text-sm transition-all"
                    />
                </div>
            </div>

            {/* Create New */}
            <div className="px-5 mb-3">
                <AnimatePresence>
                    {showCreate ? (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="New playlist name..."
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                    autoFocus
                                    className="flex-1 bg-spotify-card text-white placeholder-spotify-dim py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-spotify-green/50 text-sm"
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !newName.trim()}
                                    className="px-5 py-3 bg-spotify-green text-black font-bold rounded-lg text-sm disabled:opacity-40 active:scale-95 transition-transform"
                                >
                                    {creating ? '...' : 'Create'}
                                </button>
                            </div>
                            <button
                                onClick={() => { setShowCreate(false); setNewName(''); }}
                                className="text-spotify-grey text-xs hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    ) : (
                        <motion.button
                            onClick={() => setShowCreate(true)}
                            className="w-full flex items-center gap-3 p-4 bg-spotify-card/60 hover:bg-spotify-card rounded-xl transition-colors active:scale-[0.98]"
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="w-12 h-12 bg-spotify-green/15 rounded-lg flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-spotify-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className="text-white font-semibold text-sm">Create new playlist</p>
                                <p className="text-spotify-dim text-xs">Start fresh</p>
                            </div>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Playlist list */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-spotify-green/20 border-t-spotify-green rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {filtered.map((playlist, i) => (
                            <motion.button
                                key={playlist.id}
                                onClick={() => handleSelect(playlist)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-spotify-card/60 rounded-xl transition-colors active:scale-[0.98] text-left"
                            >
                                <div className="w-12 h-12 bg-spotify-card rounded-lg overflow-hidden shrink-0">
                                    {playlist.image ? (
                                        <img src={playlist.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-spotify-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white font-medium text-sm truncate">{playlist.name}</p>
                                    <p className="text-spotify-dim text-xs">{playlist.trackCount} songs</p>
                                </div>
                                <svg className="w-4 h-4 text-spotify-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </motion.button>
                        ))}
                    </div>
                )}

                {!loading && filtered.length === 0 && (
                    <p className="text-center text-spotify-dim py-8 text-sm">
                        {search ? 'No playlists match your search' : 'No playlists found'}
                    </p>
                )}
            </div>
        </div>
    );
}
