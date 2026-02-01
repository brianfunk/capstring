# AI Agent Instructions for capstring

## Overview

`capstring` is a lightweight JavaScript library for text capitalization and transformation. Zero dependencies, 24+ styles.

## Quick Start

```javascript
import capstring from 'capstring';

capstring('hello world', 'title');    // 'Hello World'
capstring('hello world', 'camel');    // 'helloWorld'
capstring('hello world', 'kebab');    // 'hello-world'
capstring('hello world', 'constant'); // 'HELLO_WORLD'
```

## API

### Main Function

```javascript
capstring(str, style)
```

- `str` - String to transform
- `style` - Style name (default: 'same')
- Returns: Transformed string, or `false` if input invalid

### Helper Functions

```javascript
import { getStyles, isValidStyle, STYLES } from 'capstring';

getStyles();           // ['same', 'none', 'proper', ...]
isValidStyle('kebab'); // true
STYLES;                // Frozen array of all style names
```

## All 24 Styles

| Category | Styles |
|----------|--------|
| Case | same, none, proper, title, sentence, upper, lower, swap |
| Code | camel, pascal, snake, kebab, slug, constant, python, dot, path |
| Fun | leet, reverse, sponge, mock, alternate, crazy, random |

## Testing

```bash
npm test              # Run tests
npm run lint          # Run linter
npm run test:coverage # Coverage report
```

## Related

- **cAPIta** - REST API for capstring (https://github.com/brianfunk/cAPIta)
