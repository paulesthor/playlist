import React, { useState, useEffect } from 'react';
import { RefreshCcw, Activity } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { fetchAllLikedSongs, fetchAudioFeatures } from '../lib/spotify';
import { saveLibraryFeatures, getAllLibraryFeatures } from '../lib/db';

export default function InsightsTab() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState({ loaded: 0, total: 0 });
    const [syncStatus, setSyncStatus] = useState('');
    const [libraryData, setLibraryData] = useState([]);

    // Calculated Insights
    const [averages, setAverages] = useState(null);

    useEffect(() => {
        // Load existing data from DB on mount
        loadFromDB();
    }, []);

    const loadFromDB = async () => {
        try {
            const data = await getAllLibraryFeatures();
            if (data && data.length > 0) {
                setLibraryData(data);
                calculateInsights(data);
            }
        } catch (err) {
            console.error('Failed to load DB', err);
        }
    };

    const calculateInsights = (data) => {
        if (!data.length) return;
        let v = 0, e = 0, d = 0, a = 0;
        let count = 0;
        data.forEach(item => {
            if (item.features) {
                v += item.features.valence || 0;
                e += item.features.energy || 0;
                d += item.features.danceability || 0;
                a += item.features.acousticness || 0;
                count++;
            }
        });

        if (count > 0) {
            setAverages([
                { subject: 'Positivity (Valence)', A: Math.round((v / count) * 100), fullMark: 100 },
                { subject: 'Energy', A: Math.round((e / count) * 100), fullMark: 100 },
                { subject: 'Danceability', A: Math.round((d / count) * 100), fullMark: 100 },
                { subject: 'Acousticness', A: Math.round((a / count) * 100), fullMark: 100 },
            ]);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncStatus('Fetching target library size...');
        try {
            // 1. Fetch All Tracks
            const allTracks = await fetchAllLikedSongs((loaded, total) => {
                setProgress({ loaded, total });
                setSyncStatus(`Downloading tracks... (${loaded}/${total})`);
            });

            // 2. Fetch Audio Features in chunks of 100
            setSyncStatus('Analyzing audio features...');
            const fullData = [];
            const chunkSize = 100;

            for (let i = 0; i < allTracks.length; i += chunkSize) {
                const chunk = allTracks.slice(i, i + chunkSize);
                const ids = chunk.map(t => t.id).filter(id => id); // Ensure valid IDs

                if (ids.length > 0) {
                    const features = await fetchAudioFeatures(ids);

                    // Merge track + feature
                    for (let j = 0; j < chunk.length; j++) {
                        if (chunk[j].id) {
                            fullData.push({
                                id: chunk[j].id,
                                track: chunk[j],
                                features: features[j] || null,
                                added_at: chunk[j].added_at // Preserve for timeline analysis
                            });
                        }
                    }
                }
                setSyncStatus(`Analyzing audio features... (${Math.min(i + chunkSize, allTracks.length)}/${allTracks.length})`);
                // Sleep specifically to respect rate limits during this heavy bulk operation
                await new Promise(r => setTimeout(r, 200));
            }

            // 3. Save to IDB
            setSyncStatus('Saving to local database...');
            await saveLibraryFeatures(fullData);

            // 4. Update UI
            setLibraryData(fullData);
            calculateInsights(fullData);
            setSyncStatus('Sync complete!');

        } catch (err) {
            console.error('Sync failed', err);
            setSyncStatus(`Error: ${err.message}`);
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncStatus(''), 3000); // Clear success message after 3s
        }
    };

    return (
        <div className="flex flex-col h-full bg-spotify-black p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Activity className="text-spotify-green" /> Analytics
                </h1>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 bg-[#2a2a2a] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                >
                    <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? 'Syncing...' : 'Sync Data'}
                </button>
            </div>

            {syncStatus && (
                <div className="bg-spotify-green/20 text-spotify-green text-xs font-mono p-3 rounded-lg mb-6 border border-spotify-green/30">
                    {syncStatus}
                </div>
            )}

            {!averages && !isSyncing && Object.keys(libraryData).length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-spotify-grey text-center">
                    <BarChart2 size={48} className="mb-4 opacity-50" />
                    <p className="max-w-[250px]">Sync your library data to unlock mood insights and audio analysis.</p>
                </div>
            )}

            {averages && (
                <div className="flex flex-col gap-6 pb-20">
                    <div className="bg-[#181818] rounded-xl p-4 shadow-xl border border-[#282828]">
                        <h2 className="text-white font-bold opacity-90 mb-2">Sonic Fingerprint</h2>
                        <div className="h-[280px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={averages}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#b3b3b3', fontSize: 11 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="You" dataKey="A" stroke="#1DB954" fill="#1DB954" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1b2b1f] to-[#121212] rounded-xl p-6 shadow-xl border border-spotify-green/20">
                        <h2 className="text-white font-bold text-xl mb-3">Library Breakdown</h2>

                        <div className="space-y-4">
                            {averages.map((avg) => (
                                <div key={avg.subject}>
                                    <div className="flex justify-between text-xs text-white mb-1">
                                        <span className="opacity-70">{avg.subject}</span>
                                        <span className="font-mono">{avg.A}%</span>
                                    </div>
                                    <div className="h-2 bg-[#282828] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-spotify-green rounded-full"
                                            style={{ width: `${avg.A}%` }}
                                        />
                                    </div>
                                    {avg.subject === 'Energy' && avg.A > 70 && (
                                        <p className="text-[10px] text-spotify-grey mt-1">Your library is highly energetic!</p>
                                    )}
                                    {avg.subject === 'Positivity (Valence)' && avg.A < 40 && (
                                        <p className="text-[10px] text-spotify-grey mt-1">You lean towards more emotional, melancholic tracks.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-xs text-spotify-grey font-mono mt-4">
                        Analyzing {libraryData.length} saved tracks directly from device storage.
                    </div>
                </div>
            )}
        </div>
    );
}

// Ensure BarChart2 is available for default empty state
import { BarChart2 } from 'lucide-react';
