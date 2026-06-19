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
    .filter(line => {
      const wordCount = line.split(/\s+/).length;
      return wordCount >= 5 && !line.includes('[') && !line.includes(']') && 
             line.length >= 20 && line.length <= 150;
    });
  
  const meaningfulPhrases = [];
  
  lines.forEach(line => {
    const words = line.toLowerCase().match(/\b\w+\b/g) || [];
    const meaningfulCount = words.filter(w => !stopwords.has(w)).length;
    
    if (meaningfulCount >= 3) {
      meaningfulPhrases.push(line);
    }
  });
  
  const phraseFreq = {};
  meaningfulPhrases.forEach(phrase => {
    phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
  });
  
  const topPhrases = Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);
  
  const themes = extractThemes(lyrics);
  
  return {
    phrases: topPhrases,
    themes,
    totalLines: lines.length,
  };
}

function extractThemes(lyrics) {
  const themeMaps = {
    love: ['love', 'beloved', 'heart', 'romance', 'kiss', 'adore'],
    heartbreak: ['break', 'pain', 'cry', 'hurt', 'alone', 'goodbye'],
    revolution: ['fight', 'rise', 'change', 'freedom', 'power'],
    night: ['night', 'dark', 'stars', 'moon', 'midnight'],
    dance: ['dance', 'move', 'groove', 'party', 'rhythm'],
    hope: ['hope', 'believe', 'dream', 'light', 'tomorrow'],
    sadness: ['sad', 'tears', 'sorrow', 'blue', 'grief'],
    party: ['party', 'celebration', 'champagne', 'fun'],
    passion: ['passion', 'fire', 'burn', 'desire', 'intense'],
    freedom: ['free', 'freedom', 'wild', 'escape'],
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
