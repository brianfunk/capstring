/*
   ___      ___    _____   ___ _  _
  / __|__ _| _ \__|_   _| |_ _| \| |__ _
 | (__/ _` |  _(_-< | || '_| || .` / _` |
  \___\__,_|_| /__/ |_||_||___|_|\_\__, |
                                   |___/
*/

/**
 * capstring - CaPiTaLiZe StRiNgS!
 *
 * Zero dependencies, browser-safe (no Node-only imports), Unicode and emoji aware.
 * @module capstring
 */

/**
 * Style groupings. Every style appears in exactly one category.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
const CATEGORIES = Object.freeze({
  case: Object.freeze(['same', 'none', 'proper', 'title', 'sentence', 'upper', 'lower', 'swap', 'capitalize', 'lowerfirst']),
  code: Object.freeze(['camel', 'pascal', 'snake', 'kebab', 'slug', 'constant', 'python', 'dot', 'path', 'train', 'hashtag', 'acronym', 'ada', 'cobol', 'initials']),
  fun: Object.freeze(['reverse', 'sponge', 'mock', 'alternate', 'crazy', 'random', 'clap', 'piglatin', 'spaced', 'squish', 'nato']),
  encoding: Object.freeze(['leet', 'rot13', 'morse', 'binary', 'hex', 'base64']),
  art: Object.freeze(['flip', 'smallcaps', 'bubble', 'wide', 'strike', 'bold', 'italic', 'script'])
});

/**
 * All supported styles, in canonical order (original 29 first, then additions).
 * @type {readonly string[]}
 */
const STYLES = Object.freeze([
  // Case styles
  'same', 'none', 'proper', 'title', 'sentence', 'upper', 'lower', 'swap',
  // Code styles
  'camel', 'pascal', 'snake', 'kebab', 'slug', 'constant', 'python', 'dot', 'path', 'train',
  // Fun styles
  'leet', 'reverse', 'sponge', 'mock', 'alternate', 'crazy', 'random',
  // Added in 1.0.0
  'hashtag', 'acronym', 'rot13', 'flip',
  // Added in 1.1.0
  'smallcaps', 'bubble', 'wide', 'strike', 'clap', 'morse', 'binary', 'piglatin',
  'capitalize', 'lowerfirst', 'ada', 'cobol', 'initials', 'spaced', 'squish', 'nato', 'hex', 'base64', 'bold', 'italic', 'script'
]);

// ========== Character tables ==========

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

/** Conventional leetspeak substitutions (ASCII only, case preserved) */
const LEET_MAP = {
  'a': '4', 'b': '8', 'e': '3', 'g': '9', 'i': '1', 'l': '1', 'o': '0', 's': '5', 't': '7', 'z': '2'
};

