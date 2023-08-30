const wordArray = [
    'nick',
    'chaturbate',
    'cliq',
    'record',
    'cb',
    'recordings'
];
function validateString(string) {
    if (string.startsWith('%%%')) return false;
    const cleanedString = string.replace(/[^a-zA-Z ]/g, '');
    const words = cleanedString.toLowerCase().split(' ');
    for(let i = 0; i < wordArray.length; i++){
        const word = wordArray[i].toLowerCase();
        // Check for exact match
        if (words.includes(word)) {
            return false; // String is invalid
        }
        // Check for fuzzy match in both directions
        for(let j = 0; j < words.length; j++){
            const currentWord = words[j];
            const maxWordLength = Math.max(word.length, currentWord.length);
            const distance = Math.min(levenshteinDistance(word, currentWord), levenshteinDistance(currentWord, word));
            const threshold = Math.ceil(maxWordLength / 3); // Adjust threshold as needed
            if (distance <= threshold) {
                return false; // String is invalid
            }
        }
    }
    return true; // String is valid
}
function levenshteinDistance(word1, word2) {
    const m = word1.length;
    const n = word2.length;
    const dp = Array.from(Array(m + 1), ()=>Array(n + 1).fill(0));
    for(let i = 0; i <= m; i++){
        dp[i][0] = i;
    }
    for(let j = 0; j <= n; j++){
        dp[0][j] = j;
    }
    for(let i = 1; i <= m; i++){
        for(let j = 1; j <= n; j++){
            if (word1[i - 1] === word2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]) + 1;
            }
        }
    }
    return dp[m][n];
}
export { validateString };
