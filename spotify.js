// Spotify API integration
const CLIENT_ID = '82f6edcd7d0648eba0f0a297c8c2c197'; // Replace with your Spotify client ID
const REDIRECT_URI = window.location.origin; // Use the current domain as redirect URI
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state'
];

// Spotify Web Player object
let spotifyPlayer = null;
let currentPlaylistId = null;
let isPlaying = false;
let currentTrackId = null;

// DOM Elements
let spotifyConnectButton;
let spotifyLogoutButton;
let spotifyLoginSection;
let spotifyPlayerSection;
let spotifyUserName;
let spotifyPlaylists;
let trackName;
let artistName;
let playPauseButton;
let previousTrackButton;
let nextTrackButton;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSpotify);

function initSpotify() {
    console.log('Initializing Spotify integration');
    
    // Get DOM elements
    spotifyConnectButton = document.getElementById('spotify-connect-button');
    spotifyLogoutButton = document.getElementById('spotify-logout-button');
    spotifyLoginSection = document.getElementById('spotify-login-section');
    spotifyPlayerSection = document.getElementById('spotify-player-section');
    spotifyUserName = document.getElementById('spotify-user-name');
    spotifyPlaylists = document.getElementById('spotify-playlists');
    trackName = document.getElementById('track-name');
    artistName = document.getElementById('artist-name');
    playPauseButton = document.getElementById('play-pause');
    previousTrackButton = document.getElementById('previous-track');
    nextTrackButton = document.getElementById('next-track');
    
    // Add event listeners
    spotifyConnectButton.addEventListener('click', connectToSpotify);
    spotifyLogoutButton.addEventListener('click', disconnectFromSpotify);
    playPauseButton.addEventListener('click', togglePlayPause);
    previousTrackButton.addEventListener('click', playPreviousTrack);
    nextTrackButton.addEventListener('click', playNextTrack);
    
    // Check if we have an access token in URL (after redirect)
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');
    
    if (accessToken) {
        // Remove hash from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Save token and initialize
        localStorage.setItem('spotify_access_token', accessToken);
        
        // Get token expiration
        const expiresIn = params.get('expires_in');
        if (expiresIn) {
            const expirationTime = Date.now() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('spotify_token_expiration', expirationTime);
        }
        
        initializeWithToken(accessToken);
    } else {
        // Check if we have a saved token that's not expired
        const savedToken = localStorage.getItem('spotify_access_token');
        const tokenExpiration = localStorage.getItem('spotify_token_expiration');
        
        if (savedToken && tokenExpiration && Date.now() < parseInt(tokenExpiration)) {
            initializeWithToken(savedToken);
        } else {
            // No valid token, show login section
            showLoginSection();
        }
    }
    
    // Initialize Spotify Web Playback SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('Spotify Web Playback SDK ready');
    };
}

function connectToSpotify() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
}

function disconnectFromSpotify() {
    // Clear tokens and reset state
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiration');
    currentPlaylistId = null;
    isPlaying = false;
    currentTrackId = null;
    
    // Disconnect player if it exists
    if (spotifyPlayer) {
        spotifyPlayer.disconnect();
        spotifyPlayer = null;
    }
    
    // Show login section
    showLoginSection();
}

function showLoginSection() {
    spotifyLoginSection.style.display = 'block';
    spotifyPlayerSection.style.display = 'none';
}

function showPlayerSection() {
    spotifyLoginSection.style.display = 'none';
    spotifyPlayerSection.style.display = 'block';
}

async function initializeWithToken(accessToken) {
    try {
        // Get user profile
        const userProfile = await fetchUserProfile(accessToken);
        console.log('User profile:', userProfile);
        
        // Show user info
        spotifyUserName.textContent = userProfile.display_name || userProfile.id;
        
        // Fetch user playlists
        const playlists = await fetchPlaylists(accessToken);
        console.log('User playlists:', playlists);
        
        // Render playlists
        renderPlaylists(playlists, accessToken);
        
        // Initialize Spotify player
        initializePlayer(accessToken);
        
        // Show player section
        showPlayerSection();
    } catch (error) {
        console.error('Error initializing Spotify:', error);
        alert('Failed to connect to Spotify. Please try again.');
        disconnectFromSpotify();
    }
}

async function fetchUserProfile(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
    }
    
    return response.json();
}

async function fetchPlaylists(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items;
}

