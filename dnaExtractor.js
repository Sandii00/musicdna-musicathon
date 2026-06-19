const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we',
  'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
]);

function extractDNA(lyrics) {
  if (!lyrics || typeof lyrics !== 'string') {
    return { phrases: [], themes: {}, totalLines: 0 };
  }
  
  const lines = lyrics
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.includes('[') && !line.includes(']'));
  
  const phrases = [];
  
  // Extract meaningful line-based phrases (instead of just 3-word chunks)
  lines.forEach(line => {
    const words = line.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Keep lines that have meaningful content (4+ words)
    if (words.length >= 4) {
      // Remove leading/trailing stopwords
      let filtered = words.filter(w => !stopwords.has(w));
      
      if (filtered.length >= 3) {
        // Take the meaningful chunk
        const phrase = filtered.slice(0, 5).join(' '); // Get up to 5 words
        if (phrase.length > 10) {
          phrases.push(phrase);
        }
      }
    }
    
    // Also extract 3-word phrases from longer lines
    if (words.length >= 5) {
      const filtered = words.filter(w => !stopwords.has(w) && w.length > 3);
      for (let i = 0; i < filtered.length - 2; i++) {
        phrases.push(filtered.slice(i, i + 3).join(' '));
      }
    }
  });
  
  // Count phrase frequency
  const dnaProfile = {};
  phrases.forEach(p => {
    dnaProfile[p] = (dnaProfile[p] || 0) + 1;
  });
  
  // Get top 20 phrases by frequency
  const topPhrases = Object.entries(dnaProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([p]) => p);
  
  const themes = extractThemes(lyrics);
  
  return {
    phrases: topPhrases,
    themes,
    totalLines: lines.length,
  };
}

function extractThemes(lyrics) {
  const themeMaps = {
    love: ['love', 'beloved', 'heart', 'romance', 'kiss', 'adore', 'affection'],
    heartbreak: ['break', 'pain', 'cry', 'hurt', 'alone', 'goodbye', 'miss', 'lost'],
    revolution: ['fight', 'rise', 'change', 'freedom', 'power', 'rebel', 'revolution'],
    night: ['night', 'dark', 'stars', 'moon', 'midnight', 'moonlight'],
    dance: ['dance', 'move', 'groove', 'party', 'club', 'rhythm'],
    hope: ['hope', 'believe', 'dream', 'light', 'tomorrow', 'faith'],
    sadness: ['sad', 'tears', 'sorrow', 'blue', 'grief', 'mourn', 'depressed'],
    party: ['party', 'celebration', 'champagne', 'dancing', 'fun', 'vibe'],
    passion: ['passion', 'fire', 'burn', 'desire', 'intense', 'wild'],
    freedom: ['free', 'freedom', 'wild', 'break free', 'escape', 'liberate'],
  };
  
  const themes = {};
  const lyricsLower = lyrics.toLowerCase();
  
  Object.entries(themeMaps).forEach(([theme, keywords]) => {
    const count = keywords.filter(kw => lyricsLower.includes(kw)).length;
    if (count > 0) themes[theme] = count;
  });
  
  return themes;
}

module.exports = { extractDNA };
