import { describe, it, expect } from 'vitest';
import handler, { config, RESERVED, FORMATS } from '../netlify/functions/api.js';
import { STYLES, CATEGORIES } from '../index.js';

/**
 * Call the function with a path and optional init
 * @param {string} path - Path including query
 * @param {RequestInit} [init] - Request init
 */
const call = (path, init) => handler(new Request(`http://localhost${path}`, init), {});

/** Call and parse JSON */
const json = async (path, init) => {
  const res = await call(path, init);
  return { res, body: await res.json() };
};

/** Call and read text */
const text = async (path, init) => (await call(path, init)).text();

const post = (path, body, headers = { 'Content-Type': 'application/json' }) =>
  call(path, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('api config', () => {
  it('owns /api and /api/*', () => {
    expect(config.path).toEqual(['/api', '/api/*']);
  });

  it('no style name collides with a reserved endpoint segment', () => {
    expect(RESERVED).toEqual(['styles', 'all', 'batch', 'count', 'lorem', 'spell', 'badge']);
    expect(STYLES.filter((s) => RESERVED.includes(s))).toEqual([]);
  });

  it('lists the supported formats', () => {
    expect(FORMATS).toEqual(['json', 'jsonp', 'txt', 'html', 'xml', 'yaml', 'csv', 'svg', 'png']);
  });
});

describe('GET /api', () => {
  it('describes the service', async () => {
    const { res, body } = await json('/api');
    expect(res.status).toBe(200);
    expect(body.name).toBe('capstring');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(body.formats).toEqual([...FORMATS]);
    expect(body.endpoints).toContain('POST /api/batch');
    expect(body.endpoints).toContain('GET /api/count/:text');
    expect((await json('/api/')).body.name).toBe('capstring');
  });

  it('sets CORS, cache, and Vary headers', async () => {
    const res = await call('/api');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(res.headers.get('Vary')).toBe('Accept');
  });

  it('honours txt', async () => {
    expect(await text('/api?format=txt')).toMatch(/^capstring \d+\.\d+\.\d+\nGET \/api\/styles\n/);
  });

  it('serves the Swagger reference to browsers and JSON to everyone else', async () => {
    const page = await call('/api', { headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } });
    expect(page.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(await page.text()).toContain('SwaggerUIBundle');
    expect((await call('/api/?format=html')).headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect((await call('/api', { headers: { Accept: '*/*' } })).headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect((await json('/api')).body.docs).toBe('http://localhost/api'); // derived from the request origin
  });
});

describe('GET /api/styles', () => {
  it('lists styles and categories', async () => {
    const { res, body } = await json('/api/styles');
    expect(res.status).toBe(200);
    expect(body.count).toBe(STYLES.length);
    expect(body.styles).toEqual([...STYLES]);
    expect(Object.values(body.categories).flat().sort()).toEqual([...STYLES].sort());
    expect(Object.keys(body.categories)).toEqual(Object.keys(CATEGORIES));
  });

  it('supports every format', async () => {
    expect((await text('/api/styles.txt')).split('\n')).toEqual([...STYLES]);
    expect(await text('/api/styles.xml')).toContain('<styles>\n    <style>same</style>');
    expect(await text('/api/styles.xml')).toContain('<case>\n      <item>same</item>'); // category arrays use <item>, never <cas>
    expect(await text('/api/styles.yaml')).toContain('styles:\n  - "same"');
    expect(await text('/api/styles.csv')).toMatch(/^count,styles,categories\n"50","same\|none\|/);
    expect(await text('/api/styles.html')).toContain('<th>count</th><td>50</td>');
  });

  it('rejects extra segments', async () => {
    const { res, body } = await json('/api/styles/extra');
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });
});

describe('output formats', () => {
  it('json is the default with no extension and no header', async () => {
    const res = await call('/api/title/hello%20world');
    expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(await res.json()).toEqual({ input: 'hello world', style: 'title', output: 'Hello World' });
  });

  it('selects by extension', async () => {
    expect(await text('/api/title/hello%20world.txt')).toBe('Hello World');
    expect((await call('/api/title/hello%20world.txt')).headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await text('/api/title/hello%20world.html')).toContain('<p><strong><em>Hello World</em></strong></p>');
    expect((await call('/api/title/hello.html')).headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(await text('/api/upper/hello.xml')).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<result>\n  <input>hello</input>\n  <style>upper</style>\n  <output>HELLO</output>\n</result>');
    expect((await call('/api/upper/hello.xml')).headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect(await text('/api/upper/hello.yaml')).toBe('input: "hello"\nstyle: "upper"\noutput: "HELLO"');
    expect(await text('/api/upper/hello.yml')).toBe('input: "hello"\nstyle: "upper"\noutput: "HELLO"');
    expect((await call('/api/upper/hello.yaml')).headers.get('Content-Type')).toBe('text/yaml; charset=utf-8');
    expect(await text('/api/upper/hello.csv')).toBe('input,style,output\n"hello","upper","HELLO"');
    expect((await call('/api/upper/hello.csv')).headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(await text('/api/upper/hello.JSON')).toBe('{"input":"hello","style":"upper","output":"HELLO"}');
  });

  it('images keep backslashes and collapse real line breaks', async () => {
    expect(await text('/api/same/C%3A%5Cnew.svg')).toContain('>C:\\new</text>');
    expect(await text('/api/same/a%0Ab%E2%80%A8c.svg')).toContain('>a b c</text>');
  });

  it('images cut long output at 200 characters so the canvas stays bounded', async () => {
    const svg = await text(`/api/binary/${'a'.repeat(100)}.svg`); // 100 bytes -> 899 chars of binary
    expect(svg).toMatch(/width="\d+"/);
    expect(Number(/width="(\d+)"/.exec(svg)[1])).toBeLessThan(3000);
    expect(svg).toContain('…</text>');
    const all = await text('/api/all/hello%20world.svg'); // the whole table would be thousands of chars
    expect(Number(/width="(\d+)"/.exec(all)[1])).toBeLessThan(3000);
    expect((await call(`/api/binary/${'a'.repeat(100)}.png`)).status).toBe(200);
  });

  it('svg draws fullwidth text as spaced ASCII so it renders without CJK fonts', async () => {
    const svg = await text('/api/wide/hi.svg');
    expect(svg).toContain('letter-spacing="0.6em"');
    expect(svg).toContain('>hi</text>');
  });

  it('svg renders the result as an image', async () => {
    const res = await call('/api/sponge/hello%20world.svg');
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    const svg = await res.text();
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(svg).toContain('>HeLlO WoRlD</text>');
    expect(await text('/api/same/a%3Cb.svg')).toContain('a&lt;b');
    expect(await text('/api/same/a%0Ab.svg')).toContain('>a b</text>');
    expect((await call('/api/upper/hi', { headers: { Accept: 'image/svg+xml' } })).headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    expect(await text('/api/none/hi.svg')).toContain('> </text>');
    expect(await text('/api/count/hi.svg')).toContain('words: 1');
    expect(await text('/api/nope/hi.svg')).toContain('unknown_style');
  });

  it('png renders the result as an image', async () => {
    const res = await call('/api/bold/hello%20world.png');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
    expect(bytes.length).toBeGreaterThan(500);
    expect((await call('/api/upper/hi', { headers: { Accept: 'image/png' } })).headers.get('Content-Type')).toBe('image/png');
    expect((await call('/api/nope/hi.png')).status).toBe(404);
  });

  it('selects by ?format=', async () => {
    expect(await text('/api/upper/hello?format=txt')).toBe('HELLO');
    expect(await text('/api/upper/hello?format=yml')).toContain('output: "HELLO"');
  });

  it('selects by Accept header, first recognised type wins', async () => {
    const accept = (value) => call('/api/upper/hello', { headers: { Accept: value } });
    expect(await (await accept('text/plain')).text()).toBe('HELLO');
    expect((await accept('text/html, application/json')).headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect((await accept('application/xml;q=0.9')).headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
    expect((await accept('text/csv')).headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect((await accept('application/yaml')).headers.get('Content-Type')).toBe('text/yaml; charset=utf-8');
    expect((await accept('*/*')).headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect((await accept('image/png')).headers.get('Content-Type')).toBe('image/png');
  });

  it('ignores prototype keys in the Accept header', async () => {
    for (const evil of ['constructor', '__proto__', 'toString']) {
      const res = await call('/api/upper/hi', { headers: { Accept: evil } });
      expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    }
  });

  it('extension beats ?format= beats Accept', async () => {
    const res = await call('/api/upper/hello.txt?format=xml', { headers: { Accept: 'text/html' } });
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    const res2 = await call('/api/upper/hello?format=xml', { headers: { Accept: 'text/html' } });
    expect(res2.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
  });

  it('jsonp wraps the JSON in a guarded callback', async () => {
    const res = await call('/api/upper/hello.jsonp?callback=cb');
    expect(res.headers.get('Content-Type')).toBe('application/javascript; charset=utf-8');
    expect(await res.text()).toBe('/**/ typeof cb === \'function\' && cb({"input":"hello","style":"upper","output":"HELLO"});');
    expect(await text('/api/upper/hello.jsonp')).toContain('callback(');
    expect(await text('/api/upper/hello', { headers: { Accept: 'application/javascript' } })).toContain('callback(');
  });

  it('rejects unsafe or malformed jsonp callbacks and never wraps errors', async () => {
    const { res, body } = await json('/api/upper/hello.jsonp?callback=alert(1)');
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_callback');
    for (const bad of ['.', '1foo', 'foo..bar', 'foo.', 'a'.repeat(65), 'class', 'new', 'delete.x']) {
      expect((await call(`/api/upper/hello.jsonp?callback=${bad}`)).status, bad).toBe(400);
    }
    expect(await text('/api/upper/hello.jsonp?callback=app.handlers.$done')).toContain('app.handlers.$done(');
    const err = await call('/api/nope/hello.jsonp');
    expect(err.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
  });

  it('rejects unknown formats but treats unknown extensions as text', async () => {
    expect((await json('/api/title/hi?format=pdf')).body.error.code).toBe('invalid_format');
    expect((await json('/api/upper/file.pdf')).body).toEqual({ input: 'file.pdf', style: 'upper', output: 'FILE.PDF' });
    expect((await json('/api/upper/.txt')).body.output).toBe('.TXT'); // a bare extension is text, not a format
  });

  it('?text= keeps a trailing .txt as text', async () => {
    expect((await json('/api/upper/x?text=notes.txt')).body.output).toBe('NOTES.TXT');
  });

  it('escapes HTML and XML in those formats only', async () => {
    const xss = '%3Cscript%3Ealert(1)%3C%2Fscript%3E';
    expect(await text(`/api/same/${xss}.html`)).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(await text(`/api/same/${xss}.html`)).not.toContain('<script>');
    expect(await text(`/api/same/${xss}.xml`)).toContain('&lt;script&gt;');
    expect(await text(`/api/same/${xss}.txt`)).toBe('<script>alert(1)</script>');
    expect((await json(`/api/same/${xss}`)).body.output).toBe('<script>alert(1)</script>');
    expect(await text('/api/same/a%22b%26c%27d.html')).toContain('a&quot;b&amp;c&#39;d');
  });

  it('csv and yaml escape their own delimiters', async () => {
    expect(await text('/api/same/say%20%22hi%22%2C%20ok.csv')).toBe('input,style,output\n"say ""hi"", ok","same","say ""hi"", ok"');
    expect(await text('/api/same/line%0Abreak.yaml')).toContain('output: "line\\nbreak"');
  });

  it('supports pretty JSON', async () => {
    expect(await text('/api/upper/hi?pretty=1')).toContain('\n  "input"');
  });

  it('renders errors in the requested format', async () => {
    expect(await text('/api/nope/hi.txt')).toBe('error: unknown_style - Unknown style "nope". See /api/styles.');
    expect(await text('/api/nope/hi.xml')).toContain('<code>unknown_style</code>');
    expect(await text('/api/nope/hi.html')).toContain('unknown_style');
    expect((await call('/api/nope/hi.csv')).status).toBe(404);
  });
});

describe('GET /api/:style/:text', () => {
  it('returns "" for the none style', async () => {
    const { res, body } = await json('/api/none/hello');
    expect(res.status).toBe(200);
    expect(body.output).toBe('');
    expect(await text('/api/none/hello.txt')).toBe('');
  });

  it('joins extra path segments with slashes and lets ?text override', async () => {
    expect((await json('/api/upper/a/b')).body.input).toBe('a/b');
    expect((await json('/api/upper/ignored?text=a%2Fb')).body.input).toBe('a/b');
  });

  it('decodes unicode', async () => {
    expect((await json('/api/slug/Cr%C3%A8me%20Br%C3%BBl%C3%A9e')).body.output).toBe('creme-brulee');
  });

  it('marks random as uncacheable', async () => {
    expect((await call('/api/random/hi')).headers.get('Cache-Control')).toBe('no-store');
    expect((await call('/api/upper/hi')).headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('404s unknown style with the style list', async () => {
    const { res, body } = await json('/api/nope/hello');
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('unknown_style');
    expect(body.error.styles).toEqual([...STYLES]);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('400s missing text', async () => {
    for (const path of ['/api/title', '/api/title/', '/api/title/?text=']) {
      const { res, body } = await json(path);
      expect(res.status).toBe(400);
      expect(body.error.code).toBe('missing_text');
    }
    const asText = await call('/api/title.txt');
    expect(asText.status).toBe(400);
    expect(await asText.text()).toContain('missing_text');
  });

  it('413s long text', async () => {
    const { res, body } = await json(`/api/upper/${'a'.repeat(10001)}`);
    expect(res.status).toBe(413);
    expect(body.error.code).toBe('text_too_long');
    expect((await call(`/api/upper/${'a'.repeat(10000)}`)).status).toBe(200);
  });

  it('400s malformed percent-encoding', async () => {
    const { res, body } = await json('/api/upper/%E0%A4%A');
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('bad_encoding');
  });

  it('405s non-GET methods with Allow', async () => {
    const res = await post('/api/upper/hi', {});
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, OPTIONS');
    expect((await res.json()).error.code).toBe('method_not_allowed');
  });
});

describe('GET /api/all/:text', () => {
  it('returns every style', async () => {
    const { res, body } = await json('/api/all/hello%20world');
    expect(res.status).toBe(200);
    expect(body.input).toBe('hello world');
    expect(body.count).toBe(STYLES.length);
    expect(Object.keys(body.results)).toEqual([...STYLES]);
    expect(body.results.kebab).toBe('hello-world');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('txt gives one tab-separated line per style with line breaks escaped', async () => {
    const lines = (await text('/api/all/a%0Ab.txt')).split('\n');
    expect(lines).toHaveLength(STYLES.length);
    expect(lines[0]).toBe('same\ta\\nb');
    expect((await text('/api/all/a%E2%80%A8b.txt')).split('\n')[0]).toBe('same\ta\\u2028b');
  });

  it('csv gives one row per style; xml and yaml nest the results', async () => {
    const csv = (await text('/api/all/hi.csv')).split('\n');
    expect(csv[0]).toBe('style,output');
    expect(csv).toHaveLength(STYLES.length + 1);
    expect(csv[1]).toBe('"same","hi"');
    expect(await text('/api/all/hi.xml')).toContain('<results>\n    <same>hi</same>');
    expect(await text('/api/all/hi.yaml')).toContain('results:\n  same: "hi"');
  });

  it('400s missing text', async () => {
    expect((await call('/api/all')).status).toBe(400);
  });
});

describe('POST /api/batch', () => {
  it('transforms many texts', async () => {
    const res = await post('/api/batch', { style: 'kebab', texts: ['Hello World', 'XMLHttpRequest'] });
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({
      style: 'kebab',
      count: 2,
      results: [
        { input: 'Hello World', output: 'hello-world' },
        { input: 'XMLHttpRequest', output: 'xml-http-request' }
      ]
    });
  });

  it('accepts "inputs" as an alias for "texts"', async () => {
    const res = await post('/api/batch', { style: 'upper', inputs: ['a'] });
    expect((await res.json()).results).toEqual([{ input: 'a', output: 'A' }]);
  });

  it('honours txt and csv', async () => {
    const res = await post('/api/batch.txt', { style: 'upper', texts: ['a', 7, 'b'] });
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('A\n\nB');
    expect(await (await post('/api/batch?format=txt', { style: 'same', texts: ['a\nb', 'c'] })).text()).toBe('a\\nb\nc');
    expect(await (await post('/api/batch.csv', { style: 'upper', texts: ['a', 7] })).text())
      .toBe('input,output,error\n"a","A",""\n"7","","not_a_string"');
  });

  it('reports per-item problems inline', async () => {
    const res = await post('/api/batch', { style: 'upper', texts: ['ok', 42, 'a'.repeat(10001)] });
    const body = await res.json();
    expect(body.results[1]).toEqual({ input: 42, output: null, error: 'not_a_string' });
    expect(body.results[2]).toEqual({ input: `${'a'.repeat(50)}...`, output: null, error: 'text_too_long' });
  });

  it('validates body', async () => {
    expect((await (await post('/api/batch', { style: 'upper' })).json()).error.code).toBe('missing_texts');
    expect((await (await post('/api/batch', { style: 'upper', texts: [] })).json()).error.code).toBe('missing_texts');
    expect((await (await post('/api/batch', { style: 'upper', texts: 'no' })).json()).error.code).toBe('missing_texts');
    expect((await (await post('/api/batch', { style: 'nope', texts: ['a'] })).json()).error.code).toBe('unknown_style');
    expect((await (await post('/api/batch', { texts: ['a'] })).json()).error.code).toBe('unknown_style');
    expect((await (await post('/api/batch', null)).json()).error.code).toBe('unknown_style');
    expect((await (await post('/api/batch', { style: 'upper', texts: Array(1001).fill('a') })).json()).error.code).toBe('batch_too_large');
    const big = await post('/api/batch', { style: 'upper', texts: Array(11).fill('a'.repeat(10000)) });
    expect(big.status).toBe(413);
    expect((await big.json()).error.code).toBe('batch_too_large');
    expect((await post('/api/batch', { style: 'upper', texts: Array(10).fill('a'.repeat(10000)) })).status).toBe(200);
  });

  it('rejects invalid JSON and wrong content type', async () => {
    const bad = await post('/api/batch', '{not json');
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe('invalid_json');
    expect((await post('/api/batch', '{}', { 'Content-Type': 'text/plain' })).status).toBe(415);
    expect((await post('/api/batch', '{}', {})).status).toBe(415);
  });

  it('405s GET with Allow', async () => {
    const res = await call('/api/batch');
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST, OPTIONS');
  });

  it('404s extra segments', async () => {
    expect((await post('/api/batch/extra', {})).status).toBe(404);
  });
});

describe('GET /api/count/:text', () => {
  it('counts words and characters (grapheme clusters, not code units)', async () => {
    const { res, body } = await json('/api/count/hello%20big%20world');
    expect(res.status).toBe(200);
    expect(body).toEqual({ input: 'hello big world', words: 3, characters: 15, charactersNoSpaces: 13, spaces: 2 });
    expect((await json('/api/count/%F0%9F%98%80%20a')).body).toEqual({ input: '😀 a', words: 2, characters: 3, charactersNoSpaces: 2, spaces: 1 });
    expect((await json('/api/count/%F0%9F%91%A8%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A7')).body.characters).toBe(1); // ZWJ family is one character
    expect((await json('/api/count/%20%20spaced%20%20')).body.words).toBe(1);
  });

  it('supports txt, html, csv', async () => {
    expect(await text('/api/count/hello%20world.txt')).toBe('words: 2, chars: 11, chars (no spaces): 10, spaces: 1');
    expect(await text('/api/count/hi.html')).toContain('<th>words</th><td>1</td>');
    expect(await text('/api/count/hi.csv')).toBe('input,words,characters,charactersNoSpaces,spaces\n"hi","1","2","2","0"');
  });

  it('validates text', async () => {
    expect((await json('/api/count')).body.error.code).toBe('missing_text');
    expect((await call(`/api/count/${'a'.repeat(10001)}`)).status).toBe(413);
  });
});

describe('GET /api/lorem/:count', () => {
  it('defaults to 50 words, capitalized, ending in a period', async () => {
    const { res, body } = await json('/api/lorem');
    expect(res.status).toBe(200);
    expect(body.count).toBe(50);
    expect(body.style).toBeNull();
    expect(body.output.split(' ')).toHaveLength(50);
    expect(body.output.startsWith('Lorem ipsum dolor')).toBe(true);
    expect(body.output.endsWith('.')).toBe(true);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('honours count, ?style=, and formats', async () => {
    expect((await json('/api/lorem/3?style=kebab')).body).toEqual({ count: 3, style: 'kebab', output: 'lorem-ipsum-dolor' });
    expect((await json('/api/lorem/1')).body.output).toBe('Lorem.');
    expect(await text('/api/lorem/2.txt')).toBe('Lorem ipsum.');
    expect(await text('/api/lorem/2.html')).toContain('<em>Lorem ipsum.</em>');
    expect((await json('/api/lorem/1000')).body.output.split(' ')).toHaveLength(1000);
    expect((await call('/api/lorem/2?style=random')).headers.get('Cache-Control')).toBe('no-store');
  });

  it('validates count, style and path', async () => {
    for (const c of ['0', '1001', '2.5', 'abc', '-1', '0x10', '1e2', '%205%20', '+5']) {
      expect((await json(`/api/lorem/${c}`)).body.error.code).toBe('invalid_count');
    }
    expect((await json('/api/lorem/3?style=nope')).body.error.code).toBe('unknown_style');
    expect((await json('/api/lorem/3/extra')).body.error.code).toBe('not_found');
  });
});

describe('GET /api/spell/:text', () => {
  it('corrects misspellings and lists corrections', async () => {
    const { res, body } = await json('/api/spell/helo%20speling');
    expect(res.status).toBe(200);
    expect(body.input).toBe('helo speling');
    expect(body.output).toBe('hello spelling');
    expect(body.corrections).toEqual([{ from: 'helo', to: 'hello' }, { from: 'speling', to: 'spelling' }]);
    expect(body.limited).toBe(false);
    expect(body.style).toBeNull();
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('preserves capitalization, punctuation, and correct words', async () => {
    const { body } = await json('/api/spell/Helo,%20world!%20Recieve%20ok%20NASA.');
    expect(body.output).toBe('Hello, world! Receive ok NASA.');
    expect(body.corrections).toEqual([{ from: 'Helo', to: 'Hello' }, { from: 'Recieve', to: 'Receive' }]);
  });

  it('leaves words with accents or digits alone instead of correcting fragments', async () => {
    const { body } = await json('/api/spell/na%C3%AFve%20M%C3%BCnchen%20utf8%20caf%C3%A9%20helo');
    expect(body.output).toBe('naïve München utf8 café hello');
    expect(body.corrections).toEqual([{ from: 'helo', to: 'hello' }]);
  });

  it('keeps contractions as single tokens', async () => {
    const { body } = await json("/api/spell/isn't%20it%20don't");
    expect(body.output).toBe("isn't it don't");
    expect(body.corrections).toEqual([]);
  });

  it('leaves unsuggestable words alone', async () => {
    const { body } = await json('/api/spell/xqzjvwpk%20ok');
    expect(body.output).toBe('xqzjvwpk ok');
    expect(body.corrections).toEqual([]);
  });

  it('applies ?style= after correcting and supports every format', async () => {
    expect((await json('/api/spell/helo%20speling?style=title')).body.output).toBe('Hello Spelling');
    expect(await text('/api/spell/helo.txt')).toBe('hello');
    expect(await text('/api/spell/helo.html')).toContain('<em>hello</em>');
    expect(await text('/api/spell/helo.xml')).toContain('<corrections>\n    <correction>\n      <from>helo</from>\n      <to>hello</to>');
    expect(await text('/api/spell/helo.yaml')).toContain('corrections:\n  -\n    from: "helo"\n    to: "hello"');
    expect(await text('/api/spell/hello.yaml')).toContain('corrections: []');
    expect(await text('/api/spell/helo.csv')).toBe('input,style,output,corrections,limited\n"helo","","hello","{""from"":""helo"",""to"":""hello""}","false"');
    expect((await call('/api/spell/helo?style=random')).headers.get('Cache-Control')).toBe('no-store');
  });

  it('counts unsuggestable words against the limit too', async () => {
    const words = Array(55).fill('xqzjvwpk').concat(['helo']);
    const { body } = await json(`/api/spell/${encodeURIComponent(words.join(' '))}`);
    expect(body.limited).toBe(true);
    expect(body.corrections).toEqual([]);
    expect(body.output.endsWith(' helo')).toBe(true);
  });

  it('stops suggesting after 50 misspellings and says so', async () => {
    const words = Array.from({ length: 60 }, (_, i) => `helo${String.fromCharCode(97 + (i % 26))}`);
    const { body } = await json(`/api/spell/${encodeURIComponent(words.join(' '))}`);
    expect(body.corrections.length).toBeLessThanOrEqual(50);
    expect(body.limited).toBe(true);
    expect(body.output.split(' ')).toHaveLength(60);
  });

  it('validates text and enforces the tighter spell limit', async () => {
    expect((await json('/api/spell')).body.error.code).toBe('missing_text');
    const { res, body } = await json(`/api/spell/${'a'.repeat(501)}`);
    expect(res.status).toBe(413);
    expect(body.error.code).toBe('text_too_long');
    expect((await call(`/api/spell/${'a'.repeat(500)}`)).status).toBe(200);
  });
});

describe('GET /api/badge/:style/:text', () => {
  it('returns an SVG badge', async () => {
    const res = await call('/api/badge/sponge/hello%20world');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const svg = await res.text();
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(svg).toContain('>sponge<');
    expect(svg).toContain('>HeLlO WoRlD<');
  });

  it('supports ?label= and escapes XML', async () => {
    const svg = await text('/api/badge/same/a%3Cb%26c?label=x%22y');
    expect(svg).toContain('>x&quot;y<');
    expect(svg).toContain('>a&lt;b&amp;c<');
    expect(svg).not.toContain('<b&');
  });

  it('handles empty output and random', async () => {
    expect((await call('/api/badge/none/hi')).status).toBe(200);
    expect((await call('/api/badge/random/hi')).headers.get('Cache-Control')).toBe('no-store');
  });

  it('serves png badges and rejects text formats', async () => {
    const png = await call('/api/badge/title/hi.png');
    expect(png.status).toBe(200);
    expect(png.headers.get('Content-Type')).toBe('image/png');
    expect((await call('/api/badge/title/hi.svg')).headers.get('Content-Type')).toBe('image/svg+xml; charset=utf-8');
    const res = await call('/api/badge/title/hi.txt');
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('invalid_format'); // rendered in the requested (txt) format
    expect(await text('/api/badge/same?text=readme.txt')).toContain('>readme.txt<'); // ?text= keeps the extension
  });

  it('bounds the badge value before rendering', async () => {
    const svg = await text(`/api/badge/binary?text=${'a'.repeat(500)}`);
    expect(Number(/width="(\d+)"/.exec(svg)[1])).toBeLessThan(3000);
    expect(svg).toContain('…<');
  });

  it('limits label length', async () => {
    expect((await call(`/api/badge/upper/hi?label=${'x'.repeat(100)}`)).status).toBe(200);
    const { res, body } = await json(`/api/badge/upper/hi?label=${'x'.repeat(101)}`);
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('label_too_long');
  });

  it('validates style and text', async () => {
    expect((await json('/api/badge/nope/hi')).body.error.code).toBe('unknown_style');
    expect((await json('/api/badge')).body.error.code).toBe('unknown_style');
    expect((await json('/api/badge/upper')).body.error.code).toBe('missing_text');
  });
});

describe('misc', () => {
  it('answers OPTIONS preflight with 204 and CORS', async () => {
    const res = await call('/api/anything', { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Accept');
  });

  it('405s POST /api and POST /api/styles', async () => {
    expect((await post('/api', {})).status).toBe(405);
    expect((await post('/api/styles', {})).status).toBe(405);
  });

  it('bad encoding in a path with an extension still reports bad_encoding', async () => {
    expect((await json('/api/upper/%E0%A4%A.txt')).body.error.code).toBe('bad_encoding');
  });
});
