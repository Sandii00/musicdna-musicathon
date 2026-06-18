const axios = require('axios');

async function findInfluences(dnaProfile, apiKey) {
  const { phrases } = dnaProfile;
  
  if (!phrases || phrases.length === 0) {
    return [];
  }
  
  const influences = [];
  const searchedQueries = new Set();
  
  for (const phrase of phrases.slice(0, 5)) {
    if (searchedQueries.has(phrase)) continue;
    searchedQueries.add(phrase);
    
    try {
      const response = await axios.get(
        'https://api.musixmatch.com/ws/1.1/track.search',
        {
          params: {
            q_lyrics: phrase,
            apikey: apiKey,
            page_size: 5,
            s_track_rating: 'desc',
          },
          timeout: 5000,
        }
      );
      
      const trackList = response.data.message?.body?.track_list || [];
      trackList.forEach((item, idx) => {
        const track = item.track;
        influences.push({
          trackId: track.track_id,
          title: track.track_name,
          artist: track.artist_name,
          releaseDate: track.release_date,
          similarity: 100 - (idx * 10),
          albumArt: track.album_coverart_350x350,
        });
      });
    } catch (error) {
      console.error(`Error searching "${phrase}":`, error.message);
      continue;
    }
  }
  
  const unique = {};
  influences.forEach(inf => {
    const key = inf.trackId.toString();
    if (!unique[key] || unique[key].similarity < inf.similarity) {
      unique[key] = inf;
    }
  });
  
  return Object.values(unique)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
}

module.exports = { findInfluences };
