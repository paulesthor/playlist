import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAccessToken } from '../lib/auth';
import { IS_MOCK_MODE, MOCK_TRACKS } from '../lib/mockData';
import { getCurrentUser, fetchAudioFeatures, getArtistGenres, getTrackDetails } from '../lib/spotify';
import { logListeningHistory } from '../lib/supabase';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSdkReady, setIsSdkReady] = useState(false);
    const [error, setError] = useState(null);
    const [isPremium, setIsPremium] = useState(true);
    const [audioElement] = useState(() => new Audio());
    const [loggedTracks, setLoggedTracks] = useState(new Set()); // Tracks that have been logged this session

    // Load Spotify SDK script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            setIsSdkReady(true);
        };

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Initialize Player instance when SDK is ready & authenticated
    useEffect(() => {
        let activePlayer = null;

        const initPlayer = async () => {
            if (IS_MOCK_MODE) {
                // Construct a Fake Player
                setDeviceId('mock_device');
                setIsPlaying(false);
                setCurrentTrack(null);
                activePlayer = {
                    togglePlay: () => setIsPlaying(p => !p),
                    nextTrack: () => {
                        setCurrentTrack(MOCK_TRACKS[Math.floor(Math.random() * MOCK_TRACKS.length)]);
                        setProgress(0);
                        setIsPlaying(true);
                    },
                    previousTrack: () => {
                        setProgress(0);
                    },
                    seek: (pos) => setProgress(pos),
                    setVolume: () => { },
                    disconnect: () => { }
                };
                setPlayer(activePlayer);
                return;
            }

            if (!isSdkReady) return;
            const token = await getAccessToken();
            if (!token) return;

            activePlayer = new window.Spotify.Player({
                name: 'Spotiflow Web Player',
                getOAuthToken: (cb) => {
                    getAccessToken().then((t) => cb(t));
                },
                volume: 0.5,
            });

            activePlayer.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id);
            });

            activePlayer.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            activePlayer.addListener('player_state_changed', (state) => {
                if (!state) return;
                setCurrentTrack(state.track_window.current_track);
                setIsPlaying(!state.paused);
                setProgress(state.position);
            });

            activePlayer.addListener('initialization_error', ({ message }) => setError(message));
            activePlayer.addListener('authentication_error', ({ message }) => setError(message));
            activePlayer.addListener('account_error', ({ message }) => {
                setError('Spotify Premium is required for full web playback. Enabling 30s fallback previews.');
                setIsPremium(false);
            });

            activePlayer.connect();
            setPlayer(activePlayer);
        };

        initPlayer();

        return () => {
            if (activePlayer) activePlayer.disconnect();
        };
    }, [isSdkReady]);

    // Track progress locally when playing
    useEffect(() => {
        let interval;
        if (isPlaying && currentTrack && isPremium && deviceId) {
            interval = setInterval(() => setProgress((p) => p + 1000), 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentTrack, isPremium, deviceId]);

    // Bind HTML5 Audio fallback events
    useEffect(() => {
        const handleTimeUpdate = () => setProgress(audioElement.currentTime * 1000);
        const handleEnded = () => { setIsPlaying(false); setProgress(0); };
        const handlePause = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);

        audioElement.addEventListener('timeupdate', handleTimeUpdate);
        audioElement.addEventListener('ended', handleEnded);
        audioElement.addEventListener('pause', handlePause);
        audioElement.addEventListener('play', handlePlay);

        return () => {
            audioElement.removeEventListener('timeupdate', handleTimeUpdate);
            audioElement.removeEventListener('ended', handleEnded);
            audioElement.removeEventListener('pause', handlePause);
            audioElement.removeEventListener('play', handlePlay);
        };
    }, [audioElement]);

    // --- LISTENING HISTORY LOGIC (15 SECONDS TRIGGER) ---
    useEffect(() => {
        // 15 seconds = 15000 ms
        if (currentTrack && progress >= 15000 && !loggedTracks.has(currentTrack.id)) {
            // Mark as logged immediately to prevent multiple triggers
            setLoggedTracks(prev => new Set(prev).add(currentTrack.id));

            const logTrack = async () => {
                try {
                    const user = await getCurrentUser();
                    if (!user) return;

                    let features = null;
                    let genres = [];
                    let details = null;

                    if (!IS_MOCK_MODE) {
                        const [featuresResult, detailsResult] = await Promise.all([
                            fetchAudioFeatures([currentTrack.id]),
                            getTrackDetails(currentTrack.id)
                        ]);

                        if (featuresResult && featuresResult.length > 0) {
                            features = featuresResult[0];
                        }

                        details = detailsResult;

                        let mainArtistId = null;
                        if (currentTrack.artists && currentTrack.artists.length > 0) {
                            const artistUri = currentTrack.artists[0].uri;
                            if (artistUri && artistUri.includes(':')) {
                                mainArtistId = artistUri.split(':').pop();
                            } else if (currentTrack.artists[0].id) {
                                mainArtistId = currentTrack.artists[0].id; // Fallback
                            }
                        }
                        if (mainArtistId) {
                            genres = await getArtistGenres(mainArtistId);
                        }
                    } else {
                        // Mock fallback
                        features = {
                            tempo: 120, danceability: 0.8, energy: 0.8, valence: 0.8, acousticness: 0.1, speechiness: 0.05, instrumentalness: 0.01,
                            key: 1, mode: 1, liveness: 0.2, loudness: -5.5, time_signature: 4
                        };
                        genres = ["pop", "dance pop"];
                        details = { popularity: 85, explicit: false, album: { release_date: "2020-01-01" } };
                    }

                    const trackData = {
                        user_id: user.id,
                        track_id: currentTrack.id,
                        track_name: currentTrack.name,
                        artist_name: currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown',
                        album_name: currentTrack.album?.name || '',
                        album_image: currentTrack.album?.images?.[0]?.url || '',
                        duration_ms: currentTrack.duration_ms || 0,
                        genres: genres,
                        bpm: features?.tempo || null,
                        danceability: features?.danceability || null,
                        energy: features?.energy || null,
                        valence: features?.valence || null,
                        acousticness: features?.acousticness || null,
                        speechiness: features?.speechiness || null,
                        instrumentalness: features?.instrumentalness || null,
                        key: features?.key ?? null,
                        mode: features?.mode ?? null,
                        liveness: features?.liveness || null,
                        loudness: features?.loudness || null,
                        time_signature: features?.time_signature || null,
                        popularity: details?.popularity ?? null,
                        explicit: details?.explicit ?? null,
                        release_date: details?.album?.release_date || null
                    };

                    await logListeningHistory(trackData);

                } catch (err) {
                    console.error("Failed to compile listening history data:", err);
                }
            };

            logTrack();
        }

        // Minor logic: if track changes completely, reset progress triggers if we needed to, 
        // but since we key off currentTrack.id in loggedTracks Set, it naturally won't double-log.
    }, [currentTrack, progress, loggedTracks]);
    // ----------------------------------------------------

    const togglePlay = useCallback(() => {
        if (!isPremium || !deviceId) {
            if (isPlaying) audioElement.pause();
            else audioElement.play();
        } else {
            if (player) player.togglePlay();
        }
    }, [player, isPremium, deviceId, isPlaying, audioElement]);

    const skipNext = useCallback(() => {
        if (!isPremium || !deviceId) {
            console.log("Next track not natively supported in 30s preview fallback without active queue state.");
        } else {
            if (player) player.nextTrack();
        }
    }, [player, isPremium, deviceId]);

    const skipPrevious = useCallback(() => {
        if (!isPremium || !deviceId) {
            audioElement.currentTime = 0;
            setProgress(0);
        } else {
            if (player) player.previousTrack();
        }
    }, [player, isPremium, deviceId, audioElement]);

    const seek = useCallback((position_ms) => {
        if (!isPremium || !deviceId) {
            audioElement.currentTime = position_ms / 1000;
            setProgress(position_ms);
        } else {
            if (player) {
                player.seek(position_ms);
                setProgress(position_ms);
            }
        }
    }, [player, isPremium, deviceId, audioElement]);

    const setVolume = useCallback((vol) => {
        if (player) player.setVolume(vol);
    }, [player]);

    const playTrack = useCallback(async (track) => {
        if (!track) return;

        if (IS_MOCK_MODE) {
            setCurrentTrack(track);
            setProgress(0);
            setIsPlaying(true);
            return;
        }

        // HTML5 Fallback Engine for Free Users (or waiting SDK)
        if (!isPremium || !deviceId) {
            if (track.previewUrl || track.preview_url) {
                if (player) player.pause().catch(() => { });
                audioElement.src = track.previewUrl || track.preview_url;
                audioElement.play();
                setCurrentTrack(track);
            } else {
                alert("Preview not available for this track (Spotify Free restriction).");
            }
            return;
        }

        audioElement.pause();
        const token = await getAccessToken();
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uris: [track.uri] }),
        });
        setCurrentTrack(track);
    }, [deviceId, isPremium, audioElement, player]);

    return (
        <PlayerContext.Provider
            value={{
                player,
                deviceId,
                currentTrack,
                isPlaying,
                progress,
                error,
                togglePlay,
                skipNext,
                skipPrevious,
                seek,
                setVolume,
                playTrack,
                isPremium
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    return useContext(PlayerContext);
}
