// Spotify Integration for Calendar App

// Spotify API credentials and configuration
const SPOTIFY_CLIENT_ID = SPOTIFY_CONFIG.CLIENT_ID;
const SPOTIFY_REDIRECT_URI = SPOTIFY_CONFIG.REDIRECT_URI;
const SPOTIFY_SCOPES = SPOTIFY_CONFIG.SCOPES;

// Spotify API endpoints
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// Spotify player object
let spotifyPlayer = null;
let currentDeviceId = null;
let accessToken = null;
let userProfile = null;
let userPlaylists = [];
let currentPlaylistId = null;
let isPlaying = false;

// DOM Elements
let connectButton;
let playerContainer;
let loginContainer;
let userInfoElement;
let playlistsListElement;
let currentlyPlayingElement;
let playButton;
let pauseButton;
let prevButton;
let nextButton;

// PKCE Auth helper functions
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Base64 URL encode a string
function base64UrlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Generate SHA-256 hash of a string
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    
    return base64UrlEncode(String.fromCharCode(...new Uint8Array(digest)));
}

// Initialize Spotify integration when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeSpotify);

function initializeSpotify() {
    // Get DOM elements
    connectButton = document.getElementById("spotify-connect-button");
    playerContainer = document.getElementById("spotify-player-container");
    loginContainer = document.getElementById("spotify-login-container");
    userInfoElement = document.getElementById("spotify-user-info");
    playlistsListElement = document.getElementById("playlists-list");
    currentlyPlayingElement = document.getElementById("currently-playing");
    playButton = document.getElementById("spotify-play-button");
    pauseButton = document.getElementById("spotify-pause-button");
    prevButton = document.getElementById("spotify-prev-button");
    nextButton = document.getElementById("spotify-next-button");

    // Add event listeners
    connectButton.addEventListener("click", authenticateWithSpotify);
    playButton.addEventListener("click", playSpotify);
    pauseButton.addEventListener("click", pauseSpotify);
    prevButton.addEventListener("click", previousTrack);
    nextButton.addEventListener("click", nextTrack);
    
    // Display current redirect URI for troubleshooting
    const currentUriElement = document.getElementById("current-uri");
    if (currentUriElement) {
        currentUriElement.textContent = SPOTIFY_REDIRECT_URI;
    }

    // Test popup capability
    testPopupCapability();

    // Check if we have a token in the URL (returning from auth)
    checkAuthCallback();

    // Check if we have a saved token
    checkSavedToken();

    // Load the Spotify Web Playback SDK
    loadSpotifySDK();
}

// Test if popups are allowed
function testPopupCapability() {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
        console.warn("Popups appear to be blocked. Spotify login may not work correctly.");
        
        // Add a warning to the login container
        const warningElement = document.createElement('p');
        warningElement.className = 'popup-warning';
        warningElement.textContent = 'Please enable popups for this site to use Spotify integration.';
        warningElement.style.color = 'red';
        warningElement.style.fontSize = '12px';
        loginContainer.appendChild(warningElement);
    } else {
        testPopup.close();
    }
}

// Load the Spotify Web Playback SDK
function loadSpotifySDK() {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = initializePlayer;
}

// Initialize the Spotify Web Playback SDK
function initializePlayer() {
    // Only initialize if we have a token
    if (!accessToken) return;

    const player = new Spotify.Player({
        name: 'Calendar App Player',
        getOAuthToken: cb => cb(accessToken),
        volume: 0.5
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize player:', message);
    });
    player.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
        // Token might be expired, clear it
        clearToken();
    });
    player.addListener('account_error', ({ message }) => {
        console.error('Failed to validate account:', message);
    });
    player.addListener('playback_error', ({ message }) => {
        console.error('Failed to perform playback:', message);
    });

    // Playback status updates
    player.addListener('player_state_changed', state => {
        if (state) {
            updatePlayerState(state);
        }
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Spotify player ready with device ID:', device_id);
        currentDeviceId = device_id;
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline:', device_id);
        currentDeviceId = null;
    });

    // Connect to the player
    player.connect();
    spotifyPlayer = player;
}

