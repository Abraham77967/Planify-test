// Configuration settings for the Planify application

// Spotify API Configuration
const SPOTIFY_CONFIG = {
    // Your Spotify application client ID (should match what you registered with Spotify)
    CLIENT_ID: "82f6edcd7d0648eba0f0a297c8c2c197",
    
    // The redirect URI registered with your Spotify application
    // This MUST match exactly what you registered in the Spotify Developer Dashboard
    REDIRECT_URI: "https://abraham77967.github.io/Planify-test/",
    
    // Scopes determine what permissions your app requests from users
    SCOPES: [
        "user-read-private", 
        "user-read-email", 
        "user-read-playback-state", 
        "user-modify-playback-state", 
        "playlist-read-private", 
        "streaming"
    ]
}; 