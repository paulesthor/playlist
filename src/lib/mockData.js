// Fake Spotify Data for Mock Mode Testing

export const IS_MOCK_MODE = false; // TOGGLE THIS FLAG TO ENABLE/DISABLE MOCK MODE

export const MOCK_USER = {
    id: "mock_user_99",
    display_name: "Test User (Mock Mode)",
    images: [{ url: "https://i.pravatar.cc/150?img=33" }]
};

export const MOCK_PLAYLISTS = [
    { id: "p1", name: "Summer Vibes 🌞", images: [{ url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300" }], owner: { display_name: "Test User" }, tracks: { total: 42 } },
    { id: "p2", name: "Deep Focus 🧠", images: [{ url: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=300" }], owner: { display_name: "Test User" }, tracks: { total: 18 } },
    { id: "p3", name: "Workout 💪", images: [{ url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300" }], owner: { display_name: "Test User" }, tracks: { total: 0 } },
];

export const MOCK_TRACKS = [
    {
        id: "t1", uri: "spotify:track:t1", name: "Blinding Lights", duration_ms: 200000,
        artists: [{ name: "The Weeknd" }],
        album: { images: [{ url: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36" }] }
    },
    {
        id: "t2", uri: "spotify:track:t2", name: "Levitating", duration_ms: 203000,
        artists: [{ name: "Dua Lipa" }],
        album: { images: [{ url: "https://i.scdn.co/image/ab67616d0000b273bd22dee6bfbda85bc9d59247" }] }
    },
    {
        id: "t3", uri: "spotify:track:t3", name: "Shape of You", duration_ms: 233000,
        artists: [{ name: "Ed Sheeran" }],
        album: { images: [{ url: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96" }] }
    },
    {
        id: "t4", uri: "spotify:track:t4", name: "Bohemian Rhapsody", duration_ms: 354000,
        artists: [{ name: "Queen" }],
        album: { images: [{ url: "https://i.scdn.co/image/ab67616d0000b273e8b066f70c206551210d902b" }] }
    },
    {
        id: "t5", uri: "spotify:track:t5", name: "Stay", duration_ms: 141000,
        artists: [{ name: "The Kid LAROI, Justin Bieber" }],
        album: { images: [{ url: "https://i.scdn.co/image/ab67616d0000b27341e31d6ea1d493dd77933ee5" }] }
    }
];

// Map track IDs to specific audio features
export const MOCK_AUDIO_FEATURES = {
    "t1": { id: "t1", energy: 0.73, valence: 0.33, danceability: 0.51, acousticness: 0.00 },
    "t2": { id: "t2", energy: 0.82, valence: 0.92, danceability: 0.70, acousticness: 0.05 },
    "t3": { id: "t3", energy: 0.65, valence: 0.93, danceability: 0.82, acousticness: 0.58 },
    "t4": { id: "t4", energy: 0.40, valence: 0.22, danceability: 0.41, acousticness: 0.27 },
    "t5": { id: "t5", energy: 0.76, valence: 0.73, danceability: 0.59, acousticness: 0.03 }
};

export const MOCK_LIKED_SONGS = MOCK_TRACKS.map((t, idx) => ({
    track: t,
    added_at: new Date(Date.now() - (idx * 10000000000)).toISOString() // Varied dates
}));

export const delay = (ms) => new Promise(res => setTimeout(res, ms));
