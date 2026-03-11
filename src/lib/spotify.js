import { getAccessToken, logout } from './auth';
import { IS_MOCK_MODE, MOCK_USER, MOCK_PLAYLISTS, MOCK_LIKED_SONGS, MOCK_AUDIO_FEATURES, MOCK_TRACKS, delay } from './mockData';

const BASE = 'https://api.spotify.com/v1';

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function apiFetch(endpoint, options = {}, retries = 3) {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${BASE}${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (res.status === 401) {
        throw new Error('Token expired');
    }

    // Automatic exponential/header-based backoff for Rate Limits
    if (res.status === 429) {
        if (retries > 0) {
            const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
            console.warn(`Rate limited (429). Waiting ${retryAfter}s before retrying...`);
            await sleep(retryAfter * 1000);
            return apiFetch(endpoint, options, retries - 1);
        }
        throw new Error('Rate limit exceeded (Too Many Requests)');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
}

// API Hooks

export async function getCurrentUser() {
    if (IS_MOCK_MODE) {
        await delay(500);
        return MOCK_USER;
    }
    return apiFetch('/me');
}

export async function fetchUserPlaylists() {
    if (IS_MOCK_MODE) {
        await delay(500);
        return MOCK_PLAYLISTS;
    }
    const data = await apiFetch('/me/playlists?limit=50');
    if (!data || !data.items) return [];
    return data.items;
}

export async function checkSavedTrack(trackId) {
    if (IS_MOCK_MODE) return true; // Mock: always return true
    const data = await apiFetch(`/me/tracks/contains?ids=${trackId}`);
    return data && data[0];
}

export async function saveTrack(trackId) {
    if (IS_MOCK_MODE) { await delay(200); return; }
    await apiFetch(`/me/tracks?ids=${trackId}`, { method: 'PUT', body: '{}' });
}

export async function removeSavedTrack(trackId) {
    if (IS_MOCK_MODE) { await delay(200); return; }
    await apiFetch(`/me/tracks?ids=${trackId}`, { method: 'DELETE', body: '{}' });
}

export async function queueTrack(trackUri) {
    if (IS_MOCK_MODE) { await delay(200); return; }
    await apiFetch(`/me/player/queue?uri=${encodeURIComponent(trackUri)}`, { method: 'POST' });
}

export async function searchTracks(query) {
    if (IS_MOCK_MODE) {
        await delay(500);
        return MOCK_TRACKS.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
    }
    const data = await apiFetch(`/search?q=${encodeURIComponent(query)}&type=track`);
    return data.tracks?.items || [];
}

export async function fetchAudioFeatures(trackIds) {
    if (IS_MOCK_MODE) {
        await delay(300);
        return trackIds.map(id => MOCK_AUDIO_FEATURES[id] || null);
    }
    if (!trackIds || trackIds.length === 0) return [];
    const ids = trackIds.join(',');
    const data = await apiFetch(`/audio-features?ids=${ids}`);
    return data?.audio_features || [];
}

export async function fetchTopArtists() {
    if (IS_MOCK_MODE) return [];
    const data = await apiFetch(`/me/top/artists?limit=10&time_range=long_term`);
    return data?.items || [];
}

export async function fetchAllLikedSongs(onProgress) {
    if (IS_MOCK_MODE) {
        await delay(800);
        const flatMocks = MOCK_LIKED_SONGS.map(item => ({
            id: item.track.id,
            uri: item.track.uri,
            name: item.track.name,
            artist: item.track.artists?.map(a => a.name).join(', ') || item.track.artist || '',
            album: item.track.album?.name || '',
            image: item.track.album?.images?.[0]?.url || item.track.image || '',
            imageMed: item.track.album?.images?.[1]?.url || item.track.album?.images?.[0]?.url || item.track.image || '',
            previewUrl: item.track.preview_url,
            addedAt: item.added_at,
        }));
        if (onProgress) onProgress(flatMocks.length, flatMocks.length);
        return flatMocks;
    }
    // Lazy Loading: Only fetch first 50 to prevent 30 second load times
    const limit = 50;
    const offset = 0;

    const data = await apiFetch(`/me/tracks?limit=${limit}&offset=${offset}`);

    const tracks = (data.items || [])
        .filter(item => item && item.track)
        .map((item) => ({
            id: item.track.id,
            uri: item.track.uri,
            name: item.track.name,
            artist: item.track.artists?.map((a) => a.name).join(', ') || 'Unknown',
            album: item.track.album?.name || '',
            image: item.track.album?.images?.[0]?.url || '',
            imageMed: item.track.album?.images?.[1]?.url || '',
            previewUrl: item.track.preview_url,
            addedAt: item.added_at,
        }));

    if (onProgress) onProgress(tracks.length, data.total);
    return tracks;
}

export async function fetchPlaylistTracks(playlistId) {
    if (IS_MOCK_MODE) {
        await delay(500);
        return MOCK_TRACKS.slice(0, 10); // Mock tracks
    }
    const data = await apiFetch(`/playlists/${playlistId}/tracks?limit=50`);
    if (!data || !data.items) return [];

    return (data.items || [])
        .filter(item => item && item.track)
        .map((item) => ({
            id: item.track.id,
            uri: item.track.uri,
            name: item.track.name,
            artist: item.track.artists?.map((a) => a.name).join(', ') || 'Unknown',
            album: item.track.album?.name || '',
            image: item.track.album?.images?.[0]?.url || '',
            previewUrl: item.track.preview_url,
        }));
}

export async function fetchUserPlaylistsFiltered(userId) {
    const allPlaylists = [];
    let offset = 0;
    const limit = 50;

    while (true) {
        const data = await apiFetch(`/me/playlists?limit=${limit}&offset=${offset}`);

        const playlists = (data.items || [])
            .filter((p) => p && (!userId || p.owner?.id === userId || p.collaborative))
            .map((p) => {
                const count = p.tracks?.total;
                if (count === 0 || count === undefined) {
                    console.warn(`Playlist [${p.name}] has count:`, count, 'Raw object:', p);
                }
                return {
                    id: p.id,
                    name: p.name,
                    image: p.images?.[0]?.url || '',
                    trackCount: count ?? '?',
                    owner: p.owner?.display_name || '',
                };
            });

        allPlaylists.push(...playlists);

        if (data.next === null) break;
        offset += limit;
        await sleep(150); // Throttle to prevent burst rate limits
    }

    return allPlaylists;
}

export async function createPlaylist(userId, name) {
    if (IS_MOCK_MODE) {
        await delay(500);
        const newPl = { id: `mock_new_${Date.now()}`, name, images: [], tracks: { total: 0 } };
        MOCK_PLAYLISTS.push(newPl);
        return newPl;
    }
    return apiFetch(`/users/${encodeURIComponent(userId)}/playlists`, {
        method: 'POST',
        body: JSON.stringify({
            name: name,
            description: 'Created with Spotiflow',
            public: false
        })
    });
}

export async function addTrackToPlaylist(playlistId, trackUri) {
    if (IS_MOCK_MODE) { await delay(200); return { snapshot_id: "mock_snap" }; }
    return apiFetch(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
            uris: [trackUri]
        })
    });
}

