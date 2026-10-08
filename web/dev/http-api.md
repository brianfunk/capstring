# HTTP API from code

Don't want a dependency, or not writing JavaScript? The same transformations are an HTTP call away.

**Base URL** `https://capstring.netlify.app/api` · no key · CORS enabled · cacheable

> Interactive reference with try-it-out for every endpoint: [API reference](/docs/) (OpenAPI 3.1, [openapi.json](/openapi.json)).

## Endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/:style/:text` | `{ input, style, output }` |
| `GET /api/all/:text` | every style at once |
| `GET /api/chain/:styles/:text` | styles applied in order, `upper+reverse` (max 10) |
| `POST /api/batch` | `{ "style": "kebab", "texts": ["a", "b"] }` (max 100) |
| `GET /api/spell/:text` | spell-corrected text and corrections, optional `?style=` |
| `GET /api/count/:text` | words, characters, characters without spaces |
| `GET /api/lorem/:count` | lorem ipsum, 1 to 1000 words, optional `?style=` |
| `GET /api/badge/:style/:text` | SVG badge for a README, `?label=` to override |
| `GET /api/styles` | style names and categories |

Text is limited to 2,000 characters (500 for spell). Use `?text=` instead of the path when your text contains slashes or ends in a format extension.

## Output formats

JSON by default. Choose another with a file extension, `?format=`, or an `Accept` header; the extension wins.

| Format | Extension | Accept | Content-Type |
|---|---|---|---|
| JSON | `.json` | `application/json` | `application/json` |
| Plain text | `.txt` | `text/plain` | `text/plain` |
| HTML | `.html` | `text/html` | `text/html` |
| XML | `.xml` | `application/xml` | `application/xml` |
| YAML | `.yaml` / `.yml` | `text/yaml` | `text/yaml` |
| CSV | `.csv` | `text/csv` | `text/csv` |
| JSONP | `.jsonp` + `?callback=` | `application/javascript` | `application/javascript` |

Errors use the same format with a matching status: `{ "error": { "code": "unknown_style", "message": "..." } }`.

## curl

```bash
curl https://capstring.netlify.app/api/title/hello%20world
# {"input":"hello world","style":"title","output":"Hello World"}

curl https://capstring.netlify.app/api/sponge/hello%20world.txt
# HeLlO WoRlD

curl -H "Accept: text/csv" https://capstring.netlify.app/api/all/hi

curl -X POST https://capstring.netlify.app/api/batch \
  -H "Content-Type: application/json" \
  -d '{"style":"slug","texts":["Crème Brûlée","Hello World"]}'
```

## JavaScript (browser or Node 18+)

```js
const res = await fetch('https://capstring.netlify.app/api/kebab/Hello%20World');
const { output } = await res.json();   // 'hello-world'

// batch
const batch = await fetch('https://capstring.netlify.app/api/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ style: 'slug', texts: ['Crème Brûlée', 'Hello World'] })
}).then((r) => r.json());
batch.results.map((r) => r.output);     // ['creme-brulee', 'hello-world']
```

## Python

```python
import requests
from urllib.parse import quote

r = requests.get(f"https://capstring.netlify.app/api/title/{quote('hello world')}")
print(r.json()["output"])  # Hello World

# plain text via Accept header
print(requests.get("https://capstring.netlify.app/api/flip/hello", headers={"Accept": "text/plain"}).text)
```

## Shell one-liners

```bash
# slugify a filename
curl -s "https://capstring.netlify.app/api/slug/$(printf '%s' "My Doc (final).pdf" | jq -sRr @uri).txt"

# spell check and title case a commit message
curl -s "https://capstring.netlify.app/api/spell/fix%20teh%20bugg?style=sentence&format=txt"
```

## README badge

```markdown
![sponge](https://capstring.netlify.app/api/badge/sponge/hello%20world)
```

![sponge](https://capstring.netlify.app/api/badge/sponge/hello%20world?label=capstring)

## Limits

| What | Limit |
|---|---|
| Text | 2,000 characters |
| Spell check text | 500 characters, 50 corrections |
| Batch | 100 texts |
| Chain | 10 styles, 20,000-character intermediate results |
| Lorem | 1,000 words |
| Badge label | 100 characters |

Deterministic responses carry `Cache-Control: public, max-age=86400`; anything involving `random` or a POST body is `no-store`.
