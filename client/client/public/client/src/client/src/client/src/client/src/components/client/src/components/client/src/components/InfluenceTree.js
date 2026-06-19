import React from 'react';

function InfluenceTree({ track, influences }) {
  return (
    <div className="influence-tree">
      <h3>🌳 Influence Genealogy</h3>
      <p>Songs that share DNA with <strong>{track.track_name}</strong></p>
      <ul className="influence-list">
        {influences.map((inf) => (
          <li key={inf.trackId} className="influence-item">
            <strong>{inf.title}</strong>
            <div>by {inf.artist}</div>
            <div>{inf.similarity.toFixed(0)}% match</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default InfluenceTree;
