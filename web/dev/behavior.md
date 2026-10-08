# Behavior notes

The exact rules behind the styles that have rules.

## Unicode

- Every style iterates **code points**, never UTF-16 code units, so emoji are never split.
- `reverse`, `flip`, `strike`, `bubble`, and `wide` iterate **grapheme clusters**, so combining accents (`é`), ZWJ sequences (👨‍👩‍👧), flags (🇺🇸), and keycaps (1️⃣) stay intact.
- Grapheme segmentation uses `Intl.Segmenter`, available in Node 16+ and all modern browsers.
- The tokenizer NFC-normalizes input first, so decomposed and precomposed accents behave the same.

## Tokenizer (all code styles)

1. Keycap emoji and apostrophes are removed (`don't` → `dont`).
2. A boundary is inserted between a lowercase letter or digit and an uppercase letter (`helloWorld`, `version2Beta`), and between an uppercase run and a capitalized word (`XMLHttp` → `XML Http`).
3. Any run of characters that is not a letter, digit, or combining mark becomes a separator.
4. Letters are **not** split from digits: `utf8`, `mp3`, `h264` stay whole.

| Input | Words |
|---|---|
| `XMLHttpRequest` | xml, http, request |
| `getHTTPResponse2XX` | get, http, response2, xx |
| `__private_var__` | private, var |
| `iPhone12 pro` | i, phone12, pro |
| `Crème Brûlée` | crème, brûlée |
| `!!!` | *(none)* |

When there are no words, every code style returns `''` (including `hashtag`, which does not return a lone `#`).

## `title`

Capitalizes the first letter of every word and lowercases the rest. Hyphens and underscores break words (`stop-me` → `Stop-Me`, `hello_world` → `Hello_World`). Apostrophes stay inside words (`don't` → `Don't`). Small words like "of" and "the" are capitalized too; the rule is deliberately predictable rather than editorial.

## `sentence`

Lowercases everything, then capitalizes the first letter and any letter that follows `.`, `!`, or `?` plus whitespace. Quotes and brackets, ASCII or typographic, may sit on either side of the boundary: `hello. "world"` → `Hello. "World"`. A period without a following space does not count, so `3.14 is pi` and `e.g.this` are left alone.

## `slug`

Runs the tokenizer, then NFKD-normalizes and strips combining marks, maps `ß → ss`, `æ → ae`, `œ → oe`, `ø → o`, `đ → d`, `ł → l`, `þ → th`, `ð → d`, lowercases, and keeps only `a-z0-9` joined by single hyphens. Scripts with no ASCII folding (CJK, Cyrillic) produce an empty slug; use `kebab` to keep them.

## `leet`

Conventional ASCII map, case preserved: `a→4 b→8 e→3 g→9 i→1 l→1 o→0 s→5 t→7 z→2`.

## `piglatin`

English rules on `[A-Za-z]+` runs only. Vowel-initial words get `way`; otherwise the leading consonant cluster moves to the end with `ay`. `qu` moves as a unit even after other consonants (`squeal` → `ealsquay`), `y` counts as a vowel unless it starts the word (`yes` → `esyay`, `my` → `ymay`). An initial capital is preserved.

## `morse` and `binary`

`morse` uses the International Morse table for letters, digits, and common punctuation; unmapped characters are dropped, letters are separated by a space and words by ` / `. `binary` emits the UTF-8 bytes of the input as space-separated 8-bit groups, so `é` is two bytes and 😀 is four.

## `random` and `crazy`

`random` is the only non-deterministic style. `crazy` is seeded by each character's code point and position, so it is stable for a given input.

## Empty and invalid input

`capstring('')` returns `''` for every style. A non-string returns `false` unless `strict` is on, in which case it throws a `TypeError`. An unknown style returns the input unchanged unless `strict` is on, in which case it throws a `RangeError`.
