import { describe, it, expect } from 'vitest';
import handler, { config } from '../netlify/functions/api.js';
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

const post = (path, body, headers = { 'Content-Type': 'application/json' }) =>
  call(path, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('api config', () => {
  it('owns /api and /api/*', () => {
    expect(config.path).toEqual(['/api', '/api/*']);
  });
});

describe('GET /api', () => {
  it('describes the service', async () => {
    const { res, body } = await json('/api');
    expect(res.status).toBe(200);
    expect(body.name).toBe('capstring');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(body.endpoints).toContain('POST /api/batch');
    expect((await json('/api/')).body.name).toBe('capstring');
  });

  it('sets CORS and cache headers', async () => {
    const res = await call('/api');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(res.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
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

  it('rejects extra segments', async () => {
    const { res, body } = await json('/api/styles/extra');
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('not_found');
  });
});

describe('GET /api/:style/:text', () => {
  it('transforms text', async () => {
    const { res, body } = await json('/api/title/hello%20world');
    expect(res.status).toBe(200);
    expect(body).toEqual({ input: 'hello world', style: 'title', output: 'Hello World' });
  });

  it('returns "" for the none style', async () => {
    const { res, body } = await json('/api/none/hello');
    expect(res.status).toBe(200);
    expect(body.output).toBe('');
  });

  it('supports format=txt', async () => {
    const res = await call('/api/title/hello%20world?format=txt');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Hello World');
  });

  it('supports pretty', async () => {
    const res = await call('/api/upper/hi?pretty=1');
    expect(await res.text()).toContain('\n  "input"');
  });

  it('rejects unknown format', async () => {
    const { res, body } = await json('/api/title/hi?format=xml');
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('invalid_format');
  });

  it('joins extra path segments with slashes and lets ?text override', async () => {
    expect((await json('/api/upper/a/b')).body.input).toBe('a/b');
    expect((await json('/api/upper/ignored?text=a%2Fb')).body.input).toBe('a/b');
  });

  it('decodes unicode', async () => {
    const { body } = await json('/api/slug/Cr%C3%A8me%20Br%C3%BBl%C3%A9e');
    expect(body.output).toBe('creme-brulee');
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
  });

  it('413s long text', async () => {
    const { res, body } = await json(`/api/upper/${'a'.repeat(2001)}`);
    expect(res.status).toBe(413);
    expect(body.error.code).toBe('text_too_long');
    expect((await call(`/api/upper/${'a'.repeat(2000)}`)).status).toBe(200);
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

  it('format=txt gives one tab-separated line per style', async () => {
    const text = await (await call('/api/all/hi?format=txt')).text();
    const lines = text.split('\n');
    expect(lines).toHaveLength(STYLES.length);
    expect(lines[0]).toBe('same\thi');
  });

  it('400s missing text', async () => {
    expect((await call('/api/all')).status).toBe(400);
  });
});

describe('GET /api/chain/:styles/:text', () => {
  it('applies styles in order with + or ,', async () => {
    const { body } = await json('/api/chain/upper+reverse/hello');
    expect(body).toEqual({ input: 'hello', styles: ['upper', 'reverse'], output: 'OLLEH' });
    expect((await json('/api/chain/lower,title,kebab/HELLO%20WORLD')).body.output).toBe('hello-world');
    expect(await (await call('/api/chain/upper/hi?format=txt')).text()).toBe('HI');
  });

  it('caches unless random is in the chain', async () => {
    expect((await call('/api/chain/upper/hi')).headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect((await call('/api/chain/upper+random/hi')).headers.get('Cache-Control')).toBe('no-store');
  });

  it('validates styles and length', async () => {
    expect((await json('/api/chain/upper+nope/hi')).body.error.code).toBe('unknown_style');
    expect((await json(`/api/chain/${Array(11).fill('upper').join('+')}/hi`)).body.error.code).toBe('chain_too_long');
    expect((await json('/api/chain')).body.error.code).toBe('missing_styles');
    expect((await json('/api/chain/+/hi')).body.error.code).toBe('missing_styles');
    expect((await json('/api/chain/upper')).body.error.code).toBe('missing_text');
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

  it('reports per-item problems inline', async () => {
    const res = await post('/api/batch', { style: 'upper', texts: ['ok', 42, 'a'.repeat(2001)] });
    const body = await res.json();
    expect(body.results[1]).toEqual({ input: 42, output: null, error: 'not_a_string' });
    expect(body.results[2].error).toBe('text_too_long');
  });

  it('validates body', async () => {
    expect((await (await post('/api/batch', { style: 'upper' })).json()).error.code).toBe('missing_texts');
    expect((await (await post('/api/batch', { style: 'upper', texts: [] })).json()).error.code).toBe('missing_texts');
    expect((await (await post('/api/batch', { style: 'upper', texts: 'no' })).json()).error.code).toBe('missing_texts');
    expect((await (await post('/api/batch', { style: 'nope', texts: ['a'] })).json()).error.code).toBe('unknown_style');
    expect((await (await post('/api/batch', { texts: ['a'] })).json()).error.code).toBe('unknown_style');
    expect((await (await post('/api/batch', null)).json()).error.code).toBe('unknown_style');
    expect((await (await post('/api/batch', { style: 'upper', texts: Array(101).fill('a') })).json()).error.code).toBe('batch_too_large');
  });

  it('rejects invalid JSON and wrong content type', async () => {
    const bad = await post('/api/batch', '{not json');
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe('invalid_json');

    const wrongType = await post('/api/batch', '{}', { 'Content-Type': 'text/plain' });
    expect(wrongType.status).toBe(415);
    const noType = await post('/api/batch', '{}', {});
    expect(noType.status).toBe(415);
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

describe('misc', () => {
  it('answers OPTIONS preflight with 204 and CORS', async () => {
    const res = await call('/api/anything', { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
  });

  it('405s POST /api and POST /api/styles', async () => {
    expect((await post('/api', {})).status).toBe(405);
    expect((await post('/api/styles', {})).status).toBe(405);
  });
});
