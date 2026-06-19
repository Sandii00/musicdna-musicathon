import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import TrackDisplay from './components/TrackDisplay';
import InfluenceTree from './components/InfluenceTree';
import './App.css';

function App() {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [dnaProfile, setDnaProfile] = useState(null);
  const [influences, setInfluences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrackSelect = async (track) => {
    setSelectedTrack(track);
    setLoading(true);
    setError(null);
    
    try {
      const lyricsRes = await fetch(`/api/lyrics/${track.track_id}`);
      const lyricsData = await lyricsRes.json();
      const lyrics = lyricsData.message?.body?.lyrics?.lyrics_body;
      
      if (!lyrics) {
        setError('No lyrics found for this track');
        setLoading(false);
        return;
      }
      
      const dnaRes = await fetch('/api/extract-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics }),
      });
      const dna = await dnaRes.json();
      setDnaProfile(dna);
      
      const infRes = await fetch('/api/find-influences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dnaProfile: dna }),
      });
      const infData = await infRes.json();
      setInfluences(infData.influences || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to analyze song');
    }
    
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🎵 MusicDNA</h1>
        <p>Discover the genealogy of any song</p>
      </header>
      
      <main className="container">
        <SearchBar onTrackSelect={handleTrackSelect} />
        {error && <div className="error-message">{error}</div>}
        {selectedTrack && <TrackDisplay track={selectedTrack} />}
        {loading && <div className="loading">Analyzing DNA...</div>}
        {dnaProfile && !loading && (
          <div className="dna-profile">
            <h3>🧬 DNA Profile</h3>
            <strong>Key Phrases:</strong>
            <ul>
              {dnaProfile.phrases.slice(0, 5).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {influences.length > 0 && !loading && (
          <InfluenceTree track={selectedTrack} influences={influences} />
        )}
      </main>
    </div>
  );
}

export default App;
