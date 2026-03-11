import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, Zap, RefreshCw, PlayCircle, MoreHorizontal, SlidersHorizontal, Music, Save, Loader2, Plus, X } from 'lucide-react';
import { getAllLibraryFeatures } from '../lib/db';
import { queueTrack, getRecommendations, createPlaylist, addTrackToPlaylist, getCurrentUser } from '../lib/spotify';
import { usePlayer } from '../context/PlayerContext';
import TrackContextMenu from './TrackContextMenu';

export default function AIHubTab() {
    const [view, setView] = useState('menu'); // 'menu' | 'forgotten' | 'chat' | 'presets' | 'recommendations' | 'results'
    const [libraryData, setLibraryData] = useState([]);
    const [gems, setGems] = useState([]);
    const [menuTrack, setMenuTrack] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'ai', text: 'Hey there! I am your Spotiflow AI. Tell me what mood or genre you want, and I will create a queue for you.' }
    ]);

    // Recommendations State
    const [seedTrack, setSeedTrack] = useState(null);
    const [audioFeatures, setAudioFeatures] = useState({
        energy: 50,
        valence: 50,
        acousticness: 50,
        danceability: 50
    });
    const [results, setResults] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { playTrack, currentTrack } = usePlayer();

    useEffect(() => {
        getAllLibraryFeatures().then(data => {
            if (data) setLibraryData(data);
        });
    }, []);

    const generateForgottenGems = () => {
        if (!libraryData.length) {
            alert('Please sync your library in the Insights tab first!');
            return;
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const oldTracks = libraryData.filter(item => {
            if (!item.added_at) return false;
            return new Date(item.added_at) < sixMonthsAgo;
        });

        const potentialGems = oldTracks.filter(item => {
            if (!item.features) return true;
            return item.features.energy > 0.6 || item.features.valence > 0.5;
        });

        const shuffled = potentialGems.sort(() => 0.5 - Math.random());
        setGems(shuffled.slice(0, 5));
        setView('forgotten');
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newHistory = [...chatHistory, { role: 'user', text: chatInput }];
        setChatHistory(newHistory);
        setChatInput('');

        setTimeout(() => {
            setChatHistory(prev => [
                ...prev,
                { role: 'ai', text: `I've analyzed your prompt and I'm searching your library for tracks that match that vibe... (Note: AI generation is currently mocked!)` }
            ]);
        }, 1000);
    };

    const handlePreset = async (preset) => {
        if (!libraryData.length) {
            alert('Please sync your library in the Insights tab first!');
            return;
        }

        let filtered = [];
        if (preset === 'Focus') {
            filtered = libraryData.filter(i => i.features && i.features.acousticness > 0.6 && i.features.energy < 0.5);
        } else if (preset === 'Party') {
            filtered = libraryData.filter(i => i.features && i.features.danceability > 0.7 && i.features.energy > 0.7);
        } else if (preset === 'Melancholy') {
            filtered = libraryData.filter(i => i.features && i.features.valence < 0.3);
        }

        if (filtered.length === 0) {
            alert(`You don't have enough tracks synced to generate a ${preset} queue!`);
            return;
        }

        const toQueue = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);
        try {
            for (const track of toQueue) {
                await queueTrack(track.track.uri);
            }
            alert(`Queued ${toQueue.length} tracks for ${preset}!`);
        } catch (err) {
            console.error('Queue failed', err);
            alert('Failed to queue tracks. Ensure Spotify is active.');
        }
    };

    // --- Recommendations Logic ---
    const MOCK_MOOD_TAGS = [
        { label: 'Piano Melancholy', features: { energy: 10, valence: 10, acousticness: 90, danceability: 20 } },
        { label: 'High Energy Focus', features: { energy: 80, valence: 60, acousticness: 10, danceability: 50 } },
        { label: 'Chill Vibes', features: { energy: 30, valence: 50, acousticness: 60, danceability: 40 } },
        { label: 'Party Starter', features: { energy: 90, valence: 80, acousticness: 5, danceability: 90 } },
    ];

    const applyMoodTag = (tag) => {
        setAudioFeatures(tag.features);
    };

    const handleFeatureChange = (feature, value) => {
        setAudioFeatures(prev => ({ ...prev, [feature]: parseInt(value) }));
    };

    const useCurrentTrackAsSeed = () => {
        if (currentTrack) {
            setSeedTrack(currentTrack);
        } else {
            alert("No track is currently playing!");
        }
    };

    const generateRecommendations = async () => {
        setIsGenerating(true);
        try {
            // Convert 0-100 scale back to 0.0-1.0 for the API
            const apiFeatures = {
                target_energy: audioFeatures.energy / 100,
                target_valence: audioFeatures.valence / 100,
                target_acousticness: audioFeatures.acousticness / 100,
                target_danceability: audioFeatures.danceability / 100,
            };

            const seedTracks = seedTrack ? [seedTrack.id] : undefined;

            const tracks = await getRecommendations(undefined, seedTracks, apiFeatures);
            setResults(tracks);
            setView('results');
        } catch (error) {
            console.error(error);
            alert("Failed to generate recommendations.");
        }
        setIsGenerating(false);
    };

    const handleSavePlaylist = async () => {
        if (!results.length) return;
        setIsSaving(true);
        try {
            const user = await getCurrentUser();
            if (!user) {
                alert("Could not load user profile.");
                return;
            }
            const playlistName = `AI Mix: ${seedTrack ? seedTrack.name : 'Vibes'}`;
            const newPl = await createPlaylist(user.id, playlistName);

            // Add tracks in chunks if a lot, but usually recommendations return 20 limit.
            for (const track of results) {
                await addTrackToPlaylist(newPl.id, track.uri);
            }
            alert(`Saved as "${playlistName}" to Your Library!`);
        } catch (error) {
            console.error(error);
            alert("Failed to save playlist.");
        }
        setIsSaving(false);
    };

    // --- Render Views ---

    if (view === 'forgotten') {
        return (
            <div className="flex flex-col h-full bg-spotify-black p-6">
                <button onClick={() => setView('menu')} className="text-spotify-grey mb-6 text-sm hover:text-white">← Back to Hub</button>
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <RefreshCw className="text-spotify-green" /> Forgotten Gems
                </h1>
                <p className="text-spotify-grey mb-6 text-sm">Tracks you liked over 6 months ago that fit a positive vibe.</p>

                <div className="space-y-3">
                    {gems.map(gem => (
                        <div key={gem.id} className="flex items-center p-3 bg-[#181818] rounded-lg border border-[#282828]">
                            <img src={gem.track.imageMed || gem.track.image} className="w-12 h-12 rounded mr-4 object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate">{gem.track.name}</h3>
                                <p className="text-spotify-grey text-xs truncate">{gem.track.artist}</p>
                            </div>
                            <button
                                onClick={() => playTrack(gem.track)}
                                className="w-10 h-10 rounded-full bg-spotify-green flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                <PlayCircle size={20} className="text-black fill-black" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuTrack(gem.track); }}
                                className="ml-3 text-spotify-grey hover:text-white active:scale-95 transition-transform p-2"
                            >
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'chat') {
        return (
            <div className="flex flex-col h-full bg-spotify-black relative pb-safe">
                <div className="p-4 border-b border-[#282828] bg-[#121212] flex items-center gap-4">
                    <button onClick={() => setView('menu')} className="text-spotify-grey hover:text-white">←</button>
                    <h1 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageCircle size={18} className="text-spotify-green" /> AI DJ
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#2a2a2a] text-white rounded-br-none' : 'bg-spotify-green/10 text-spotify-green border border-spotify-green/20 rounded-bl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-[#181818]">
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="e.g., Suggest 5 songs for a rainy Sunday..."
                            className="flex-1 bg-[#282828] text-white rounded-full px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-spotify-green"
                        />
                        <button type="submit" className="w-12 h-12 rounded-full bg-spotify-green flex items-center justify-center flex-shrink-0">
                            <Sparkles size={20} className="text-black" />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (view === 'recommendations') {
        return (
            <div className="flex flex-col h-full bg-spotify-black p-6 overflow-y-auto pb-[100px]">
                <button onClick={() => setView('menu')} className="text-spotify-grey mb-4 text-sm hover:text-white">← Back</button>
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <SlidersHorizontal className="text-spotify-green" /> Super Recommendations
                </h1>

                {/* --- Seed Selection --- */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-3">1. Base Track Context</h2>
                    {!seedTrack ? (
                        <button
                            onClick={useCurrentTrackAsSeed}
                            className="w-full flex items-center gap-3 p-4 bg-[#181818] rounded-xl border border-[#282828] hover:border-spotify-green transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                <Music className="text-white" size={20} />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-white font-medium">Use currently playing track</h3>
                                <p className="text-spotify-grey text-xs">Tune recommendations based on what you are listening to right now.</p>
                            </div>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-spotify-green/10 rounded-xl border border-spotify-green/50">
                            <img src={seedTrack.imageMed || seedTrack.image} className="w-12 h-12 rounded-md object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="text-spotify-green text-xs font-bold uppercase tracking-wider mb-1">Seed Track</p>
                                <h3 className="text-white font-medium truncate">{seedTrack.name}</h3>
                                <p className="text-spotify-grey text-xs truncate">{seedTrack.artist}</p>
                            </div>
                            <button onClick={() => setSeedTrack(null)} className="p-2 text-spotify-grey hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* --- Mood Tags --- */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-white mb-3">2. Quick Moods</h2>
                    <div className="flex flex-wrap gap-2">
                        {MOCK_MOOD_TAGS.map(tag => (
                            <button
                                key={tag.label}
                                onClick={() => applyMoodTag(tag)}
                                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium rounded-full transition-colors border border-transparent hover:border-[#666]"
                            >
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Sliders --- */}
                <div className="mb-8 space-y-5 bg-[#181818] p-5 rounded-xl border border-[#282828]">
                    <h2 className="text-lg font-bold text-white mb-2">3. Fine-Tune Attributes</h2>

                    {Object.keys(audioFeatures).map(feature => (
                        <div key={feature}>
                            <div className="flex justify-between text-xs text-spotify-grey mb-2 uppercase tracking-wide font-bold">
                                <span>{feature}</span>
                                <span className="text-white">{audioFeatures[feature]}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={audioFeatures[feature]}
                                onChange={(e) => handleFeatureChange(feature, e.target.value)}
                                className="w-full h-1 bg-[#404040] rounded-lg appearance-none cursor-pointer accent-spotify-green"
                            />
                        </div>
                    ))}
                </div>

                {/* --- Generate Button --- */}
                <button
                    onClick={generateRecommendations}
                    disabled={isGenerating}
                    className="w-full py-4 bg-spotify-green text-black font-bold rounded-full disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg shadow-lg shadow-spotify-green/20"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {isGenerating ? 'Generating...' : 'Generate Magic Playlist'}
                </button>

            </div>
        );
    }

    if (view === 'results') {
        return (
            <div className="flex flex-col h-full bg-spotify-black p-6 overflow-y-auto pb-[100px]">
                <button onClick={() => setView('recommendations')} className="text-spotify-grey mb-4 text-sm hover:text-white">← Edit Filters</button>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Your Mix</h1>
                    <button
                        onClick={handleSavePlaylist}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-transparent border border-spotify-grey text-white text-sm font-bold rounded-full hover:border-white disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save to Library
                    </button>
                </div>

                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => {
                            if (results.length > 0) playTrack(results[0]);
                            // Note: To play all, ideally we'd set the queue, but setting current track works for demo
                        }}
                        className="w-14 h-14 rounded-full bg-spotify-green flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-xl shadow-spotify-green/20"
                    >
                        <PlayCircle size={28} className="text-black fill-black" />
                    </button>
                    <div className="flex flex-col justify-center">
                        <p className="text-white font-bold">{results.length} Tracks Selected</p>
                        <p className="text-spotify-grey text-sm">Based on your mood DNA</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {results.map(track => (
                        <div key={track.id} className="flex items-center p-2 hover:bg-[#282828] rounded-lg group transition-colors">
                            <img src={track.imageMed || track.image} className="w-12 h-12 rounded mr-4 object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium truncate">{track.name}</h3>
                                <p className="text-spotify-grey text-xs truncate">{track.artist}</p>
                            </div>
                            <button
                                onClick={() => playTrack(track)}
                                className="w-10 h-10 rounded-full bg-spotify-green/0 group-hover:bg-spotify-green/10 flex items-center justify-center transition-colors mr-2"
                            >
                                <PlayCircle size={20} className="text-spotify-green opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuTrack(track); }}
                                className="text-spotify-grey hover:text-white p-2"
                            >
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    ))}
                    {results.length === 0 && (
                        <div className="text-center text-spotify-grey pt-10">
                            No tracks found for these precise attributes. Try loosening the sliders!
                        </div>
                    )}
                </div>
                <TrackContextMenu track={menuTrack} onClose={() => setMenuTrack(null)} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-spotify-black p-6 overflow-y-auto pb-[100px]">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="text-spotify-green" size={28} /> AI Hub
            </h1>
            <p className="text-spotify-grey mb-8">Let the algorithm find your next obsession based on your library DNA.</p>

            <div className="grid gap-4">
                {/* NEW TILE: Super Recommendations */}
                <button
                    onClick={() => setView('recommendations')}
                    className="flex flex-col items-start p-5 bg-gradient-to-br from-[#1b2b1f] to-[#121212] rounded-xl border border-spotify-green/30 hover:border-spotify-green shadow-lg shadow-spotify-green/5 transition-all text-left group"
                >
                    <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2 text-white font-bold text-xl">
                            <SlidersHorizontal size={22} className="text-spotify-green" /> DNA Mixes
                        </div>
                        <div className="w-8 h-8 rounded-full bg-spotify-green/20 group-hover:bg-spotify-green flex items-center justify-center transition-colors">
                            <Plus size={18} className="text-spotify-green group-hover:text-black" />
                        </div>
                    </div>
                    <p className="text-spotify-grey text-sm pr-4">Create the perfect playlist by deeply tuning Spotify's hidden audio features like Acousticness, Energy, and Valence.</p>
                </button>

                <button
                    onClick={generateForgottenGems}
                    className="flex flex-col items-start p-5 bg-[#181818] rounded-xl border border-[#282828] hover:border-[#404040] transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
                        <RefreshCw size={18} className="text-spotify-grey" /> Forgotten Gems
                    </div>
                    <p className="text-spotify-grey text-sm">Resurface tracks you liked over 6 months ago that haven't been played recently.</p>
                </button>

                <button
                    onClick={() => setView('chat')}
                    className="flex flex-col items-start p-5 bg-[#181818] rounded-xl border border-[#282828] hover:border-[#404040] transition-colors text-left"
                >
                    <div className="flex items-center gap-2 text-white font-bold text-lg mb-1">
                        <MessageCircle size={18} /> Conversational DJ
                    </div>
                    <p className="text-spotify-grey text-sm">Ask the AI to generate hyper-specific queues using natural language.</p>
                </button>

                <div className="p-5 bg-[#181818] rounded-xl border border-[#282828]">
                    <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                        <Zap size={18} /> Mood Presets
                    </div>
                    <p className="text-spotify-grey text-sm mb-4">Instantly generate a 5-track queue crafted from your synced library.</p>
                    <div className="flex gap-2 flex-wrap">
                        {['Focus', 'Party', 'Melancholy'].map(mood => (
                            <button
                                key={mood}
                                onClick={() => handlePreset(mood)}
                                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm font-medium rounded-full transition-colors"
                            >
                                {mood}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <TrackContextMenu track={menuTrack} onClose={() => setMenuTrack(null)} />
        </div>
    );
}
