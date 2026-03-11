import { IS_MOCK_MODE } from './mockData';

const CLIENT_ID = '835aecd4574740eb86912b6ff59c20e2';
const REDIRECT_URI = 'https://paulesthor.github.io/playlist/';
const SCOPES = 'user-library-read playlist-modify-public playlist-modify-private playlist-read-private streaming user-read-playback-state user-modify-playback-state user-top-read user-library-modify';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

// PKCE helpers
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, (v) => chars[v % chars.length]).join('');
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    bytes.forEach((b) => (str += String.fromCharCode(b)));
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Start OAuth flow
export async function loginWithSpotify() {
    if (IS_MOCK_MODE) {
        localStorage.setItem('spotiflow_v3_access_token', 'mock_token_123');
        window.location.reload();
        return;
    }

    const verifier = generateRandomString(64);
    const challenge = base64urlEncode(await sha256(verifier));

    localStorage.setItem('spotiflow_v3_code_verifier', verifier);

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge_method: 'S256',
        code_challenge: challenge,
    });

    window.location.href = `${AUTH_URL}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) return false;

    const verifier = localStorage.getItem('spotiflow_v3_code_verifier');
    if (!verifier) return false;

    try {
        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                code_verifier: verifier,
            }),
        });

        if (!response.ok) throw new Error('Token exchange failed');

        const data = await response.json();
        saveTokens(data);
        localStorage.removeItem('spotiflow_v3_code_verifier');

        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
    } catch (err) {
        console.error('Auth error:', err);
        return false;
    }
}

function saveTokens(data) {
    if (data.access_token) localStorage.setItem('spotiflow_v3_access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('spotiflow_v3_refresh_token', data.refresh_token);
    if (data.expires_in) {
        localStorage.setItem('spotiflow_v3_token_expiry', Date.now() + data.expires_in * 1000);
    }
}

export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem('spotiflow_v3_refresh_token');
    if (!refreshToken) return null;

    try {
        const response = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) throw new Error('Token refresh failed');

        const data = await response.json();
        saveTokens(data);
        return data.access_token;
    } catch (err) {
        console.error('Refresh error:', err);
        logout();
        return null;
    }
}

export async function getAccessToken() {
    const expiry = localStorage.getItem('spotiflow_v3_token_expiry');
    const token = localStorage.getItem('spotiflow_v3_access_token');

    if (!token) return null;

    // Refresh if expiring within 60 seconds
    if (expiry && Date.now() > parseInt(expiry) - 60000) {
        return await refreshAccessToken();
    }

    return token;
}

export function isAuthenticated() {
    if (IS_MOCK_MODE) return !!localStorage.getItem('spotiflow_v3_access_token');
    return !!localStorage.getItem('spotiflow_v3_access_token');
}

export function logout() {
    localStorage.removeItem('spotiflow_v3_access_token');
    localStorage.removeItem('spotiflow_v3_refresh_token');
    localStorage.removeItem('spotiflow_v3_token_expiry');
    localStorage.removeItem('spotiflow_v3_code_verifier');
}
