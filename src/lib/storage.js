const SWIPED_KEY = 'spotiflow_swiped_ids';
const PLAYLIST_KEY = 'spotiflow_target_playlist';

export function getSwipedIds() {
    try {
        const data = localStorage.getItem(SWIPED_KEY);
        return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
        return new Set();
    }
}

export function addSwipedId(id) {
    const ids = getSwipedIds();
    ids.add(id);
    localStorage.setItem(SWIPED_KEY, JSON.stringify([...ids]));
}

export function removeSwipedId(id) {
    const ids = getSwipedIds();
    ids.delete(id);
    localStorage.setItem(SWIPED_KEY, JSON.stringify([...ids]));
}

export function getTargetPlaylist() {
    try {
        const data = localStorage.getItem(PLAYLIST_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export function setTargetPlaylist(playlist) {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
}

export function clearTargetPlaylist() {
    localStorage.removeItem(PLAYLIST_KEY);
}
