# Calendar App with Spotify Integration

This calendar app allows you to manage events, tasks, and goals while enjoying your Spotify playlists.

## Features

- Two-month calendar view
- Event management with checklists
- Main goals tracking
- Spotify music player integration
- Responsive design for mobile and desktop

## Setting Up Spotify Integration

To use the Spotify integration, you need to create a Spotify Developer Application:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app name (e.g., "Calendar App") and description
5. Accept the terms and click "Create"
6. In your app settings, click "Edit Settings"
7. Add your app's URL to the Redirect URIs section:
   - For local testing: `http://localhost:8000` (or whatever port you're using)
   - For production: your actual domain
8. Save the settings
9. Copy your Client ID from the dashboard
10. Open the `spotify.js` file and replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID

## Running the App

1. Start a local web server:
   ```
   python -m http.server
   ```
   or any other web server of your choice

2. Open your browser and navigate to `http://localhost:8000`

3. Click "Connect Spotify" in the Spotify section to authorize the app

4. Select a playlist to start playing music

## Notes

- The Spotify Web Playback SDK requires a Spotify Premium account
- The app uses localStorage to store the Spotify access token
- The token expires after 1 hour, after which you'll need to reconnect
- The app needs to be running on HTTPS or localhost for the Spotify Web Playback SDK to work

## Troubleshooting

- If you see "Authentication error", try reconnecting to Spotify
- If playback doesn't start, make sure you have an active Spotify device (open Spotify app)
- For any other issues, check the browser console for error messages