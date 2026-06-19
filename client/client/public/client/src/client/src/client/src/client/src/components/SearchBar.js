import React, { useState, useRef, useEffect } from 'react';

function SearchBar({ onTrackSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setQuery(q);
    
    if (q.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/search?q_track=${encodeURIComponent(q)}`);
      const data = await res.json();
      const tracks = data.message?.body?.track_list || [];
      setResults(tracks.slice(0, 8));
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSelectTrack = (track) => {
    onTrackSelect(track.track);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="search-bar" ref={inputRef}>
      <input
        type="text"
        placeholder="🔍 Search by song title or artist..."
        value={query}
        onChange={handleSearch}
        onFocus={() => results.length > 0 && setShowResults(true)}
      />
      
      {showResults && results.length > 0 && (
        <ul className="search-results">
          {results.map((item) => (
            <li
              key={item.track.track_id}
              className="result-item"
              onClick={() => handleSelectTrack(item)}
            >
              <strong>{item.track.track_name}</strong>
              <p>{item.track.artist_name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
