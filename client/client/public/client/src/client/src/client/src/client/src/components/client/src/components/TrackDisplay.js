import React from 'react';

function TrackDisplay({ track }) {
  return (
    <div className="track-display">
      <h2>{track.track_name}</h2>
      <p>By <strong>{track.artist_name}</strong></p>
      {track.album_coverart_350x350 && (
        <img src={track.album_coverart_350x350} alt="Album art" />
      )}
      <p>Released: {track.release_date || 'N/A'}</p>
    </div>
  );
}

export default TrackDisplay;