// Authenticate with Spotify using Implicit Flow
function authenticateWithSpotify() {
    try {
        // Log the redirect URI for debugging
        console.log("Using redirect URI:", SPOTIFY_REDIRECT_URI);
        
        // Build the Spotify authorization URL for Implicit Flow
        const authUrl = new URL(SPOTIFY_AUTH_URL);
        
        // Add query parameters for Implicit Flow
        authUrl.searchParams.append("client_id", SPOTIFY_CLIENT_ID);
        authUrl.searchParams.append("response_type", "token");
        authUrl.searchParams.append("redirect_uri", SPOTIFY_REDIRECT_URI);
        authUrl.searchParams.append("scope", SPOTIFY_SCOPES.join(" "));
        authUrl.searchParams.append("show_dialog", "true");
        
        // Log the full auth URL for debugging
        console.log("Auth URL:", authUrl.toString());
        
        // Redirect to Spotify authorization
        window.location.href = authUrl.toString();
    } catch (error) {
        console.error("Error initiating Spotify auth:", error);
        alert("There was a problem connecting to Spotify. Please try again.");
    }
}

// Check URL for auth callback with token or code
async function checkAuthCallback() {
    console.log("Checking auth callback...");
    console.log("Current URL:", window.location.href);
    
    // Check for code (PKCE flow)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("code")) {
        const code = urlParams.get("code");
        console.log("Received authorization code:", code);
        
        // Get code verifier from storage
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        
        if (!codeVerifier) {
            console.error("Code verifier not found in storage");
            alert("Authentication failed: Code verifier not found. Please try again.");
            return false;
        }
        
        try {
            // Alert the user about what's happening
            alert("Authorization code received! Due to CORS limitations in this demo, we need you to complete one more step. Please visit the Spotify Developer Dashboard and edit your app to use Implicit Grant Flow instead. Then try again with the Connect button.");
            
            // Clear code from URL
            history.replaceState(null, null, window.location.pathname);
            return false;
            
            /* 
            // In a real application with a backend, you would do:
            const tokenUrl = "https://accounts.spotify.com/api/token";
            
            const tokenData = new URLSearchParams();
            tokenData.append("client_id", SPOTIFY_CLIENT_ID);
            tokenData.append("grant_type", "authorization_code");
            tokenData.append("code", code);
            tokenData.append("redirect_uri", SPOTIFY_REDIRECT_URI);
            tokenData.append("code_verifier", codeVerifier);
            
            // Send token request via your backend
            const response = await fetch("/api/spotify-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    code,
                    codeVerifier,
                    redirectUri: SPOTIFY_REDIRECT_URI
                })
            });
            */
        } catch (error) {
            console.error("Error exchanging code for token:", error);
            alert("Failed to authenticate with Spotify: " + error.message);
            
            // Clear code from URL
            history.replaceState(null, null, window.location.pathname);
            return false;
        }
    }
    
    // Check for errors
    if (urlParams.has("error")) {
        console.error("Spotify authorization error:", urlParams.get("error"));
        alert("Failed to connect to Spotify: " + urlParams.get("error"));
        
        // Clear error from URL
        history.replaceState(null, null, window.location.pathname);
        return false;
    }
    
    // Check for token (implicit flow)
    if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.has("access_token")) {
            // Store token
            accessToken = hashParams.get("access_token");
            const expiresIn = hashParams.get("expires_in");
            
            // Save token to local storage
            saveToken(accessToken, expiresIn);
            
            // Clear hash from URL
            history.replaceState(null, null, window.location.pathname);
            
            // Setup the UI with the new token
            setupAuthenticatedUI();
            
            // Log success for debugging
            console.log("Successfully authenticated with Spotify via Implicit Flow");
            return true;
        } else if (hashParams.has("error")) {
            // Handle authentication errors
            console.error("Spotify authentication error:", hashParams.get("error"));
            alert("Failed to connect to Spotify: " + hashParams.get("error"));
            
            // Clear hash from URL
            history.replaceState(null, null, window.location.pathname);
            return false;
        }
    }
    
    return false;
}

// Check for saved token in local storage
function checkSavedToken() {
    const savedToken = localStorage.getItem("spotify_access_token");
    const tokenExpiry = localStorage.getItem("spotify_token_expiry");
    
    if (savedToken && tokenExpiry) {
        // Check if token is still valid
        if (new Date().getTime() < parseInt(tokenExpiry)) {
            accessToken = savedToken;
            setupAuthenticatedUI();
        } else {
            // Token expired, clear it
            clearToken();
        }
    }
}

// Save token to local storage with expiry
function saveToken(token, expiresIn) {
    localStorage.setItem("spotify_access_token", token);
    const expiryTime = new Date().getTime() + (expiresIn * 1000);
    localStorage.setItem("spotify_token_expiry", expiryTime);
}

