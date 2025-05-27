# Calendar App with Spotify Integration

A web-based calendar application that includes Spotify integration for playing music while managing your tasks and events.

## Spotify Integration Setup

The app includes integration with Spotify to allow users to connect their accounts and play music directly within the calendar interface.

### Setting Up Spotify API

1. **Spotify Developer Account**:
   - The app is already configured with a client ID (`82f6edcd7d0648eba0f0a297c8c2c197`)
   - If you want to use your own client ID, replace it in `spotify.js`

2. **Redirect URIs**:
   - For local development: You must add `http://localhost:8080/index.html` to your Spotify app's redirect URIs
   - For production: Add your production URL (e.g., `https://abraham77967.github.io/Planify-test/`)

### Testing Locally

The Spotify API won't work with `file:///` URLs. You need to serve the app through a web server:

```bash
# Install http-server if you don't have it
npm install -g http-server

# Start a local server (from the project directory)
http-server -p 8080

# Then open the app at:
# http://localhost:8080
```

### Production Deployment

When deploying to GitHub Pages or another hosting service:

1. Update your Spotify Developer App with the production URL
2. The code will automatically detect GitHub Pages and use the appropriate redirect URI

## Features

- Monthly calendar view
- Task management with checklists
- Goal tracking
- Spotify music integration
- Responsive design for various screen sizes

## Technologies

- HTML5, CSS3, JavaScript
- Spotify Web API and Web Playback SDK