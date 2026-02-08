/*
   ___      ___    _____   ___ _  _
  / __|__ _| _ \__|_   _| |_ _| \| |__ _
 | (__/ _` |  _(_-< | || '_| || .` / _` |
  \___\__,_|_| /__/ |_||_||___|_|\_\__, |
                                   |___/
*/

/**
 * capstring - CaPiTaLiZe StRiNgS in 29 ways!
 * @module capstring
 */

/** All supported capitalization styles */
const STYLES = Object.freeze([
  // Case styles
  'same', 'none', 'proper', 'title', 'sentence', 'upper', 'lower', 'swap',
  // Code styles
  'camel', 'pascal', 'snake', 'kebab', 'slug', 'constant', 'python', 'dot', 'path', 'train',
  // Fun styles
  'leet', 'reverse', 'sponge', 'mock', 'alternate', 'crazy', 'random',
  // New styles
  'hashtag', 'acronym', 'rot13', 'flip'
]);

/** Upside-down character mapping */
const FLIP_MAP = {
  'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ',
  'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u',
  'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n',
  'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
  'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ',
  'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N',
  'O': 'O', 'P': 'Ԁ', 'Q': 'Q', 'R': 'ɹ', 'S': 'S', 'T': '┴', 'U': '∩',
  'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
  '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ',
  '6': '9', '7': 'ㄥ', '8': '8', '9': '6',
  '.': '˙', ',': "'", "'": ',', '"': '„', '!': '¡', '?': '¿',
  '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '&': '⅋', '_': '‾'
};

/**
 * Apply ROT13 cipher to a string
 * @param {string} str - Input string
 * @returns {string} ROT13 encoded string
 */
const rot13 = (str) => {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0);
    const base = code < 97 ? 65 : 97;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
};

/**
 * Flip text upside down
 * @param {string} str - Input string
 * @returns {string} Flipped string
 */
const flipText = (str) => {
  return str.split('').reverse().map(char => FLIP_MAP[char] || char).join('');
};

/**
 * Transform a string to the specified capitalization style
 * @param {string} str - The string to transform
 * @param {string} [style='same'] - The capitalization style
 * @returns {string|false} The transformed string, or false if input is invalid
 *
 * @example
 * capstring('hello world', 'title') // 'Hello World'
 * capstring('hello world', 'kebab') // 'hello-world'
 * capstring('hello world', 'camel') // 'helloWorld'
 */
const capstring = (str, style = 'same') => {
  // Validate input
  if (!str) return false;
  if (typeof str !== 'string') return false;

  // Normalize words (split on any whitespace, filter empty)
  const words = str.toLowerCase().split(/\s+/).filter(w => w);

  switch (style) {
    // ========== Case Styles ==========

    case 'same':
      // Return unchanged
      return str;

    case 'none':
      // Return empty string
      return '';

    case 'proper':
      // Return unchanged (alias for same)
      return str;

    case 'title':
      // Title Case - capitalize first letter of each word
      return str.replace(/\w([^-\s]*)/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );

    case 'sentence':
      // Sentence case - capitalize first letter only
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();

    case 'upper':
      // UPPERCASE
      return str.toUpperCase();

    case 'lower':
      // lowercase
      return str.toLowerCase();

    case 'swap':
      // sWAP cASE - invert each character's case
      return str.split('').map(char => {
        if (char === char.toUpperCase()) return char.toLowerCase();
        if (char === char.toLowerCase()) return char.toUpperCase();
        return char;
      }).join('');

    // ========== Code Styles ==========

    case 'camel':
      // camelCase - first word lowercase, rest capitalized, no spaces
      return words.map((word, i) =>
        i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');

    case 'pascal':
      // PascalCase - all words capitalized, no spaces
      return words.map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');

    case 'snake':
      // snake_case
      return words.join('_');

    case 'kebab':
    case 'slug':
      // kebab-case (URL-friendly)
      return words.join('-');

    case 'constant':
    case 'python':
      // CONSTANT_CASE / PYTHON_CASE (SCREAMING_SNAKE_CASE)
      // Both now use normalized words for consistency
      return words.join('_').toUpperCase();

    case 'dot':
      // dot.case
      return words.join('.');

    case 'path':
      // path/case
      return words.join('/');

    case 'train':
      // Train-Case (like title but with dashes)
      return words.map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('-');

    // ========== Fun Styles ==========

    case 'leet':
      // l33t sp34k
      return str.toLowerCase()
        .replace(/i/g, '1')
        .replace(/e/g, '3')
        .replace(/o/g, '0')
        .replace(/l/g, '£')
        .replace(/f/g, 'ƒ')
        .replace(/s/g, '$')
        .replace(/n/g, 'И');

    case 'reverse':
      // esreveR
      return str.split('').reverse().join('');

    case 'sponge':
      // SpOnGeBoB tExT - starts uppercase, alternates
      return str.split('').map((char, i) =>
        i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
      ).join('');

    case 'mock':
      // mOcKiNg TeXt - starts lowercase, alternates (opposite of sponge)
      return str.split('').map((char, i) =>
        i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      ).join('');

    case 'alternate': {
      // aLtErNaTe - alternates only on letters, ignoring spaces
      let letterIndex = 0;
      return str.split('').map(char => {
        if (/[a-zA-Z]/.test(char)) {
          const result = letterIndex % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
          letterIndex++;
          return result;
        }
        return char;
      }).join('');
    }

    case 'crazy':
      // cRaZy CaSe - pseudo-random based on char code (deterministic but looks random)
      return str.split('').map((char, i) => {
        const seed = (char.charCodeAt(0) * (i + 1)) % 3;
        return seed === 0 ? char.toLowerCase() : char.toUpperCase();
      }).join('');

    case 'random':
      // RaNdOm CaSe (actually random)
      return str.split('').map(char =>
        Math.random() > 0.5 ? char.toLowerCase() : char.toUpperCase()
      ).join('');

    // ========== New Styles ==========

    case 'hashtag':
      // #HelloWorld - PascalCase with hash prefix
      return '#' + words.map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');

    case 'acronym':
      // ASAP - first letter of each word, uppercase
      return words.map(word => word.charAt(0).toUpperCase()).join('');

    case 'rot13':
      // ROT13 cipher
      return rot13(str);

    case 'flip':
      // ʇxǝʇ uʍop ǝpᴉsdn - upside down text
      return flipText(str);

    default:
      // Unknown style - return unchanged
      return str;
  }
};

/**
 * Get list of all supported styles
 * @returns {string[]} Array of style names
 */
const getStyles = () => [...STYLES];

/**
 * Check if a style is supported
 * @param {string} style - The style to check
 * @returns {boolean} True if style is supported
 */
const isValidStyle = (style) => STYLES.includes(style);

// ESM exports
export default capstring;
export { capstring, getStyles, isValidStyle, STYLES };