function renderPlaylists(playlists, accessToken) {
    spotifyPlaylists.innerHTML = '';
    
    if (playlists.length === 0) {
        const noPlaylistsMsg = document.createElement('p');
        noPlaylistsMsg.textContent = 'No playlists found.';
        noPlaylistsMsg.className = 'no-playlists-message';
        spotifyPlaylists.appendChild(noPlaylistsMsg);
        return;
    }
    
    playlists.forEach(playlist => {
        const playlistItem = document.createElement('div');
        playlistItem.className = 'spotify-playlist-item';
        playlistItem.dataset.playlistId = playlist.id;
        
        // Create playlist image
        const playlistImage = document.createElement('img');
        playlistImage.className = 'playlist-image';
        
        if (playlist.images && playlist.images.length > 0) {
            playlistImage.src = playlist.images[0].url;
        } else {
            playlistImage.src = 'https://via.placeholder.com/40?text=No+Image';
        }
        
        // Create playlist details
        const playlistDetails = document.createElement('div');
        playlistDetails.className = 'playlist-details';
        
        const playlistName = document.createElement('div');
        playlistName.className = 'playlist-name';
        playlistName.textContent = playlist.name;
        
        const playlistTracks = document.createElement('div');
        playlistTracks.className = 'playlist-tracks';
        playlistTracks.textContent = `${playlist.tracks.total} tracks`;
        
        playlistDetails.appendChild(playlistName);
        playlistDetails.appendChild(playlistTracks);
        
        playlistItem.appendChild(playlistImage);
        playlistItem.appendChild(playlistDetails);
        
        // Add click event to play the playlist
        playlistItem.addEventListener('click', () => {
            selectPlaylist(playlist.id, accessToken);
            
            // Update active state
            document.querySelectorAll('.spotify-playlist-item').forEach(item => {
                item.classList.remove('active');
            });
            playlistItem.classList.add('active');
        });
        
        spotifyPlaylists.appendChild(playlistItem);
    });
}

async function selectPlaylist(playlistId, accessToken) {
    try {
        currentPlaylistId = playlistId;
        
        // Get playlist tracks
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch playlist tracks: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.items.length > 0) {
            // Start playing the first track
            const firstTrack = data.items[0].track;
            
            if (firstTrack && firstTrack.uri) {
                playTrack(firstTrack.uri, accessToken);
                updateNowPlaying(firstTrack);
            }
        }
    } catch (error) {
        console.error('Error selecting playlist:', error);
        alert('Failed to play playlist. Please try again.');
    }
}

async function playTrack(trackUri, accessToken) {
    try {
        // Get available devices
        const devicesResponse = await fetch('https://api.spotify.com/v1/me/player/devices', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!devicesResponse.ok) {
            throw new Error(`Failed to fetch devices: ${devicesResponse.status}`);
        }
        
        const devicesData = await devicesResponse.json();
        const devices = devicesData.devices;
        
        // If no active device, use the first available one
        let deviceId = null;
        
        if (devices && devices.length > 0) {
            // Find active device or use the first one
            const activeDevice = devices.find(device => device.is_active);
            deviceId = activeDevice ? activeDevice.id : devices[0].id;
        }
        
        // Play the track on the selected device
        const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [trackUri]
            })
        });
        
        if (!playResponse.ok) {
            throw new Error(`Failed to play track: ${playResponse.status}`);
        }
        
        isPlaying = true;
        playPauseButton.textContent = '⏸';
    } catch (error) {
        console.error('Error playing track:', error);
        alert('Failed to play track. Make sure you have an active Spotify client open or try refreshing the page.');
    }
}

function updateNowPlaying(track) {
    if (!track) return;
    
    currentTrackId = track.id;
    trackName.textContent = track.name || 'Unknown Track';
    
    if (track.artists && track.artists.length > 0) {
        artistName.textContent = track.artists.map(artist => artist.name).join(', ');
    } else {
        artistName.textContent = 'Unknown Artist';
    }
}

async function togglePlayPause() {
    const accessToken = localStorage.getItem('spotify_access_token');
    if (!accessToken) return;
    
    try {
        if (isPlaying) {
            // Pause the player
            await fetch('https://api.spotify.com/v1/me/player/pause', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            isPlaying = false;
            playPauseButton.textContent = '▶';
        } else {
            // Resume playback
            await fetch('https://api.spotify.com/v1/me/player/play', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            isPlaying = true;
            playPauseButton.textContent = '⏸';
        }
    } catch (error) {
        console.error('Error toggling playback:', error);
    }
}

async function playPreviousTrack() {
    const accessToken = localStorage.getItem('spotify_access_token');
    if (!accessToken) return;
    
    try {
        await fetch('https://api.spotify.com/v1/me/player/previous', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        // Update now playing info
        setTimeout(async () => {
            await updateCurrentlyPlaying(accessToken);
        }, 500);
    } catch (error) {
        console.error('Error playing previous track:', error);
    }
}

async function playNextTrack() {
    const accessToken = localStorage.getItem('spotify_access_token');
    if (!accessToken) return;
    
    try {
        await fetch('https://api.spotify.com/v1/me/player/next', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        // Update now playing info
        setTimeout(async () => {
            await updateCurrentlyPlaying(accessToken);
        }, 500);
    } catch (error) {
        console.error('Error playing next track:', error);
    }
}

async function updateCurrentlyPlaying(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.status === 204) {
            // No content, nothing is playing
            trackName.textContent = 'No track playing';
            artistName.textContent = '';
            isPlaying = false;
            playPauseButton.textContent = '▶';
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch currently playing: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.item) {
            updateNowPlaying(data.item);
            isPlaying = data.is_playing;
            playPauseButton.textContent = isPlaying ? '⏸' : '▶';
        }
    } catch (error) {
        console.error('Error updating currently playing:', error);
    }
}

function initializePlayer(accessToken) {
    // Set up polling to update currently playing info
    setInterval(() => {
        if (accessToken) {
            updateCurrentlyPlaying(accessToken);
        }
    }, 5000); // Update every 5 seconds
} 