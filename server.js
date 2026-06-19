const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));



const MUSIXMATCH_API_KEY = process.env.MUSIXMATCH_API_KEY;
const JAMBASE_API_KEY = process.env.JAMBASE_API_KEY;

const { extractDNA } = require('./dnaExtractor');
const { findInfluences } = require('./influenceMatcher');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running', timestamp: new Date() });
});

// Search tracks
app.get('/api/search', async (req, res) => {
  const { q_track, q_artist } = req.query;
  
  if (!q_track) {
    return res.status(400).json({ error: 'q_track required' });
  }
  
  try {
    const response = await axios.get(
      'https://api.musixmatch.com/ws/1.1/track.search',
      {
        params: {
          q_track,
          q_artist: q_artist || '',
          apikey: MUSIXMATCH_API_KEY,
          page_size: 10,
          f_has_lyrics: 1,
        },
        timeout: 5000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get track details
app.get('/api/track/:trackId', async (req, res) => {
  const { trackId } = req.params;
  
  try {
    const response = await axios.get(
      'https://api.musixmatch.com/ws/1.1/track.get',
      {
        params: {
          track_id: trackId,
          apikey: MUSIXMATCH_API_KEY,
        },
        timeout: 5000,
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Track fetch failed' });
  }
});

// Get lyrics
app.get('/api/lyrics/:trackId', async (req, res) => {
  const { trackId } = req.params;
  
  try {
    const response = await axios.get(
      'https://api.musixmatch.com/ws/1.1/track.lyrics.get',
      {
        params: {
          track_id: trackId,
          apikey: MUSIXMATCH_API_KEY,
        },
        timeout: 5000,
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Lyrics fetch failed' });
  }
});

// Extract DNA
app.post('/api/extract-dna', (req, res) => {
  const { lyrics } = req.body;
  
  if (!lyrics) {
    return res.status(400).json({ error: 'Lyrics required' });
  }
  
  try {
    const dnaProfile = extractDNA(lyrics);
    res.json(dnaProfile);
  } catch (error) {
    res.status(500).json({ error: 'DNA extraction failed' });
  }
});

// Find influences
app.post('/api/find-influences', async (req, res) => {
  const { dnaProfile } = req.body;
  
  if (!dnaProfile) {
    return res.status(400).json({ error: 'DNA profile required' });
  }
  
  try {
    const influences = await findInfluences(dnaProfile, MUSIXMATCH_API_KEY);
    res.json({ influences });
  } catch (error) {
    res.status(500).json({ error: 'Finding influences failed' });
  }
});

// Get artist stats via Songstats
app.get('/api/artist-stats/:artistName', async (req, res) => {
  const { artistName } = req.params;
  
  try {
    // Songstats API endpoint (requires free API key from songstats.com)
    const response = await axios.get(
      'https://api.songstats.com/v1/artist/search',
      {
        params: {
          name: artistName,
          apikey: process.env.SONGSTATS_API_KEY || 'demo',
        },
        timeout: 5000,
      }
    );
    
    const artist = response.data.data?.[0];
    if (!artist) {
      return res.json({ 
        stats: {
          popularity: 'N/A',
          streams: 'N/A',
          followers: 'N/A'
        }
      });
    }
    
    res.json({ 
      stats: {
        name: artist.name,
        popularity: artist.popularity || 'N/A',
        streams: artist.streams || 'N/A',
        followers: artist.followers || 'N/A',
        image: artist.image || null
      }
    });
  } catch (error) {
    console.error('Songstats error:', error.message);
    res.json({ stats: { popularity: 'N/A' } });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎵 MusicDNA running on port ${PORT}`);
});
// ============ SPOTIFY ARTIST PROFILE ============

// Get Spotify access token
async function getSpotifyToken() {
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000,
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Spotify auth error:', error.message);
    return null;
  }
}

// Get artist profile from Spotify
app.get('/api/artist-profile/:artistName', async (req, res) => {
  const { artistName } = req.params;
  
  try {
    const token = await getSpotifyToken();
    if (!token) {
      return res.json({ artist: null });
    }
    
    const searchRes = await axios.get(
      'https://api.spotify.com/v1/search',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          q: artistName,
          type: 'artist',
          limit: 1
        },
        timeout: 5000,
      }
    );
    
    const artist = searchRes.data.artists?.items?.[0];
    if (!artist) {
      return res.json({ artist: null });
    }
    
    res.json({
      artist: {
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0,
        genres: artist.genres || [],
        spotifyUrl: artist.external_urls?.spotify || null
      }
    });
  } catch (error) {
    console.error('Artist profile error:', error.message);
    res.json({ artist: null });
  }
});

// ============ ELEVENLABS TEXT-TO-SPEECH ============

app.post('/api/generate-speech', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }
  
  try {
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 10000,
      }
    );
    
    // Convert audio to base64
    const audioBase64 = Buffer.from(response.data).toString('base64');
    res.json({ audio: `data:audio/mpeg;base64,${audioBase64}` });
  } catch (error) {
    console.error('ElevenLabs error:', error.message);
    res.status(500).json({ error: 'Speech generation failed' });
  }
});

// ============ JAMBASE TOURS ============

app.get('/api/artist-tours/:artistName', async (req, res) => {
  const { artistName } = req.params;
  
  try {
    const response = await axios.get(
      'https://api.jambase.com/v3/artists/search',
      {
        params: {
          name: artistName,
          apikey: process.env.JAMBASE_API_KEY,
        },
        timeout: 5000,
      }
    );
    
    const artist = response.data.artists?.[0];
    if (!artist) {
      return res.json({ tours: [] });
    }
    
    const eventsResponse = await axios.get(
      `https://api.jambase.com/v3/artists/${artist.id}/events`,
      {
        params: {
          apikey: process.env.JAMBASE_API_KEY,
          limit: 10,
        },
        timeout: 5000,
      }
    );
    
    res.json({ tours: eventsResponse.data.events || [] });
  } catch (error) {
    console.error('JamBase error:', error.message);
    res.json({ tours: [] });
  }
});

// ============ SONGSTATS ARTIST STATS ============

app.get('/api/artist-stats/:artistName', async (req, res) => {
  const { artistName } = req.params;
  
  try {
    const response = await axios.get(
      'https://api.songstats.com/v1/artist/search',
      {
        params: {
          name: artistName,
          apikey: process.env.SONGSTATS_API_KEY || 'demo',
        },
        timeout: 5000,
      }
    );
    
    const artist = response.data.data?.[0];
    if (!artist) {
      return res.json({ stats: null });
    }
    
    res.json({
      stats: {
        name: artist.name,
        streams: artist.streams || 'N/A',
        popularity: artist.popularity || 'N/A',
        followers: artist.followers || 'N/A',
      }
    });
  } catch (error) {
    console.error('Songstats error:', error.message);
    res.json({ stats: null });
  }
});
