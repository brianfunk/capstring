# All styles

Try any of them live in the [playground](/). Every example below is `capstring(input, style)`.

## Case

| Style | Input | Output |
|---|---|---|
| `same` | Hello World | Hello World |
| `none` | Hello World | *(empty string)* |
| `proper` | Hello World | Hello World *(alias of same)* |
| `title` | élan vital | Élan Vital |
| `sentence` | hello. world! | Hello. World! |
| `upper` | hello world | HELLO WORLD |
| `lower` | HELLO WORLD | hello world |
| `swap` | Hello World | hELLO wORLD |

## Code

| Style | Input | Output |
|---|---|---|
| `camel` | hello world | helloWorld |
| `pascal` | hello world | HelloWorld |
| `snake` | hello world | hello_world |
| `kebab` | Crème Brûlée | crème-brûlée |
| `slug` | Crème Brûlée & Co. | creme-brulee-co |
| `constant` | hello world | HELLO_WORLD |
| `python` | hello world | HELLO_WORLD *(alias of constant)* |
| `dot` | hello world | hello.world |
| `path` | hello world | hello/world |
| `train` | hello world | Hello-World |
| `hashtag` | hello world | #HelloWorld |
| `acronym` | as soon as possible | ASAP |

All code styles share one tokenizer. Words split on whitespace, `_`, `-`, `.`, `/`, punctuation, emoji, and camelCase boundaries:

```js
capstring('XMLHttpRequest', 'kebab');    // 'xml-http-request'
capstring('getHTTPResponse2XX', 'snake'); // 'get_http_response2_xx'
capstring('__private_var__', 'camel');    // 'privateVar'
capstring("don't stop", 'snake');         // 'dont_stop'   (apostrophes dropped)
capstring('utf8 string', 'kebab');        // 'utf8-string' (letters stay with digits)
```

`kebab` keeps Unicode letters; `slug` folds them to ASCII and drops anything else.

## Fun

| Style | Input | Output |
|---|---|---|
| `reverse` | hello world | dlrow olleh |
| `sponge` | hello world | HeLlO WoRlD |
| `mock` | hello world | hElLo wOrLd |
| `alternate` | hello world | hElLo WoRlD *(letters only)* |
| `crazy` | hello world | *(deterministic pseudo-random case)* |
| `random` | hello world | *(random case, different every call)* |
| `clap` | hello world | hello 👏 world |
| `piglatin` | hello world | ellohay orldway |

## Encodings

| Style | Input | Output |
|---|---|---|
| `leet` | hello world | h3110 w0r1d |
| `rot13` | hello | uryyb |
| `morse` | SOS 1 | ... --- ... / .---- |
| `binary` | hi | 01101000 01101001 |

## Unicode art

| Style | Input | Output |
|---|---|---|
| `flip` | hello | ollǝɥ |
| `smallcaps` | hello | ʜᴇʟʟᴏ |
| `bubble` | hello | ⓗⓔⓛⓛⓞ |
| `wide` | hello | ｈｅｌｌｏ |
| `strike` | hello | h̶e̶l̶l̶o̶ |

See [behavior notes](behavior.md) for the exact rules behind `title`, `sentence`, `slug`, and the Unicode handling.