/** Unicode small capitals for a-z */
const SMALLCAPS = Array.from('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ');
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** International Morse code */
const MORSE_MAP = {
  'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.',
  'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.',
  'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-',
  'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};

/** NATO phonetic alphabet */
const NATO_MAP = {
  'a': 'Alfa', 'b': 'Bravo', 'c': 'Charlie', 'd': 'Delta', 'e': 'Echo', 'f': 'Foxtrot', 'g': 'Golf',
  'h': 'Hotel', 'i': 'India', 'j': 'Juliett', 'k': 'Kilo', 'l': 'Lima', 'm': 'Mike', 'n': 'November',
  'o': 'Oscar', 'p': 'Papa', 'q': 'Quebec', 'r': 'Romeo', 's': 'Sierra', 't': 'Tango', 'u': 'Uniform',
  'v': 'Victor', 'w': 'Whiskey', 'x': 'X-ray', 'y': 'Yankee', 'z': 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine'
};

/** Mathematical alphanumeric blocks: [A-Z start, a-z start, 0-9 start or null] */
const MATH_FONTS = {
  bold: [0x1D5D4, 0x1D5EE, 0x1D7EC],   // sans-serif bold
  italic: [0x1D608, 0x1D622, null],    // sans-serif italic
  script: [0x1D4D0, 0x1D4EA, null]     // bold script (the plain script block has gaps)
};

/** Latin letters with no Unicode decomposition, folded for slugs */
const SLUG_FOLD = {
  'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ø': 'o', 'đ': 'd', 'ł': 'l', 'þ': 'th', 'ð': 'd'
};

// ========== Helpers ==========

/** Grapheme segmenter (created once). Available in Node 16+ and all modern browsers. */
const SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Split a string into Unicode code points (emoji-safe, unlike `split('')`)
 * @param {string} str - Input string
 * @returns {string[]} Code points
 */
const chars = (str) => Array.from(str);

/**
 * Split a string into grapheme clusters (keeps combined accents, ZWJ emoji, flags intact)
 * @param {string} str - Input string
 * @returns {string[]} Grapheme clusters
 */
const graphemes = (str) => Array.from(SEGMENTER.segment(str), (s) => s.segment);

/**
 * Test whether a single character is a Unicode letter
 * @param {string} ch - A single code point
 * @returns {boolean} True if `ch` is a letter in any script
 */
const isLetter = (ch) => /\p{L}/u.test(ch);

/**
 * Uppercase the first code point of a word, leave the rest as-is
 * @param {string} word - Input word
 * @returns {string} Capitalized word
 */
const capitalize = (word) => {
  const [first = '', ...rest] = chars(word);
  return first.toUpperCase() + rest.join('');
};

/**
 * Tokenize a string into lowercase words for the code styles.
 *
 * Rules, in order:
 * 1. Apostrophes are removed (`don't` -> `dont`).
 * 2. A boundary is inserted between a lowercase letter or digit and an uppercase letter
 *    (`helloWorld`, `version2Beta`), and between an uppercase run and a capitalized word
 *    (`XMLHttp` -> `XML Http`).
 * 3. Any run of characters that is not a letter, digit, or combining mark becomes a single
 *    separator (whitespace, `_`, `-`, `.`, `/`, punctuation, emoji). Input is NFC-normalized
 *    first so decomposed accents stay attached to their letters.
 * 4. Letters are not split from digits (`utf8`, `mp3` stay intact).
 *
 * @param {string} str - Input string
 * @returns {string[]} Lowercase words (empty when the input has no letters or digits)
 *
 * @example
 * toWords('XMLHttpRequest') // ['xml', 'http', 'request']
 * toWords('__private_var__') // ['private', 'var']
 */
const toWords = (str) => str
  .normalize('NFC')
  .replace(/[0-9#*]\uFE0F?\u20E3/gu, ' ') // keycap emoji (1️⃣, #️⃣) are emoji, not digits
  .replace(/['’]/gu, '')
  .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
  .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
  .replace(/(^|[^\p{L}\p{N}\p{M}])\p{M}+/gu, '$1') // drop marks orphaned by a removed base (❤️ -> U+FE0F)
  .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
  .trim()
  .split(' ')
  .filter(Boolean)
  .map((w) => w.toLowerCase());

/**
 * Build a URL slug: tokenize like the other code styles (so camelCase splits), fold
 * diacritics, lowercase, keep only `a-z0-9`, single hyphens.
 * Scripts that cannot be folded to ASCII (e.g. CJK, Cyrillic) are dropped.
 * @param {string} str - Input string
 * @returns {string} Slug (may be empty)
 */
const slugify = (str) => toWords(str)
  .join(' ')
  .normalize('NFKD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[ßæœøđłþð]/g, (ch) => SLUG_FOLD[ch])
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/**
 * Alternate the case of letters, starting with the given case
 * @param {string} str - Input string
 * @param {boolean} upperFirst - Whether position 0 is uppercase
 * @returns {string} Alternating-case string
 */
const alternateByPosition = (str, upperFirst) => chars(str).map((ch, i) =>
  (i % 2 === 0) === upperFirst ? ch.toUpperCase() : ch.toLowerCase()
).join('');

/**
 * Apply ROT13 cipher to a string
 * @param {string} str - Input string
 * @returns {string} ROT13 encoded string
 */
const rot13 = (str) => str.replace(/[a-zA-Z]/g, (char) => {
  const code = char.charCodeAt(0);
  const base = code < 97 ? 65 : 97;
  return String.fromCharCode(((code - base + 13) % 26) + base);
});

/**
 * Flip text upside down (reversed, grapheme-safe)
 * @param {string} str - Input string
 * @returns {string} Flipped string
 */
const flipText = (str) => graphemes(str).reverse().map((g) => FLIP_MAP[g] || g).join('');

/**
 * Shift single-code-point graphemes by a code point offset, used by bubble and fullwidth styles.
 * Multi-code-point graphemes (keycap emoji like 1️⃣, flags, ZWJ sequences) pass through whole.
 * @param {string} str - Input string
 * @param {(cp: number) => number|undefined} shift - Returns the new code point, or undefined to keep
 * @returns {string} Transformed string
 */
const mapCodePoints = (str, shift) => graphemes(str).map((g) => {
  if (chars(g).length !== 1) return g;
  const mapped = shift(g.codePointAt(0));
  return mapped === undefined ? g : String.fromCodePoint(mapped);
}).join('');

/**
 * Map ASCII letters and digits into a Mathematical Alphanumeric block
 * @param {[number, number, number|null]} font - Block start code points for A, a, 0
 * @returns {(cp: number) => number|undefined} Shift function for mapCodePoints
 */
const toMathFont = ([upper, lower, digit]) => (cp) => {
  if (cp >= 65 && cp <= 90) return upper + (cp - 65);
  if (cp >= 97 && cp <= 122) return lower + (cp - 97);
  if (digit !== null && cp >= 48 && cp <= 57) return digit + (cp - 48);
  return undefined;
};

/**
 * Change the case of only the first code point
 * @param {string} str - Input string
 * @param {boolean} upper - Uppercase (true) or lowercase (false)
 * @returns {string} String with the first code point changed
 */
const firstCase = (str, upper) => {
  const [first, ...rest] = chars(str);
  return (upper ? first.toUpperCase() : first.toLowerCase()) + rest.join('');
};

/**
 * Base64 of the UTF-8 bytes (works in Node and browsers, no Buffer)
 * @param {string} str - Input string
 * @returns {string} Base64
 */
const toBase64 = (str) => btoa(Array.from(new TextEncoder().encode(str), (b) => String.fromCharCode(b)).join(''));

/**
 * Enclosed alphanumerics: Ⓐ-Ⓩ ⓐ-ⓩ ① -⑨ ⓪
 * @param {number} cp - Code point
 * @returns {number|undefined} Bubble code point
 */
const toBubble = (cp) => {
  if (cp >= 97 && cp <= 122) return 0x24D0 + (cp - 97);
  if (cp >= 65 && cp <= 90) return 0x24B6 + (cp - 65);
  if (cp >= 49 && cp <= 57) return 0x2460 + (cp - 49);
  if (cp === 48) return 0x24EA;
  return undefined;
};

/**
 * Fullwidth forms: ! through ~ shift by 0xFEE0, space becomes ideographic space
 * @param {number} cp - Code point
 * @returns {number|undefined} Fullwidth code point
 */
const toWide = (cp) => {
  if (cp === 32) return 0x3000;
  if (cp >= 0x21 && cp <= 0x7E) return cp + 0xFEE0;
  return undefined;
};

/**
 * Convert one English word to Pig Latin, preserving an initial capital
 * @param {string} word - A run of ASCII letters
 * @returns {string} Pig Latin word
 */
const pigLatinWord = (word) => {
  const lower = word.toLowerCase();
  const wasCapitalized = word[0] !== lower[0];
  let result;
  if (/^[aeiou]/.test(lower)) {
    result = lower + 'way';
  } else {
    // Leading consonant cluster: `qu` moves as a unit; `y` is a vowel unless it leads the word
    const cluster = /^([^aeiouy]*qu|[^aeiouy]+|[^aeiou]+)/.exec(lower)[0];
    result = lower.slice(cluster.length) + cluster + 'ay';
  }
  return wasCapitalized ? capitalize(result) : result;
};

/**
 * Encode a string as space-separated 8-bit binary of its UTF-8 bytes
 * @param {string} str - Input string
 * @returns {string} Binary string
 */
const toBinary = (str) => Array.from(new TextEncoder().encode(str), (b) => b.toString(2).padStart(8, '0')).join(' ');

/**
 * Encode a string as International Morse code. Letters are separated by a space,
 * words by ` / `. Characters with no Morse equivalent are dropped.
 * @param {string} str - Input string
 * @returns {string} Morse string
 */
const toMorse = (str) => str.toLowerCase().trim().split(/\s+/).map((word) =>
  chars(word).map((ch) => MORSE_MAP[ch]).filter(Boolean).join(' ')
).filter(Boolean).join(' / ');

// ========== Main ==========

/**
 * Build the TypeError thrown in strict mode for non-string input
 * @param {*} value - The offending value
 * @returns {TypeError} Error to throw
 */
const notAString = (value) => new TypeError(`capstring: expected a string, got ${value === null ? 'null' : typeof value}`);

/**
 * @typedef {Object} CapstringOptions
 * @property {boolean} [strict=false] - Throw `TypeError` for non-string input and
 *   `RangeError` for an unknown style instead of returning `false` / the input unchanged.
 */

/**
 * Transform a string to the specified capitalization style
 * @param {string} str - The string to transform
 * @param {string} [style='same'] - The capitalization style (see {@link STYLES})
 * @param {CapstringOptions} [options] - Options
 * @returns {string|false} The transformed string, or `false` if the input is not a string
 *
 * @example
 * capstring('hello world', 'title') // 'Hello World'
 * capstring('XMLHttpRequest', 'kebab') // 'xml-http-request'
 * capstring('Crème Brûlée & Co.', 'slug') // 'creme-brulee-co'
 */
const capstring = (str, style = 'same', { strict = false } = {}) => {
  if (typeof str !== 'string') {
    if (strict) throw notAString(str);
    return false;
  }
  if (!STYLES.includes(style)) {
    if (strict) throw new RangeError(`capstring: unknown style "${style}". Use getStyles() to list valid styles.`);
    return str;
  }
  if (str === '') return '';

  // Only the code styles tokenize, so do it lazily (capstringAll calls this once per style)
  let tokens;
  const words = () => (tokens ??= toWords(str));

  switch (style) {
    // ========== Case Styles ==========

    case 'same':
    case 'proper':
      // Return unchanged (proper is a historical alias)
      return str;

    case 'none':
      // Return empty string
      return '';

    case 'title':
      // Title Case - capitalize each word; hyphens and underscores break words
      return str.replace(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’]*/gu, (word) =>
        capitalize(word.toLowerCase())
      );

    case 'sentence':
      // Sentence case - capitalize the first letter and the first letter after . ! ? (quotes and brackets, ASCII or typographic, may sit in between)
      return str.toLowerCase().replace(/(^["'“‘«([]*|[.!?]+["'”’»)\]]*\s+["'“‘«([]*)(\p{L})/gu, (_, lead, letter) =>
        lead + letter.toUpperCase()
      );

    case 'upper':
      return str.toUpperCase();

    case 'lower':
      return str.toLowerCase();

    case 'swap':
      // sWAP cASE - invert each character's case
      return chars(str).map((ch) => {
        const upper = ch.toUpperCase();
        return ch === upper ? ch.toLowerCase() : upper;
      }).join('');

    case 'capitalize':
      // Capitalize the first character only, leave the rest untouched
      return firstCase(str, true);

    case 'lowerfirst':
      // lowercase the first character only, leave the rest untouched
      return firstCase(str, false);

    // ========== Code Styles ==========

    case 'camel':
      // camelCase
      return words().map((word, i) => (i === 0 ? word : capitalize(word))).join('');

    case 'pascal':
      // PascalCase
      return words().map(capitalize).join('');

    case 'snake':
      // snake_case
      return words().join('_');

    case 'kebab':
      // kebab-case (Unicode letters preserved)
      return words().join('-');

    case 'slug':
      // url-slug (ASCII only, diacritics folded)
      return slugify(str);

    case 'constant':
    case 'python':
      // CONSTANT_CASE (python is a historical alias)
      return words().join('_').toUpperCase();

    case 'dot':
      // dot.case
      return words().join('.');

    case 'path':
      // path/case
      return words().join('/');

    case 'train':
      // Train-Case
      return words().map(capitalize).join('-');

    case 'hashtag':
      // #HashTag
      return words().length ? '#' + words().map(capitalize).join('') : '';

    case 'acronym':
      // ASAP - first letter of each word, uppercase
      return words().map((word) => chars(word)[0]).join('').toUpperCase();

    case 'ada':
      // Ada_Case
      return words().map(capitalize).join('_');

    case 'cobol':
      // COBOL-CASE
      return words().join('-').toUpperCase();

    case 'initials':
      // H.W. - first letter of each word with periods
      return words().map((word) => `${chars(word)[0].toUpperCase()}.`).join('');

    // ========== Fun Styles ==========

    case 'reverse':
      // esreveR (grapheme-safe)
      return graphemes(str).reverse().join('');

    case 'sponge':
      // SpOnGeBoB - starts uppercase, alternates by position
      return alternateByPosition(str, true);

    case 'mock':
      // mOcKiNg - starts lowercase, alternates by position
      return alternateByPosition(str, false);

    case 'alternate': {
      // aLtErNaTe - alternates on letters only, ignoring spaces and punctuation
      let letterIndex = 0;
      return chars(str).map((ch) => {
        if (!isLetter(ch)) return ch;
        return letterIndex++ % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase();
      }).join('');
    }

    case 'crazy':
      // cRaZy - deterministic pseudo-random case seeded by code point and position
      return chars(str).map((ch, i) => (
        (ch.codePointAt(0) * (i + 1)) % 3 === 0 ? ch.toLowerCase() : ch.toUpperCase()
      )).join('');

    case 'random':
      // RaNdOm - actually random, different on every call
      return chars(str).map((ch) => (Math.random() > 0.5 ? ch.toLowerCase() : ch.toUpperCase())).join('');

    case 'clap':
      // hello 👏 world
      return str.trim().split(/\s+/).join(' 👏 ');

    case 'piglatin':
      // Igpay Atinlay - English words only, everything else untouched
      return str.replace(/[A-Za-z]+/g, pigLatinWord);

    case 'spaced':
      // s p a c e d - one space between graphemes, two between words
      return str.trim().split(/\s+/).map((word) => graphemes(word).join(' ')).join('  ');

    case 'squish':
      // squished - all whitespace removed
      return str.replace(/\s+/gu, '');

    case 'nato':
      // Hotel Echo Lima Lima Oscar - NATO phonetic, words separated by " / "
      return str.toLowerCase().trim().split(/\s+/).map((word) =>
        chars(word).map((ch) => NATO_MAP[ch]).filter(Boolean).join(' ')
      ).filter(Boolean).join(' / ');

    // ========== Encodings ==========

    case 'leet':
      // 1337 - conventional ASCII substitutions, case preserved
      return chars(str).map((ch) => LEET_MAP[ch.toLowerCase()] ?? ch).join('');

    case 'rot13':
      return rot13(str);

    case 'morse':
      return toMorse(str);

    case 'binary':
      return toBinary(str);

    case 'hex':
      // UTF-8 bytes as lowercase hex pairs
      return Array.from(new TextEncoder().encode(str), (b) => b.toString(16).padStart(2, '0')).join(' ');

    case 'base64':
      return toBase64(str);

    // ========== Unicode Art ==========

    case 'flip':
      // ʇxǝʇ uʍop ǝpᴉsdn
      return flipText(str);

    case 'smallcaps':
      // sᴍᴀʟʟ ᴄᴀᴘs
      return chars(str).map((ch) => {
        const idx = ALPHABET.indexOf(ch.toLowerCase());
        return idx === -1 ? ch : SMALLCAPS[idx];
      }).join('');

    case 'bubble':
      // ⓑⓤⓑⓑⓛⓔ
      return mapCodePoints(str, toBubble);

    case 'wide':
      // ｗｉｄｅ
      return mapCodePoints(str, toWide);

    case 'strike':
      // s̶t̶r̶i̶k̶e̶
      return graphemes(str).map((g) => (/^\s+$/u.test(g) ? g : g + '\u0336')).join('');

    case 'bold':
      // 𝗯𝗼𝗹𝗱 (sans-serif bold)
      return mapCodePoints(str, toMathFont(MATH_FONTS.bold));

    case 'italic':
      // 𝘪𝘵𝘢𝘭𝘪𝘤 (sans-serif italic)
      return mapCodePoints(str, toMathFont(MATH_FONTS.italic));

    case 'script':
      // 𝓼𝓬𝓻𝓲𝓹𝓽 (bold script)
      return mapCodePoints(str, toMathFont(MATH_FONTS.script));

    /* c8 ignore next 2 -- unreachable: style validated above */
    default:
      return str;
  }
};

/**
 * Transform a string into every style at once
 * @param {string} str - The string to transform
 * @param {CapstringOptions} [options] - Options
 * @returns {Record<string, string>|false} Map of style name to output, in {@link STYLES} order,
 *   or `false` if the input is not a string
 *
 * @example
 * capstringAll('hi').kebab // 'hi'
 */
const capstringAll = (str, options = {}) => {
  if (typeof str !== 'string') {
    if (options.strict) throw notAString(str);
    return false;
  }
  return Object.fromEntries(STYLES.map((s) => [s, capstring(str, s, options)]));
};

/**
 * Get list of all supported styles
 * @returns {string[]} A fresh copy of the style names
 */
const getStyles = () => [...STYLES];

/**
 * Check if a style is supported
 * @param {*} style - The style to check
 * @returns {boolean} True if style is supported
 */
const isValidStyle = (style) => STYLES.includes(style);

// ESM exports
export default capstring;
export { capstring, capstringAll, getStyles, isValidStyle, STYLES, CATEGORIES };
