// Configuration settings for the Planify application

// Spotify API Configuration
const SPOTIFY_CONFIG = {
    // Your Spotify application client ID (should match what you registered with Spotify)
    CLIENT_ID: "82f6edcd7d0648eba0f0a297c8c2c197",
    
    // The redirect URI registered with your Spotify application
    // This MUST match exactly what you registered in the Spotify Developer Dashboard
    // Make sure to include the trailing slash if it's in your actual URL
    REDIRECT_URI: "https://abraham77967.github.io/Planify-test/",
    
    // IMPORTANT SETUP NOTES:
    // 1. In Spotify Developer Dashboard, set this exact Redirect URI
    // 2. Ensure both URLs are in sync - the one in your code and in the dashboard
    // 3. You don't need to enable Implicit Grant for the PKCE flow
    
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