/**
 * Per-style documentation for the developer docs page. Outputs are never written here;
 * the page computes them live with the library so every example is correct by construction.
 * `examples` lists inputs; the first is always "hello world".
 */
export const CATEGORY_DOCS = {
  case: {
    title: 'Case',
    intro: 'Change letter case without touching word boundaries. Spaces, punctuation, and digits pass through.'
  },
  code: {
    title: 'Code conventions',
    intro: 'Identifier styles for code, URLs, and files. All of them share one tokenizer: words split on whitespace, underscores, hyphens, dots, slashes, punctuation, emoji, and camelCase boundaries, and apostrophes are dropped. See the tokenizer rules under Behavior.'
  },
  fun: {
    title: 'Fun',
    intro: 'Styles that exist because they are fun. Deterministic unless the name says random.'
  },
  encoding: {
    title: 'Encodings',
    intro: 'Byte and cipher representations of the text. All are reversible by the obvious inverse.'
  },
  art: {
    title: 'Unicode art',
    intro: 'Lookalike characters from other Unicode blocks. They paste anywhere plain text goes: chat, bios, commit messages. Characters without a lookalike pass through unchanged.'
  }
};

export const STYLE_DOCS = {
  same: {
    summary: 'Returns the input unchanged.',
    detail: 'The default style. Useful as a no-op when the style name comes from configuration or user input.',
    examples: ['hello world', 'Hello World'],
    notes: ['An unknown style name also returns the input unchanged unless strict mode is on.']
  },
  none: {
    summary: 'Returns an empty string.',
    detail: 'Exists for symmetry with same: a style that produces nothing, handy as a placeholder in style pickers.',
    examples: ['hello world'],
    notes: ['Through the HTTP API the output field is "" with status 200, not an error.']
  },
  proper: {
    summary: 'Returns the input unchanged.',
    detail: 'Behaves exactly like same.',
    examples: ['hello world']
  },
  title: {
    summary: 'Capitalizes the first letter of every word and lowercases the rest.',
    detail: 'Every word is capitalized, including small words like "of" and "the"; the rule is deliberately predictable rather than editorial. Hyphens and underscores break words. Apostrophes stay inside words. Works on any script that has case.',
    examples: ['hello world', 'HELLO WORLD', "don't stop-me now", 'hello_world', 'élan vital', '3d printing'],
    notes: ['Words that start with a digit are left alone (3d stays 3d).']
  },
  sentence: {
    summary: 'Lowercases everything, then capitalizes the first letter and the first letter after . ! ?',
    detail: 'A sentence boundary is punctuation followed by whitespace. Quotes and brackets, ASCII or typographic, may sit on either side of the boundary. A period with no following space does not count, so decimals and abbreviations survive.',
    examples: ['hello world', 'HELLO WORLD', 'hello. world! how? ok', 'hello. "world" (yes)', '3.14 is pi', 'see e.g.this'],
    notes: ['Only the first letter after a boundary is touched; nothing else is capitalized.']
  },
  upper: {
    summary: 'UPPERCASES every letter.',
    detail: 'Uses the Unicode uppercase mapping, so ß becomes SS and accented letters keep their accents.',
    examples: ['hello world', 'straße', 'élan']
  },
  lower: {
    summary: 'lowercases every letter.',
    detail: 'Uses the Unicode lowercase mapping.',
    examples: ['hello world', 'HELLO WORLD', 'ÉLAN']
  },
  swap: {
    summary: 'Inverts the case of every letter.',
    detail: 'Uppercase becomes lowercase and vice versa. Characters without case pass through.',
    examples: ['hello world', 'Hello World', 'ÀbÇ 😀 1']
  },
  capitalize: {
    summary: 'Uppercases the first character only; everything else is untouched.',
    detail: 'Unlike title, it does not lowercase the rest and does not look at other words. Unlike sentence, it never changes anything after the first character.',
    examples: ['hello world', 'hELLO wORLD', 'élan vital', '😀 hi'],
    notes: ['If the first character has no case (a digit, an emoji) nothing changes.']
  },
  lowerfirst: {
    summary: 'Lowercases the first character only; everything else is untouched.',
    detail: 'The inverse of capitalize. Handy for turning a PascalCase identifier into camelCase without re-tokenizing.',
    examples: ['hello world', 'Hello World', 'HELLO', 'XMLHttpRequest']
  },
  camel: {
    summary: 'camelCase: first word lowercase, every following word capitalized, no separators.',
    detail: 'The usual JavaScript variable style. Acronyms are normalized (XMLHttpRequest becomes xmlHttpRequest), which keeps round trips consistent.',
    examples: ['hello world', 'Hello World Foo', 'XMLHttpRequest hello_world', 'user-first-name', '__private_var__']
  },
  pascal: {
    summary: 'PascalCase: every word capitalized, no separators.',
    detail: 'Class names in most languages.',
    examples: ['hello world', 'XMLHttpRequest', 'user_first_name']
  },
  snake: {
    summary: 'snake_case: lowercase words joined by underscores.',
    detail: 'Python, Ruby, Rust, SQL columns.',
    examples: ['hello world', 'Hello World', 'XMLHttpRequest', 'getHTTPResponse2XX', 'utf8 string']
  },
  kebab: {
    summary: 'kebab-case: lowercase words joined by hyphens, Unicode letters preserved.',
    detail: 'CSS classes, CLI flags, file names. Unlike slug it keeps accented and non-Latin letters.',
    examples: ['hello world', 'helloWorld', 'Crème Brûlée', 'Привет Мир']
  },
  slug: {
    summary: 'URL slug: ASCII only, diacritics folded, everything else becomes a hyphen.',
    detail: 'Runs the tokenizer, then NFKD-normalizes and strips combining marks, maps ß æ œ ø đ ł þ ð to ASCII, lowercases, and keeps only a-z0-9 joined by single hyphens. Scripts with no ASCII folding (CJK, Cyrillic) produce an empty slug; use kebab to keep them.',
    examples: ['hello world', 'Crème Brûlée & Co.', 'XMLHttpRequest v2', "don't", 'straße', '日本語'],
    notes: ['Leading and trailing hyphens are trimmed and runs collapse to one.']
  },
  constant: {
    summary: 'CONSTANT_CASE: uppercase words joined by underscores.',
    detail: 'Also called SCREAMING_SNAKE_CASE. Environment variables and compile-time constants.',
    examples: ['hello world', 'helloWorld', 'max retry count']
  },
  python: {
    summary: 'CONSTANT_CASE.',
    detail: 'Behaves exactly like constant.',
    examples: ['hello world']
  },
  dot: {
    summary: 'dot.case: lowercase words joined by periods.',
    detail: 'Property paths, i18n keys, Java packages.',
    examples: ['hello world', 'userFirstName']
  },
  path: {
    summary: 'path/case: lowercase words joined by slashes.',
    detail: 'File and URL paths.',
    examples: ['hello world', 'userFirstName']
  },
  train: {
    summary: 'Train-Case: capitalized words joined by hyphens.',
    detail: 'HTTP header names.',
    examples: ['hello world', 'content type', 'XMLHttpRequest']
  },
  hashtag: {
    summary: '#HashTag: PascalCase with a leading #.',
    detail: 'Text with no words returns an empty string rather than a lone #.',
    examples: ['hello world', 'throwback thursday', '!!!']
  },
  acronym: {
    summary: 'First letter of every word, uppercased, joined.',
    detail: 'Works on any script with case.',
    examples: ['hello world', 'as soon as possible', 'XMLHttpRequest', 'élan vital']
  },
  ada: {
    summary: 'Ada_Case: capitalized words joined by underscores.',
    detail: 'Ada and some SQL dialects.',
    examples: ['hello world', 'XMLHttpRequest']
  },
  cobol: {
    summary: 'COBOL-CASE: uppercase words joined by hyphens.',
    detail: 'COBOL identifiers and some config keys.',
    examples: ['hello world', 'helloWorld']
  },
  initials: {
    summary: 'First letter of every word, uppercased, each followed by a period.',
    detail: 'Like acronym but punctuated.',
    examples: ['hello world', 'as soon as possible', '!!!']
  },
  reverse: {
    summary: 'Reverses the text.',
    detail: 'Grapheme-aware: accents, flags, and emoji sequences stay attached to their base.',
    examples: ['hello world', 'héllo 😀 wörld', '🇺🇸🇫🇷']
  },
  sponge: {
    summary: 'AlTeRnAtInG cAsE starting uppercase, by position.',
    detail: 'Every character counts, including spaces, so the pattern can look to skip after a space.',
    examples: ['hello world', 'a😀b']
  },
  mock: {
    summary: 'aLtErNaTiNg CaSe starting lowercase, by position.',
    detail: 'The mirror of sponge.',
    examples: ['hello world']
  },
  alternate: {
    summary: 'Alternating case that counts letters only.',
    detail: 'Spaces, digits, and punctuation do not advance the pattern, so every word starts where the last letter left off. Unicode letters count.',
    examples: ['hello world', 'àbç déf', 'a 😀 b']
  },
  crazy: {
    summary: 'Pseudo-random case, seeded by the text.',
    detail: 'Looks random but the same input always gives the same output, so it is safe in snapshots and cacheable through the API.',
    examples: ['hello world']
  },
  random: {
    summary: 'Random case. Different every call.',
    detail: 'The only non-deterministic style. The API marks responses that include it as uncacheable.',
    examples: ['hello world']
  },
  clap: {
    summary: 'Words 👏 joined 👏 by 👏 clap 👏 emoji.',
    detail: 'Leading and trailing whitespace is trimmed; a single word is returned as is.',
    examples: ['hello world', 'single', '  Hello   big  World ']
  },
  piglatin: {
    summary: 'Pig Latin, English rules.',
    detail: 'Vowel-initial words get "way"; otherwise the leading consonant cluster moves to the end with "ay". "qu" moves as a unit even after other consonants, "y" counts as a vowel unless it starts the word, and an initial capital is preserved. Only runs of A-Z are touched.',
    examples: ['hello world', 'apple', 'string', 'squeal', 'yes my rhythm', 'Hello, World!']
  },
  spaced: {
    summary: 'O n e space between characters, two between words.',
    detail: 'Grapheme-aware, so a flag or an accented letter stays together.',
    examples: ['hello world', '🇺🇸 ok']
  },
  squish: {
    summary: 'Removes all whitespace.',
    detail: 'Tabs and newlines included. Case is untouched.',
    examples: ['hello world', ' a\tb\nc ']
  },
  nato: {
    summary: 'NATO phonetic alphabet, words separated by " / ".',
    detail: 'Letters and digits only; anything else is dropped. Case-insensitive.',
    examples: ['hello world', 'SOS 1', 'x-ray?']
  },
  leet: {
    summary: '1337: conventional ASCII substitutions, case preserved.',
    detail: 'a→4 b→8 e→3 g→9 i→1 l→1 o→0 s→5 t→7 z→2. Everything else is untouched.',
    examples: ['hello world', 'hello WORLD', 'abegilostz']
  },
  rot13: {
    summary: 'ROT13 cipher on A-Z and a-z.',
    detail: 'Applying it twice gives the original. Non-ASCII letters pass through.',
    examples: ['hello world', 'Hello World']
  },
  morse: {
    summary: 'International Morse code.',
    detail: 'Letters, digits, and common punctuation. Letters are separated by a space and words by " / ". Unmapped characters are dropped.',
    examples: ['hello world', 'SOS 1', 'hi!']
  },
  binary: {
    summary: 'UTF-8 bytes as space-separated 8-bit groups.',
    detail: 'Multi-byte characters produce multiple groups: é is two, 😀 is four.',
    examples: ['hello world', 'hi', 'é', '😀']
  },
  hex: {
    summary: 'UTF-8 bytes as space-separated lowercase hex pairs.',
    detail: 'Same bytes as binary, shorter.',
    examples: ['hello world', 'é', '😀']
  },
  base64: {
    summary: 'Base64 of the UTF-8 bytes.',
    detail: 'Standard alphabet with = padding, the same output as btoa on a UTF-8 encoded string.',
    examples: ['hello world', 'é😀']
  },
  flip: {
    summary: 'Upside-down text, reversed.',
    detail: 'Each character is swapped for its upside-down lookalike and the whole string is reversed so it reads correctly when rotated 180°. Grapheme-aware.',
    examples: ['hello world', 'Hello World!', '(a)']
  },
  smallcaps: {
    summary: 'sᴍᴀʟʟ ᴄᴀᴘs using Unicode small capital letters.',
    detail: 'Maps a-z and A-Z. Digits and other characters pass through.',
    examples: ['hello world', 'Hello', 'A1 Ü 😀']
  },
  bubble: {
    summary: 'ⓑⓤⓑⓑⓛⓔ letters and digits from the enclosed alphanumerics block.',
    detail: 'Maps a-z, A-Z, and 0-9. Keycap emoji and other multi-code-point characters stay whole.',
    examples: ['hello world', 'Hi 5', 'az AZ 09']
  },
  wide: {
    summary: 'ｆｕｌｌｗｉｄｔｈ characters.',
    detail: 'Every printable ASCII character maps to its fullwidth form and spaces become ideographic spaces.',
    examples: ['hello world', 'Hi!', '~Ü😀']
  },
  strike: {
    summary: 's̶t̶r̶i̶k̶e̶t̶h̶r̶o̶u̶g̶h̶ with a combining long stroke overlay.',
    detail: 'A U+0336 is added after every non-whitespace grapheme, so emoji sequences are struck as a unit.',
    examples: ['hello world', '👨‍👩‍👧🇺🇸']
  },
  bold: {
    summary: '𝗕𝗼𝗹𝗱 sans-serif from the Mathematical Alphanumeric block.',
    detail: 'Maps A-Z, a-z, and 0-9. Other characters pass through.',
    examples: ['hello world', 'Az 09 é!']
  },
  italic: {
    summary: '𝘐𝘵𝘢𝘭𝘪𝘤 sans-serif from the Mathematical Alphanumeric block.',
    detail: 'Maps A-Z and a-z; the block has no digits, so digits pass through.',
    examples: ['hello world', 'Az 09']
  },
  script: {
    summary: '𝓢𝓬𝓻𝓲𝓹𝓽 (bold script) from the Mathematical Alphanumeric block.',
    detail: 'Maps A-Z and a-z. The bold variant is used because the regular script block has gaps.',
    examples: ['hello world', 'Az 09']
  }
};
