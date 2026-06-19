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
