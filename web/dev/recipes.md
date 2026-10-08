# Recipes

## Slugs for URLs and filenames

```js
import capstring from 'capstring';

const slug = capstring('Crème Brûlée: The Sequel!', 'slug');   // 'creme-brulee-the-sequel'
const file = `${slug}.md`;
```

`slug` is ASCII only. If you need to keep Unicode letters in a URL path, use `kebab` instead (`crème-brûlée-the-sequel`).

## Convert identifiers between conventions

```js
const toSnake = (name) => capstring(name, 'snake');
const toCamel = (name) => capstring(name, 'camel');

toSnake('XMLHttpRequest');   // 'xml_http_request'
toCamel('user_first_name');  // 'userFirstName'
toCamel('user-first-name');  // 'userFirstName'

// rename object keys
const snakeKeys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v]));
snakeKeys({ firstName: 'Ada', lastName: 'Lovelace' }); // { first_name: 'Ada', last_name: 'Lovelace' }
```

## Constants and env var names

```js
capstring('max retry count', 'constant');  // 'MAX_RETRY_COUNT'
```

## Build a style picker UI

```js
import { CATEGORIES, capstringAll } from 'capstring';

const all = capstringAll(userInput);
for (const [category, styles] of Object.entries(CATEGORIES)) {
  renderGroup(category, styles.map((s) => ({ style: s, output: all[s] })));
}
```

## Validate a style from user input

```js
import { isValidStyle, STYLES } from 'capstring';

const style = req.query.style;
if (!isValidStyle(style)) {
  return res.status(400).json({ error: `style must be one of ${STYLES.join(', ')}` });
}
```

Or let the library throw for you:

```js
capstring(text, style, { strict: true }); // RangeError on an unknown style
```

## Chain styles

```js
const pipeline = ['lower', 'title', 'kebab'];
pipeline.reduce((acc, s) => capstring(acc, s), 'HELLO WORLD'); // 'hello-world'
```

Watch out for expanding styles like `binary` and `morse` in long chains; each step multiplies the length.

## Acronyms and hashtags from titles

```js
capstring('Portable Network Graphics', 'acronym');   // 'PNG'
capstring('throwback thursday', 'hashtag');           // '#ThrowbackThursday'
```

## Fun output in a chat bot

```js
const reply = (text) => capstring(text, pick(['sponge', 'clap', 'flip', 'bubble', 'piglatin']));
```

## Deterministic "random"

`crazy` looks random but is seeded by the text itself, so the same input always gives the same output. Use it when you need stable results in tests or snapshots; use `random` when you don't.

## Sentence case for user-generated titles

```js
capstring('hELLO. how ARE you? "fine."', 'sentence'); // 'Hello. How are you? "Fine."'
```

## Node script over a file

```bash
# one style per line for every line in a file
while read -r line; do npx capstring title "$line"; done < titles.txt
```
