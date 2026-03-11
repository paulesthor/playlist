import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Play, Plus, Heart, Loader2, Camera, MoreHorizontal } from 'lucide-react';
import { searchTracks, addTrackToPlaylist, saveTrack, removeSavedTrack, checkSavedTrack } from '../lib/spotify';
import { usePlayer } from '../context/PlayerContext';
import TrackContextMenu from './TrackContextMenu';

const MOCK_CATEGORIES = [
    { id: 1, name: "Podcasts", color: "bg-[#E13300]" },
    { id: 2, name: "Live Events", color: "bg-[#7358FF]" },
    { id: 3, name: "Made For You", color: "bg-[#1E3264]" },
    { id: 4, name: "New Releases", color: "bg-[#E8115B]" },
    { id: 5, name: "Pop", color: "bg-[#148A08]" },
    { id: 6, name: "Hip-Hop", color: "bg-[#BC5900]" },
    { id: 7, name: "Rock", color: "bg-[#E91429]" },
    { id: 8, name: "Latin", color: "bg-[#D84000]" },
    { id: 9, name: "Mood", color: "bg-[#8D67AB]" },
    { id: 10, name: "Indie", color: "bg-[#E1118C]" },
    { id: 11, name: "Workout", color: "bg-[#777777]" },
    { id: 12, name: "R&B", color: "bg-[#DC148C]" },
];

export default function SearchTab({ targetPlaylist }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionState, setActionState] = useState({ id: null, loading: false });
    const [likedStates, setLikedStates] = useState({});
    const [isSticky, setIsSticky] = useState(false);
    const [menuTrack, setMenuTrack] = useState(null);

    const { playTrack } = usePlayer();
    const scrollRef = useRef(null);

    // Handle scroll to make search bar sticky
    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                setIsSticky(scrollRef.current.scrollTop > 50);
            }
        };
        const el = scrollRef.current;
        if (el) el.addEventListener('scroll', handleScroll);
        return () => { if (el) el.removeEventListener('scroll', handleScroll); };
    }, []);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 1) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const performSearch = async (q) => {
        setLoading(true);
        try {
            const tracks = await searchTracks(q, 20);
            setResults(tracks);

            const likesStatus = {};
            await Promise.all(tracks.map(async (t) => {
                const isSaved = await checkSavedTrack(t.id);
                likesStatus[t.id] = isSaved;
            }));
            setLikedStates(likesStatus);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrack = async (track, e) => {
        e.stopPropagation();
        if (!targetPlaylist) {
            alert('Please select a Target Playlist in the Swipe Tab first!');
            return;
        }

        setActionState({ id: track.id, loading: true });
        try {
            await addTrackToPlaylist(targetPlaylist.id, track.uri);
            alert(`Added to ${targetPlaylist.name}`);
        } catch (err) {
            console.error(err);
            alert('Failed to add track.');
        } finally {
            setActionState({ id: null, loading: false });
        }
    };

    const handleToggleLike = async (track, e) => {
        e.stopPropagation();
        const currentlyLiked = likedStates[track.id];
        setLikedStates(prev => ({ ...prev, [track.id]: !currentlyLiked }));
        try {
            if (currentlyLiked) await removeSavedTrack(track.id);
            else await saveTrack(track.id);
        } catch (err) {
            console.error('Like toggle failed:', err);
            setLikedStates(prev => ({ ...prev, [track.id]: currentlyLiked }));
        }
    };

    return (
        <div ref={scrollRef} className="flex flex-col h-full bg-spotify-black overflow-y-auto relative">

            {/* Header Content */}
            <div className={`px-4 pt-12 pb-4 transition-all duration-200 ${isSticky ? 'bg-[#121212] sticky top-0 z-20 shadow-lg pb-4' : 'bg-transparent'}`}>
                {!isSticky && (
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                E
                            </div>
                            <h1 className="text-2xl font-bold text-white">Search</h1>
                        </div>
                        <Camera size={24} className="text-white stroke-[2]" />
                    </div>
                )}

                {/* The Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon size={22} className="text-[#121212] stroke-[2.5]" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 rounded bg-white text-black font-semibold text-[15px] placeholder-[#555] focus:outline-none"
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="px-4 pb-[80px]">
                {/* Empty State: Browse All Grid */}
                {!loading && query.length < 2 && (
                    <div className="mt-2">
                        <h3 className="text-white font-bold text-[16px] mb-4">Browse All</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {MOCK_CATEGORIES.map(cat => (
                                <div
                                    key={cat.id}
                                    className={`relative ${cat.color} rounded flex flex-col pt-3 pl-3 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-md border-none`}
                                    style={{ aspectRatio: '16/9' }}
                                >
                                    <span className="text-white font-bold text-[15px] z-10 leading-tight pr-4">
                                        {cat.name}
                                    </span>
                                    {/* Mock tilted image representing Spotify's category art */}
                                    <div className="absolute -bottom-2 -right-4 w-16 h-16 bg-black/20 rounded shadow-xl rotate-[25deg]" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center mt-12">
                        <Loader2 className="animate-spin text-spotify-green" size={32} />
                    </div>
                )}

                {/* Active Search Results */}
                {!loading && query.length >= 2 && results.length > 0 && (
                    <div className="space-y-3 mt-2">
                        {results.map((track) => (
                            <div
                                key={track.id}
                                onClick={() => playTrack(track)}
                                className="flex items-center gap-3 py-1 -mx-2 px-2 hover:bg-[#282828] active:bg-[#333] rounded transition-colors cursor-pointer group"
                            >
                                <img
                                    src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url}
                                    alt={track.name}
                                    className="w-[50px] h-[50px] object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                                    <h4 className="text-white font-normal text-[15px] truncate leading-tight">{track.name}</h4>
                                    <p className="text-[#B3B3B3] text-[13px] truncate mt-0.5">
                                        Song • {track.artists?.map(a => a.name).join(', ')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={(e) => handleToggleLike(track, e)}
                                        className="p-1 active:scale-95 transition-transform"
                                    >
                                        <Heart
                                            size={22}
                                            className={`${likedStates[track.id] ? 'text-[#1DB954] fill-[#1DB954]' : 'text-spotify-grey hover:text-white'}`}
                                        />
                                    </button>

                                    <button
                                        onClick={(e) => handleAddTrack(track, e)}
                                        disabled={actionState.loading && actionState.id === track.id}
                                        className="p-1 text-spotify-grey hover:text-white rounded-full transition-colors active:scale-95"
                                    >
                                        {(actionState.loading && actionState.id === track.id) ? (
                                            <Loader2 size={24} className="animate-spin text-[#1DB954]" />
                                        ) : (
                                            <Plus size={26} className="stroke-[1.5]" />
                                        )}
                                    </button>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuTrack(track); }}
                                        className="p-1 text-spotify-grey hover:text-white active:scale-95 transition-transform"
                                    >
                                        <MoreHorizontal size={24} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Results */}
                {!loading && query && results.length === 0 && (
                    <div className="text-center text-spotify-grey mt-16 px-6">
                        <p className="font-bold text-white text-[16px]">No results found for "{query}"</p>
                        <p className="text-[14px] mt-2">Please make sure your words are spelled correctly or use less or different keywords.</p>
                    </div>
                )}
            </div>

            <TrackContextMenu track={menuTrack} onClose={() => setMenuTrack(null)} />
        </div>
    );
}
