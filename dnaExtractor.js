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
    .filter(line => line.length > 0);
  
  const phrases = [];
  
  lines.forEach(line => {
    const words = line.toLowerCase().match(/\b\w+\b/g) || [];
    const filtered = words.filter(w => !stopwords.has(w) && w.length > 3);
    
    for (let i = 0; i < filtered.length - 2; i++) {
      phrases.push(filtered.slice(i, i + 3).join(' '));
    }
  });
  
  const dnaProfile = {};
  phrases.forEach(p => {
    dnaProfile[p] = (dnaProfile[p] || 0) + 1;
  });
  
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
    love: ['love', 'heart', 'romance', 'kiss'],
    heartbreak: ['break', 'pain', 'cry', 'hurt', 'alone'],
    revolution: ['fight', 'rise', 'change', 'freedom', 'power'],
    night: ['night', 'dark', 'stars', 'moon'],
    dance: ['dance', 'move', 'groove', 'party'],
    hope: ['hope', 'believe', 'dream', 'light'],
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