// Clear token from local storage
function clearToken() {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_token_expiry");
    localStorage.removeItem("spotify_code_verifier");
    accessToken = null;
    
    // Reset UI
    loginContainer.style.display = "block";
    playerContainer.style.display = "none";
}

// Setup UI for authenticated user
function setupAuthenticatedUI() {
    // Hide login, show player
    loginContainer.style.display = "none";
    playerContainer.style.display = "block";
    
    // Fetch user profile and playlists
    fetchUserProfile();
    fetchUserPlaylists();
}

// Fetch user profile from Spotify API
async function fetchUserProfile() {
    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            userProfile = await response.json();
            userInfoElement.textContent = `Logged in as ${userProfile.display_name}`;
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

// Fetch user playlists from Spotify API
async function fetchUserPlaylists() {
    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=50`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            userPlaylists = data.items;
            renderPlaylists(userPlaylists);
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error("Error fetching playlists:", error);
    }
}

// Render playlists in the UI
function renderPlaylists(playlists) {
    playlistsListElement.innerHTML = "";
    
    if (playlists.length === 0) {
        playlistsListElement.innerHTML = "<p>No playlists found</p>";
        return;
    }
    
    playlists.forEach(playlist => {
        const playlistElement = document.createElement("div");
        playlistElement.classList.add("playlist-item");
        playlistElement.dataset.playlistId = playlist.id;
        
        // Mark as active if this is the current playlist
        if (playlist.id === currentPlaylistId) {
            playlistElement.classList.add("active");
        }
        
        // Playlist image
        const imageUrl = playlist.images && playlist.images.length > 0 
            ? playlist.images[0].url 
            : "https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png";
        
        playlistElement.innerHTML = `
            <img src="${imageUrl}" alt="${playlist.name}" class="playlist-image">
            <div class="playlist-info">
                <div class="playlist-name">${playlist.name}</div>
                <div class="playlist-tracks">${playlist.tracks.total} tracks</div>
            </div>
        `;
        
        playlistElement.addEventListener("click", () => {
            playPlaylist(playlist.id);
        });
        
        playlistsListElement.appendChild(playlistElement);
    });
}

// Play a specific playlist
async function playPlaylist(playlistId) {
    if (!currentDeviceId) {
        alert("Waiting for Spotify player to connect. Please try again in a moment.");
        return;
    }
    
    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/me/player/play?device_id=${currentDeviceId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                context_uri: `spotify:playlist:${playlistId}`
            })
        });
        
        if (response.ok) {
            currentPlaylistId = playlistId;
            isPlaying = true;
            
            // Update UI to show active playlist
            const playlistItems = document.querySelectorAll(".playlist-item");
            playlistItems.forEach(item => {
                if (item.dataset.playlistId === playlistId) {
                    item.classList.add("active");
                } else {
                    item.classList.remove("active");
                }
            });
        } else {
            handleApiError(response);
        }
    } catch (error) {
        console.error("Error playing playlist:", error);
    }
}

// Play current track
function playSpotify() {
    if (spotifyPlayer) {
        spotifyPlayer.resume().then(() => {
            isPlaying = true;
        });
    }
}

// Pause current track
function pauseSpotify() {
    if (spotifyPlayer) {
        spotifyPlayer.pause().then(() => {
            isPlaying = false;
        });
    }
}

// Skip to next track
function nextTrack() {
    if (spotifyPlayer) {
        spotifyPlayer.nextTrack();
    }
}

// Go to previous track
function previousTrack() {
    if (spotifyPlayer) {
        spotifyPlayer.previousTrack();
    }
}

// Update the player state based on current playback
function updatePlayerState(state) {
    // Update track information
    if (state.track_window.current_track) {
        const track = state.track_window.current_track;
        currentlyPlayingElement.innerHTML = `
            <strong>${track.name}</strong> by ${track.artists[0].name}
        `;
    } else {
        currentlyPlayingElement.textContent = "Nothing playing";
    }
    
    // Update play/pause button state
    isPlaying = !state.paused;
}

// Handle API errors
function handleApiError(response) {
    if (response.status === 401) {
        // Unauthorized - token expired
        alert("Spotify session expired. Please reconnect.");
        clearToken();
    } else {
        console.error("API Error:", response.status);
    }
} 