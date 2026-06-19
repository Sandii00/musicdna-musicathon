const axios = require('axios');

async function findInfluences(dnaProfile, apiKey) {
  const { phrases } = dnaProfile;
  
  if (!phrases || phrases.length === 0) {
    return [];
  }
  
  const influences = [];
  const searchedQueries = phrases.slice(0, 5);
  
  try {
    // Run all searches in PARALLEL instead of sequentially
    const searchPromises = searchedQueries.map(phrase =>
      axios.get(
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
      ).catch(error => {
        console.error(`Error searching "${phrase}":`, error.message);
        return null;
      })
    );
    
    const results = await Promise.all(searchPromises);
    
    // Collect all influences from parallel results
    results.forEach(response => {
      if (!response) return;
      
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
    });
    
  } catch (error) {
    console.error('Error in findInfluences:', error.message);
  }
  
  // Deduplicate by track ID
  const unique = {};
  influences.forEach(inf => {
    const key = inf.trackId.toString();
    if (!unique[key] || unique[key].similarity < inf.similarity) {
      unique[key] = inf;
    }
  });
  
  // Return top 10 sorted by similarity
  return Object.values(unique)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
}

module.exports = { findInfluences };
