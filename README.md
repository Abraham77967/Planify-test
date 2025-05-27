# Calendar App with Spotify Integration

A web-based calendar application that includes Spotify integration for playing music while managing your tasks and events.

## Spotify Integration Setup

The app includes integration with Spotify to allow users to connect their accounts and play music directly within the calendar interface.

### Setting Up Spotify API

1. **Spotify Developer Account**:
   - The app is already configured with a client ID (`82f6edcd7d0648eba0f0a297c8c2c197`)
   - If you want to use your own client ID, replace it in `spotify.js`

2. **Redirect URI Setup - IMPORTANT**:
   - Open your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Select your app
   - Click "Edit Settings"
   - Under "Redirect URIs", add this **exact URI**: `https://abraham77967.github.io`
   - Do NOT add `/Planify-test/` or any other path after the domain
   - Click "Save" to update your app settings

3. **INVALID_CLIENT Error Solution**:
   - If you see "INVALID_CLIENT: Invalid redirect URI" error, the error comes from a mismatch between:
     - The redirect URI registered in your Spotify Developer Dashboard
     - The redirect URI in your code (spotify.js)
   - Both must match EXACTLY - even small differences will cause the error
   - Current URI being used: `https://abraham77967.github.io`

### Testing the Application

For testing the Spotify integration:

1. **Deploy to GitHub Pages**:
   - Push your code to GitHub
   - Deploy to GitHub Pages
   - The app will be accessible at `https://abraham77967.github.io/Planify-test/`
   - But the redirect URI will be just `https://abraham77967.github.io`

2. **Local Development**:
   - The Spotify integration will only work when accessed through GitHub Pages
   - This is because the redirect URI is hardcoded to the GitHub domain

```bash
# To run a local server (Spotify won't work locally with this configuration)
http-server -p 8080
```

## Features

- Monthly calendar view
- Task management with checklists
- Goal tracking
- Spotify music integration
- Responsive design for various screen sizes

## Technologies

- HTML5, CSS3, JavaScript
- Spotify Web API and Web Playback SDK
