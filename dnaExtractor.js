const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we',
  'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'it\'s',
  'that', 'this', 'these', 'those', 'from', 'by', 'with', 'as', 'if', 'so', 'not', 'no', 'yes'
]);

function extractDNA(lyrics) {
  if (!lyrics || typeof lyrics !== 'string') {
    return { phrases: [], themes: {}, totalLines: 0 };
  }
  
  const lines = lyrics
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 5 && !line.includes('[') && !line.includes(']'));
  
  // Extract meaningful words (nouns, verbs, adjectives)
  const meaningfulWords = [];
  
  lines.forEach(line => {
    const words = line.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
      if (!stopwords.has(word) && word.length > 3) {
        meaningfulWords.push(word);
      }
    });
  });
  
  // Count word frequency
  const wordFreq = {};
  meaningfulWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Get most frequent words (these are core concepts)
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  // Build meaningful phrases from these top words
  const phrases = [];
  lines.forEach(line => {
    const words = line.toLowerCase().match(/\b\w+\b/g) || [];
    const linePhrase = words
      .filter(w => !stopwords.has(w) && w.length > 2)
      .join(' ');
    
    if (linePhrase.length > 10 && linePhrase.length < 80) {
      phrases.push(linePhrase);
    }
  });
  
  // Deduplicate and get most common phrases
  const phraseFreq = {};
  phrases.forEach(p => {
    phraseFreq[p] = (phraseFreq[p] || 0) + 1;
  });
  
  const topPhrases = Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([p]) => p);
  
  const themes = extractThemes(lyrics);
  
  return {
    phrases: topPhrases.length > 0 ? topPhrases : topWords,
    themes,
    totalLines: lines.length,
  };
}

function extractThemes(lyrics) {
  const themeMaps = {
    love: ['love', 'beloved', 'heart', 'romance', 'kiss', 'adore', 'affection', 'lover'],
    heartbreak: ['break', 'pain', 'cry', 'hurt', 'alone', 'goodbye', 'miss', 'lost', 'broken'],
    revolution: ['fight', 'rise', 'change', 'freedom', 'power', 'rebel', 'revolution', 'stand up'],
    night: ['night', 'dark', 'stars', 'moon', 'midnight', 'moonlight', 'darkness'],
    dance: ['dance', 'move', 'groove', 'party', 'club', 'rhythm', 'beat', 'dancing'],
    hope: ['hope', 'believe', 'dream', 'light', 'tomorrow', 'faith', 'believe in'],
    sadness: ['sad', 'tears', 'sorrow', 'blue', 'grief', 'mourn', 'depressed', 'crying'],
    party: ['party', 'celebration', 'champagne', 'dancing', 'fun', 'vibe', 'celebrate'],
    passion: ['passion', 'fire', 'burn', 'desire', 'intense', 'wild', 'burning'],
    freedom: ['free', 'freedom', 'wild', 'break free', 'escape', 'liberate', 'liberty'],
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
