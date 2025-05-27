// Spotify API Configuration
const spotifyConfig = {
    clientId: '82f6edcd7d0648eba0f0a297c8c2c197', // Your Spotify Developer Dashboard Client ID
    redirectUri: 'https://abraham77967.github.io/Planify-test/',
    authEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    scopes: [
        'user-read-private',
        'user-read-email',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'streaming',
        'playlist-read-private',
        'playlist-read-collaborative'
    ]
};

// Spotify player instance
let spotifyPlayer = null;
let deviceId = null;
let currentPlaylist = null;
let isPlaying = false;
let accessToken = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const spotifyLoginButton = document.getElementById('spotify-login-button');
    const spotifyLoginContainer = document.getElementById('spotify-login-container');
    const spotifyPlayerContainer = document.getElementById('spotify-player-container');
    const playlistsContainer = document.getElementById('playlists-container');
    const togglePlayButton = document.getElementById('toggle-play');
    const previousTrackButton = document.getElementById('previous-track');
    const nextTrackButton = document.getElementById('next-track');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTrackImage = document.getElementById('current-track-image');
    const currentTrackName = document.getElementById('current-track-name');
    const currentTrackArtist = document.getElementById('current-track-artist');

    // Check if we have a token in localStorage
    const storedToken = localStorage.getItem('spotify_access_token');
    const tokenExpiry = localStorage.getItem('spotify_token_expiry');
    
    if (storedToken && tokenExpiry && new Date().getTime() < parseInt(tokenExpiry)) {
        // Token is still valid
        accessToken = storedToken;
        initializeSpotify();
    } else {
        // Check if we're returning from auth
        const params = new URLSearchParams(window.location.hash.substring(1));
        const newToken = params.get('access_token');
        
        if (newToken) {
            // Store the token
            accessToken = newToken;
            const expiresIn = params.get('expires_in');
            const expiryTime = new Date().getTime() + (parseInt(expiresIn) * 1000);
            
            localStorage.setItem('spotify_access_token', accessToken);
            localStorage.setItem('spotify_token_expiry', expiryTime.toString());
            
            // Remove hash from URL
            window.history.replaceState(null, null, window.location.pathname);
            
            initializeSpotify();
        }
    }

    // Login button event listener
    spotifyLoginButton.addEventListener('click', () => {
        loginWithSpotify();
    });

    // Player control event listeners
    togglePlayButton.addEventListener('click', togglePlay);
    previousTrackButton.addEventListener('click', playPreviousTrack);
    nextTrackButton.addEventListener('click', playNextTrack);
    volumeSlider.addEventListener('input', setVolume);

    // Initialize Spotify Web Playback SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
        if (accessToken) {
            initializePlayer();
        }
    };

    // Function to login with Spotify
    function loginWithSpotify() {
        const authUrl = `${spotifyConfig.authEndpoint}?client_id=${spotifyConfig.clientId}&redirect_uri=${encodeURIComponent(spotifyConfig.redirectUri)}&scope=${encodeURIComponent(spotifyConfig.scopes.join(' '))}&response_type=token&show_dialog=true`;
        console.log('Spotify Auth URL:', authUrl);
        console.log('Client ID:', spotifyConfig.clientId);
        console.log('Redirect URI:', spotifyConfig.redirectUri);
        window.location.href = authUrl;
    }

    // Initialize Spotify integration
    function initializeSpotify() {
        spotifyLoginContainer.style.display = 'none';
        spotifyPlayerContainer.style.display = 'block';
        
        // Initialize player if SDK is ready
        if (window.Spotify) {
            initializePlayer();
        }
        
        // Load user's playlists
        loadPlaylists();
    }

    // Initialize Spotify Web Playback SDK player
    function initializePlayer() {
        spotifyPlayer = new Spotify.Player({
            name: 'Calendar App Player',
            getOAuthToken: cb => { cb(accessToken); },
            volume: 0.5
        });

        // Error handling
        spotifyPlayer.addListener('initialization_error', ({ message }) => {
            console.error('Initialization error:', message);
        });
        
        spotifyPlayer.addListener('authentication_error', ({ message }) => {
            console.error('Authentication error:', message);
            // Token might be expired, clear and request new login
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_token_expiry');
            spotifyLoginContainer.style.display = 'block';
            spotifyPlayerContainer.style.display = 'none';
        });
        
        spotifyPlayer.addListener('account_error', ({ message }) => {
            console.error('Account error:', message);
        });
        
        spotifyPlayer.addListener('playback_error', ({ message }) => {
            console.error('Playback error:', message);
        });

        // Playback status updates
        spotifyPlayer.addListener('player_state_changed', state => {
            if (state) {
                updatePlayerState(state);
            }
        });

        // Ready
        spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('Spotify Player Ready with Device ID:', device_id);
            deviceId = device_id;
            
            // Transfer playback to this device
            fetch('https://api.spotify.com/v1/me/player', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    device_ids: [deviceId],
                    play: false
                })
            }).catch(error => console.error('Error transferring playback:', error));
        });

        // Connect to the player
        spotifyPlayer.connect();
    }

    // Load user's playlists
    function loadPlaylists() {
        fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch playlists');
            }
            return response.json();
        })
        .then(data => {
            playlistsContainer.innerHTML = '';
            
            if (data.items.length === 0) {
                playlistsContainer.innerHTML = '<div class="no-playlists">No playlists found</div>';
                return;
            }
            
            data.items.forEach(playlist => {
                const playlistElement = document.createElement('div');
                playlistElement.classList.add('playlist-item');
                playlistElement.dataset.id = playlist.id;
                
                const imageUrl = playlist.images.length > 0 ? playlist.images[0].url : '';
                
                playlistElement.innerHTML = `
                    <div class="playlist-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="playlist-details">
                        <div class="playlist-name">${playlist.name}</div>
                        <div class="playlist-tracks">${playlist.tracks.total} tracks</div>
                    </div>
                `;
                
                playlistElement.addEventListener('click', () => {
                    // Remove active class from all playlists
                    document.querySelectorAll('.playlist-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    // Add active class to selected playlist
                    playlistElement.classList.add('active');
                    
                    // Play the selected playlist
                    playPlaylist(playlist.id);
                });
                
                playlistsContainer.appendChild(playlistElement);
            });
        })
        .catch(error => {
            console.error('Error loading playlists:', error);
            playlistsContainer.innerHTML = '<div class="error-message">Failed to load playlists</div>';
        });
    }

    // Play a playlist
    function playPlaylist(playlistId) {
        if (!deviceId) return;
        
        currentPlaylist = playlistId;
        
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                context_uri: `spotify:playlist:${playlistId}`
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to play playlist');
            }
            isPlaying = true;
            updatePlayButton();
        })
        .catch(error => {
            console.error('Error playing playlist:', error);
        });
    }

    // Toggle play/pause
    function togglePlay() {
        if (!spotifyPlayer) return;
        
        spotifyPlayer.getCurrentState().then(state => {
            if (!state) {
                console.error('No active Spotify session');
                return;
            }
            
            if (state.paused) {
                spotifyPlayer.resume();
                isPlaying = true;
            } else {
                spotifyPlayer.pause();
                isPlaying = false;
            }
            
            updatePlayButton();
        });
    }

    // Play previous track
    function playPreviousTrack() {
        if (!spotifyPlayer) return;
        spotifyPlayer.previousTrack();
    }

    // Play next track
    function playNextTrack() {
        if (!spotifyPlayer) return;
        spotifyPlayer.nextTrack();
    }

    // Set volume
    function setVolume() {
        if (!spotifyPlayer) return;
        const volume = volumeSlider.value / 100;
        spotifyPlayer.setVolume(volume);
    }

    // Update player state based on current playback
    function updatePlayerState(state) {
        if (!state || !state.track_window || !state.track_window.current_track) {
            return;
        }
        
        const track = state.track_window.current_track;
        
        // Update track info
        currentTrackName.textContent = track.name;
        currentTrackArtist.textContent = track.artists.map(artist => artist.name).join(', ');
        
        if (track.album.images && track.album.images.length > 0) {
            currentTrackImage.style.backgroundImage = `url(${track.album.images[0].url})`;
        }
        
        // Update play/pause button
        isPlaying = !state.paused;
        updatePlayButton();
    }

    // Update play/pause button appearance
    function updatePlayButton() {
        if (isPlaying) {
            togglePlayButton.textContent = '⏸';
        } else {
            togglePlayButton.textContent = '▶';
        }
    }
}); 