export async function removeTrackFromPlaylist(playlistId, trackUri, snapshotId) {
    if (IS_MOCK_MODE) { await delay(200); return; }
    return apiFetch(`/playlists/${playlistId}/tracks`, {
        method: 'DELETE',
        body: JSON.stringify({
            tracks: [{ uri: trackUri }],
            snapshot_id: snapshotId
        })
    });
}

export async function getRecommendations(seed_artists, seed_tracks, audio_features) {
    if (IS_MOCK_MODE) {
        await delay(500);
        return MOCK_TRACKS;
    }

    const params = new URLSearchParams();
    if (seed_artists?.length) params.append('seed_artists', seed_artists.join(','));
    if (seed_tracks?.length) params.append('seed_tracks', seed_tracks.join(','));

    if (audio_features) {
        for (const [key, value] of Object.entries(audio_features)) {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        }
    }

    // Default limit
    if (!params.has('limit')) params.append('limit', '20');

    // the Spotify API requires at least one seed. Since we allow optional seeds in UI, handle empty seeds edge case by defaulting to an empty list or throwing?
    // Let's assume the caller passes at least one seed.
    if (!params.has('seed_artists') && !params.has('seed_tracks') && !params.has('seed_genres')) {
        // Fallback seed genre to avoid API error if no seeds provided
        params.append('seed_genres', 'pop');
    }

    const data = await apiFetch(`/recommendations?${params.toString()}`);
    if (!data || !data.tracks) return [];

    return data.tracks.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artist: track.artists?.map((a) => a.name).join(', ') || 'Unknown',
        album: track.album?.name || '',
        image: track.album?.images?.[0]?.url || '',
        previewUrl: track.preview_url,
    }));
}

export async function getArtistGenres(artistId) {
    if (IS_MOCK_MODE) {
        await delay(200);
        return ["pop", "dance pop"];
    }
    if (!artistId) return [];

    try {
        const data = await apiFetch(`/artists/${artistId}`);
        return data?.genres || [];
    } catch (err) {
        console.error("Failed to fetch artist genres", err);
        return [];
    }
}

export async function getTrackDetails(trackId) {
    if (IS_MOCK_MODE) {
        await delay(200);
        return { popularity: 85, explicit: false, album: { release_date: "2020-01-01" } };
    }
    if (!trackId) return null;
    try {
        return await apiFetch(`/tracks/${trackId}`);
    } catch (err) {
        console.error("Failed to fetch track details", err);
        return null;
    }
}
