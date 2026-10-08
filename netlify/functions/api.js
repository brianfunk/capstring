/*
   ___      ___    _____   ___ _  _
  / __|__ _| _ \__|_   _| |_ _| \| |__ _
 | (__/ _` |  _(_-< | || '_| || .` / _` |
  \___\__,_|_| /__/ |_||_||___|_|\_\__, |
                                   |___/
*/

/**
 * capstring HTTP API - a single Netlify Function serving every /api route.
 *
 *   GET  /api                        service info (JSON), or the Swagger reference for browsers
 *   GET  /api/styles                 style names and categories
 *   GET  /api/:style/:text           one style
 *   GET  /api/all/:text              every style
 *   POST /api/batch                  { style, texts[] }  (`inputs` accepted as an alias)
 *   GET  /api/count/:text            words and characters
 *   GET  /api/lorem/:count           lorem ipsum words, optional ?style=
 *   GET  /api/spell/:text            spell-corrected text, optional ?style=
 *   GET  /api/badge/:style/:text     shields-style SVG badge
 *
 * Output format, in priority order: a file extension on the last path segment
 * (`/api/title/hello.txt`), `?format=`, the `Accept` header, then JSON.
 * Formats: json (default), jsonp (`?callback=`), txt, html, xml, yaml/yml, csv, svg and png (the output as an image).
 * `?text=` overrides the path text (lets text contain `/` or end in `.txt`). `?pretty=1` indents JSON.
 * @module capstring/api
 */

import capstring, { capstringAll, count, STYLES, CATEGORIES, isValidStyle } from '../../index.js';
import pkg from '../../package.json' with { type: 'json' };
import { SWAGGER_PAGE } from './swagger-page.js';

export const config = { path: ['/api', '/api/*'] };

const MAX_TEXT = 10000;
const MAX_BATCH = 1000;
const MAX_LOREM = 1000;
const DEFAULT_LOREM = 50;
const MAX_LABEL = 100;
const MAX_SPELL_TEXT = 500;
const MAX_SPELL_SUGGESTIONS = 50;

/** First path segments owned by named endpoints; a style with one of these names would be unreachable */
export const RESERVED = Object.freeze(['styles', 'all', 'batch', 'count', 'lorem', 'spell', 'badge']);

/** Supported output formats (`yml` is accepted as an alias of `yaml`) */
export const FORMATS = Object.freeze(['json', 'jsonp', 'txt', 'html', 'xml', 'yaml', 'csv', 'svg', 'png']);

const ENDPOINTS = [
  'GET /api/styles',
  'GET /api/:style/:text',
  'GET /api/all/:text',
  'POST /api/batch',
  'GET /api/count/:text',
  'GET /api/lorem/:count?style=',
  'GET /api/spell/:text?style= (max 500 chars)',
  'GET /api/badge/:style/:text'
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400'
};

const CONTENT_TYPES = {
  json: 'application/json; charset=utf-8',
  jsonp: 'application/javascript; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  html: 'text/html; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  yaml: 'text/yaml; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  svg: 'image/svg+xml; charset=utf-8',
  png: 'image/png'
};

/** Accept header media types mapped to formats, checked in the order the client lists them */
const ACCEPT_TYPES = {
  'application/json': 'json',
  'application/javascript': 'jsonp',
  'text/javascript': 'jsonp',
  'text/plain': 'txt',
  'text/html': 'html',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'text/yaml': 'yaml',
  'application/yaml': 'yaml',
  'application/x-yaml': 'yaml',
  'text/csv': 'csv',
  'image/svg+xml': 'svg',
  'image/png': 'png'
};

/** Lorem Ipsum base text */
const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

// ========== Errors ==========

/** Thrown by handlers to produce a structured error response */
class ApiError extends Error {
  /**
   * @param {number} status - HTTP status
   * @param {string} code - snake_case error code
   * @param {string} message - Human readable message
   * @param {Record<string, unknown>} [extra] - Extra fields merged into the error body
   */
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

// ========== Escaping and serializers ==========

/**
 * Escape text for HTML and XML
 * @param {unknown} str - Raw text
 * @returns {string} Escaped text
 */
const escapeXml = (str) => String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/**
 * Escape CR/LF and Unicode line separators so a value fits on one line
 * @param {unknown} value - Raw value
 * @returns {string} Single-line value
 */
const oneLine = (value) => String(value)
  .replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/**
 * Singular element name for array items (`styles` -> `style`, `results` -> `result`)
 * @param {string} key - Plural key
 * @returns {string} Singular key
 */
const singular = (key) => (key.endsWith('s') && key.length > 1 ? key.slice(0, -1) : 'item');

/**
 * Serialize a JSON value as XML elements
 * @param {unknown} value - Value
 * @param {string} tag - Element name
 * @param {string} [indent] - Current indentation
 * @returns {string} XML
 */
const toXml = (value, tag, indent = '') => {
  if (Array.isArray(value)) {
    const inner = value.map((v) => toXml(v, singular(tag), `${indent}  `)).join('\n');
    return `${indent}<${tag}>\n${inner}\n${indent}</${tag}>`;
  }
  if (value !== null && typeof value === 'object') {
    const inner = Object.entries(value).map(([k, v]) => toXml(v, k, `${indent}  `)).join('\n');
    return `${indent}<${tag}>\n${inner}\n${indent}</${tag}>`;
  }
  return `${indent}<${tag}>${value === null ? '' : escapeXml(value)}</${tag}>`;
};

/**
 * Serialize a JSON value as YAML (strings double-quoted, so any text round-trips)
 * @param {unknown} value - Value
 * @param {string} [indent] - Current indentation
 * @returns {string} YAML
 */
const toYaml = (value, indent = '') => {
  const isObj = (v) => v !== null && typeof v === 'object';
  if (Array.isArray(value)) {
    if (value.length === 0) return `${indent}[]`;
    return value.map((v) => (isObj(v) ? `${indent}-\n${toYaml(v, `${indent}  `)}` : `${indent}- ${toYaml(v)}`)).join('\n');
  }
  if (isObj(value)) {
    return Object.entries(value).map(([k, v]) => (isObj(v) && (Array.isArray(v) ? v.length : Object.keys(v).length)
      ? `${indent}${k}:\n${toYaml(v, `${indent}  `)}`
      : `${indent}${k}: ${toYaml(v)}`)).join('\n');
  }
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
};

/**
 * Quote a CSV cell (arrays joined with `|`, objects as JSON)
 * @param {unknown} value - Cell value
 * @returns {string} Quoted cell
 */
const csvCell = (value) => {
  const text = value === null || value === undefined ? ''
    : Array.isArray(value) ? value.map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))).join('|')
      : typeof value === 'object' ? JSON.stringify(value)
        : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

/**
 * Serialize a record or a list of records as CSV
 * @param {Record<string, unknown>|Record<string, unknown>[]} value - Rows
 * @returns {string} CSV
 */
const toCsv = (value) => {
  const rows = Array.isArray(value) ? value : [value];
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n');
};

/**
 * Render a value for an HTML table cell
 * @param {unknown} v - Value
 * @returns {string} Escaped cell content
 */
const htmlCell = (v) => {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.map((x) => (x !== null && typeof x === 'object' ? JSON.stringify(x) : String(x))).map(escapeXml).join(', ');
  if (typeof v === 'object') return escapeXml(JSON.stringify(v));
  return escapeXml(v);
};

/**
 * Render a record as a small HTML document (list payloads only exist for csv)
 * @param {string} title - Page title
 * @param {Record<string, unknown>} value - Body data
 * @param {string} [headline] - Primary value shown large (e.g. the transformed text)
 * @returns {string} HTML
 */
const toHtml = (title, value, headline) => {
  const body = `<table>${Object.entries(value).map(([k, v]) => `<tr><th>${escapeXml(k)}</th><td>${htmlCell(v)}</td></tr>`).join('')}</table>`;
  const lead = headline === undefined ? '' : `<p><strong><em>${escapeXml(headline)}</em></strong></p>\n`;
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${escapeXml(title)}</title></head>\n<body>\n${lead}${body}\n</body></html>`;
};

// ========== Request helpers ==========

/**
 * Decode a path segment, mapping URIError to a 400
 * @param {string} segment - Raw segment
 * @returns {string} Decoded segment
 */
const decode = (segment) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    throw new ApiError(400, 'bad_encoding', 'Path contains a malformed percent-encoding.');
  }
};

/**
 * Split the path into decoded segments and pull a known format extension off the last one
 * @param {string} pathname - URL path
 * @returns {{ segments: string[], ext: string|null }} Segments and extension
 */
const parsePath = (pathname) => {
  const segments = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decode);
  let ext = null;
  if (segments.length) {
    const match = /^(.+)\.(json|jsonp|txt|html|xml|yaml|yml|csv|svg|png)$/is.exec(segments[segments.length - 1]);
    if (match) {
      segments[segments.length - 1] = match[1];
      ext = match[2].toLowerCase();
    }
  }
  return { segments, ext };
};

/**
 * Resolve the output format: extension, then ?format=, then Accept header, then json
 * @param {string|null} ext - Extension from the path
 * @param {URLSearchParams} query - Query params
 * @param {Headers} headers - Request headers
 * @returns {string} Format name
 */
const resolveFormat = (ext, query, headers) => {
  const requested = ext ?? query.get('format');
  if (requested !== null) {
    const normalized = requested.toLowerCase() === 'yml' ? 'yaml' : requested.toLowerCase();
    if (!FORMATS.includes(normalized)) {
      throw new ApiError(400, 'invalid_format', `Unknown format "${requested}". Use one of: ${FORMATS.join(', ')}.`);
    }
    return normalized;
  }
  for (const part of (headers.get('accept') ?? '').split(',')) {
    const type = part.split(';')[0].trim().toLowerCase();
    if (ACCEPT_TYPES[type]) return ACCEPT_TYPES[type];
  }
  return 'json';
};

/**
 * Resolve and validate the input text from path segments or the `text` query param
 * @param {string[]} segments - Remaining decoded path segments
 * @param {URLSearchParams} query - Query params
 * @param {number} [max] - Length limit
 * @returns {string} Text
 */
const getText = (segments, query, max = MAX_TEXT) => {
  const text = query.has('text') ? query.get('text') : segments.join('/');
  if (!text) throw new ApiError(400, 'missing_text', 'Provide text in the path (/api/<style>/<text>) or as ?text=.');
  if (text.length > max) throw new ApiError(413, 'text_too_long', `Text must be at most ${max} characters.`);
  return text;
};

/**
 * Validate a style name
 * @param {string} style - Candidate style
 * @returns {string} The style
 */
const getStyle = (style) => {
  if (!isValidStyle(style)) {
    throw new ApiError(404, 'unknown_style', `Unknown style "${style}". See /api/styles.`, { styles: STYLES });
  }
  return style;
};

/**
 * Read an optional `?style=` query param
 * @param {URLSearchParams} query - Query params
 * @returns {string|null} Validated style or null
 */
const optionalStyle = (query) => (query.has('style') ? getStyle(query.get('style')) : null);

/**
 * Enforce an HTTP method, answering 405 otherwise
 * @param {Request} req - Request
 * @param {string} allowed - Allowed method
 */
const requireMethod = (req, allowed) => {
  if (req.method !== allowed) {
    throw new ApiError(405, 'method_not_allowed', `Use ${allowed} for this endpoint.`, { allow: `${allowed}, OPTIONS` });
  }
};

/**
 * Reject trailing path segments on endpoints that take none
 * @param {string[]} rest - Remaining segments
 */
const noExtraSegments = (rest) => {
  if (rest.length) throw new ApiError(404, 'not_found', 'No such endpoint.');
};

// ========== Response ==========

/**
 * @typedef {Object} Payload
 * @property {Record<string, unknown>|Record<string, unknown>[]} data - Body for json/jsonp/xml/yaml/csv/html
 * @property {string} text - Plain-text rendering
 * @property {string} title - HTML page title
 * @property {string} [headline] - Primary value for the HTML rendering
 */

/**
 * Build the response in the requested format with CORS and caching headers
 * @param {Payload} payload - Endpoint result
 * @param {{ format: string, query: URLSearchParams, status?: number, cache?: boolean, headers?: Record<string,string> }} ctx - Response context
 * @returns {Promise<Response>} Response
 */
const respond = async (payload, { format, query, status = 200, cache = true, headers = {} }) => {
  const json = JSON.stringify(payload.data, null, query.has('pretty') ? 2 : 0);
  let body;
  switch (format) {
    case 'png': body = await textPng(payload.headline ?? payload.text); break;
    case 'jsonp': {
      const callback = query.get('callback') || 'callback';
      if (!/^[\w$.]{1,64}$/.test(callback)) throw new ApiError(400, 'invalid_callback', 'callback must be a plain JavaScript identifier.');
      body = `/**/ typeof ${callback} === 'function' && ${callback}(${json});`;
      break;
    }
    case 'txt': body = payload.text; break;
    case 'html': body = toHtml(payload.title, payload.data, payload.headline); break;
    case 'xml': body = `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(payload.data, 'result')}`; break;
    case 'yaml': body = toYaml(payload.data); break;
    case 'csv': body = toCsv(payload.data); break;
    case 'svg': body = textSvg(payload.headline ?? payload.text); break;
    default: body = json;
  }
  return new Response(body, {
    status,
    headers: {
      ...CORS,
      'Content-Type': CONTENT_TYPES[format],
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': cache ? 'public, max-age=86400' : 'no-store',
      'Vary': 'Accept',
      ...headers
    }
  });
};

/**
 * Payload for a result whose primary value is `data.output`
 * @param {Record<string, unknown>} data - JSON record containing `output`
 * @param {string} title - HTML title
 * @returns {Payload} Payload
 */
const outputPayload = (data, title) => ({ data, text: String(data.output), title, headline: String(data.output) });

// ========== Images ==========

/**
 * Render text as a standalone SVG image (the `svg` output format): one line, monospace,
 * sized to the text, transparent background, so it drops into an <img> or a README.
 * @param {string} text - Text to render (line breaks collapse to spaces)
 * @returns {string} SVG markup
 */
const textSvg = (text) => {
  let value = oneLine(text).replace(/\\n|\\r|\\u2028|\\u2029/g, ' ') || ' ';
  // Fullwidth forms (the `wide` style) have thin font coverage; draw them as ASCII with wide tracking instead
  const wide = /[\uFF01-\uFF5E\u3000]/u.test(value);
  if (wide) value = value.replace(/[\uFF01-\uFF5E]/gu, (ch) => String.fromCodePoint(ch.codePointAt(0) - 0xFEE0)).replace(/\u3000/gu, ' ');
  const fontSize = 20;
  const advance = fontSize * (wide ? 1.2 : 0.62);
  const width = Math.max(Math.round(Array.from(value).length * advance + 24), 40);
  const height = fontSize + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(value)}">
  <title>${escapeXml(value)}</title>
  <text x="12" y="${fontSize + 8}" font-family="DejaVu Sans Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="${fontSize}"${wide ? ' letter-spacing="0.6em"' : ''} fill="#6d28d9">${escapeXml(value)}</text>
</svg>`;
};

/** Vendored fonts (netlify/fonts): a monospace base plus Noto blocks for the Unicode art styles and emoji */
const FONT_FILES = ['DejaVuSansMono.ttf', 'DejaVuSans.ttf', 'NotoSansMath-Regular.ttf', 'NotoSansSymbols-Regular.ttf', 'NotoSansSymbols2-Regular.ttf', 'NotoEmoji-Regular.ttf'];

/** @type {Promise<{ Resvg: typeof import('@resvg/resvg-js').Resvg, fontFiles: string[] }>|null} */
let rasterizerPromise = null;

/**
 * Lazily load the SVG rasterizer and the vendored fonts (only the `png` format pays for it).
 * Serverless hosts ship no fonts, so they ride along via `included_files`; the directory is
 * resolved from the function file first, then from the working directory.
 * @returns {Promise<{ Resvg: typeof import('@resvg/resvg-js').Resvg, fontFiles: string[] }>} Rasterizer and font paths
 */
const getRasterizer = () => {
  rasterizerPromise ??= Promise.all([import('@resvg/resvg-js'), import('node:fs'), import('node:path'), import('node:url')])
    .then(([{ Resvg }, fs, path, url]) => {
      const here = path.dirname(url.fileURLToPath(import.meta.url));
      const candidates = [path.join(here, '..', 'fonts'), path.join(here, 'fonts'), path.join(process.cwd(), 'netlify', 'fonts')];
      const dir = candidates.find((d) => fs.existsSync(path.join(d, FONT_FILES[0])));
      /* c8 ignore next -- only when the deploy is missing netlify/fonts */
      if (!dir) throw new Error(`capstring api: fonts directory not found, tried ${candidates.join(', ')}`);
      return { Resvg, fontFiles: FONT_FILES.map((f) => path.join(dir, f)) };
    })
    /* c8 ignore start -- only reachable when the native binary or fonts are missing from the deploy */
    .catch((err) => {
      rasterizerPromise = null;
      throw err;
    });
    /* c8 ignore stop */
  return rasterizerPromise;
};

/**
 * Render text as a PNG at 2x for crisp display
 * @param {string} text - Text to render
 * @returns {Promise<Uint8Array>} PNG bytes
 */
const textPng = async (text) => {
  const { Resvg, fontFiles } = await getRasterizer();
  const svg = textSvg(text);
  const resvg = new Resvg(svg, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'DejaVu Sans Mono' }, fitTo: { mode: 'zoom', value: 2 } });
  return resvg.render().asPng();
};

// ========== Badge ==========

/**
 * Render a shields.io-style flat SVG badge (no network call)
 * @param {string} label - Left-hand label
 * @param {string} value - Right-hand value
 * @returns {string} SVG markup
 */
const badgeSvg = (label, value) => {
  const charWidth = 6.5;
  const padding = 10;
  const labelWidth = Math.round(Array.from(label).length * charWidth + padding);
  const valueWidth = Math.round(Array.from(value || ' ').length * charWidth + padding);
  const width = labelWidth + valueWidth;
  const safeLabel = escapeXml(label);
  const safeValue = escapeXml(value);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${safeLabel}: ${safeValue}">
  <title>${safeLabel}: ${safeValue}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="#b5d4ff"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${safeLabel}</text>
    <text x="${labelWidth / 2}" y="14">${safeLabel}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${safeValue}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" fill="#333">${safeValue}</text>
  </g>
</svg>`;
};

// ========== Spell check ==========

/** @type {Promise<import('nspell').default>|null} */
let spellCheckerPromise = null;

/**
 * Lazily load nspell and the English dictionary (only requests to /api/spell pay for it)
 * @returns {Promise<import('nspell').default>} Spell checker
 */
const getSpellChecker = () => {
  spellCheckerPromise ??= Promise.all([import('nspell'), import('dictionary-en')])
    .then(([{ default: nspell }, { default: dictionary }]) => nspell(dictionary))
    /* c8 ignore start -- only reachable when the dictionary files are missing from the deploy */
    .catch((err) => {
      spellCheckerPromise = null; // let the next request retry instead of caching the failure
      throw err;
    });
    /* c8 ignore stop */
  return spellCheckerPromise;
};

/**
 * Correct misspelled words, preserving whitespace, punctuation, and capitalization.
 * Hunspell's suggest() is expensive (tens of ms per unknown word), so it is called for at most
 * MAX_SPELL_SUGGESTIONS unknown words per request, whether or not a suggestion comes back;
 * the rest pass through unchanged.
 * @param {string} text - Input text
 * @returns {Promise<{ output: string, corrections: { from: string, to: string }[], limited: boolean }>} Result
 */
const spellCheck = async (text) => {
  const checker = await getSpellChecker();
  const corrections = [];
  let attempts = 0;
  let limited = false;
  const isCorrect = (word) => {
    const variants = new Set([word, word.toLowerCase(), word.toUpperCase(), word[0].toUpperCase() + word.slice(1).toLowerCase()]);
    return [...variants].some((variant) => checker.correct(variant));
  };
  const output = text.replace(/[A-Za-z]+(?:['’][A-Za-z]+)*/g, (word) => { // contractions stay whole (isn't)
    if (isCorrect(word)) return word;
    if (attempts >= MAX_SPELL_SUGGESTIONS) {
      limited = true;
      return word;
    }
    attempts++;
    const [suggestion] = checker.suggest(word);
    if (!suggestion) return word;
    const fixed = word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()
      ? suggestion[0].toUpperCase() + suggestion.slice(1)
      : suggestion;
    corrections.push({ from: word, to: fixed });
    return fixed;
  });
  return { output, corrections, limited };
};

// ========== Router ==========

/**
 * Route a request
 * @param {Request} req - Request
 * @param {string} format - Resolved output format
 * @param {URLSearchParams} query - Query params
 * @param {string[]} segments - Decoded path segments (extension already removed)
 * @returns {Promise<Response>} Response
 */
const route = async (req, format, query, segments) => {
  const [head, ...rest] = segments;
  const origin = new URL(req.url).origin;
  const send = (payload, opts = {}) => respond(payload, { format, query, ...opts });

  if (head === undefined) {
    requireMethod(req, 'GET');
    if (format === 'html') {
      // A browser at /api gets the interactive reference; curl and fetch get the JSON below
      return new Response(SWAGGER_PAGE, { headers: { ...CORS, 'Content-Type': CONTENT_TYPES.html, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=3600', 'Vary': 'Accept' } });
    }
    const data = { name: pkg.name, version: pkg.version, docs: `${origin}/api`, formats: FORMATS, endpoints: ENDPOINTS };
    return send({ data, text: `${pkg.name} ${pkg.version}\n${ENDPOINTS.join('\n')}`, title: 'capstring API' });
  }

  if (head === 'styles') {
    requireMethod(req, 'GET');
    noExtraSegments(rest);
    const data = { count: STYLES.length, styles: STYLES, categories: CATEGORIES };
    return send({ data, text: STYLES.join('\n'), title: 'capstring styles' });
  }

  if (head === 'all') {
    requireMethod(req, 'GET');
    const text = getText(rest, query);
    const results = capstringAll(text);
    const data = format === 'csv'
      ? STYLES.map((style) => ({ style, output: results[style] }))
      : { input: text, count: STYLES.length, results };
    return send({ data, text: STYLES.map((s) => `${s}\t${oneLine(results[s])}`).join('\n'), title: `all styles: ${text}` }, { cache: false });
  }

  if (head === 'batch') {
    requireMethod(req, 'POST');
    noExtraSegments(rest);
    if (!/^application\/json\b/i.test(String(req.headers.get('content-type')))) {
      throw new ApiError(415, 'unsupported_media_type', 'Send a JSON body with Content-Type: application/json.');
    }
    let body;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, 'invalid_json', 'Body is not valid JSON.');
    }
    const style = getStyle(String(body?.style ?? ''));
    const texts = body?.texts ?? body?.inputs;
    if (!Array.isArray(texts) || texts.length === 0) throw new ApiError(400, 'missing_texts', '"texts" must be a non-empty array of strings.');
    if (texts.length > MAX_BATCH) throw new ApiError(400, 'batch_too_large', `Send at most ${MAX_BATCH} texts per request.`);
    const results = texts.map((input) => {
      if (typeof input !== 'string') return { input, output: null, error: 'not_a_string' };
      if (input.length > MAX_TEXT) return { input: `${input.slice(0, 50)}...`, output: null, error: 'text_too_long' };
      return { input, output: capstring(input, style) };
    });
    const data = format === 'csv' ? results : { style, count: results.length, results };
    return send({ data, text: results.map((r) => oneLine(r.output ?? '')).join('\n'), title: `batch: ${style}` }, { cache: false });
  }

  if (head === 'count') {
    requireMethod(req, 'GET');
    const text = getText(rest, query);
    const c = count(text);
    const data = { input: text, ...c };
    return send({ data, text: `words: ${c.words}, chars: ${c.characters}, chars (no spaces): ${c.charactersNoSpaces}, spaces: ${c.spaces}`, title: `count: ${text}` });
  }

  if (head === 'lorem') {
    requireMethod(req, 'GET');
    const [countRaw, ...extra] = rest;
    noExtraSegments(extra);
    const count = countRaw === undefined ? DEFAULT_LOREM : (/^\d+$/.test(countRaw) ? Number(countRaw) : NaN);
    if (!Number.isInteger(count) || count < 1 || count > MAX_LOREM) {
      throw new ApiError(400, 'invalid_count', `count must be an integer from 1 to ${MAX_LOREM}.`);
    }
    const style = optionalStyle(query);
    const words = Array.from({ length: count }, (_, i) => LOREM_WORDS[i % LOREM_WORDS.length]);
    const sentence = `${words.join(' ').replace(/^./, (c) => c.toUpperCase())}.`;
    const output = style ? capstring(sentence, style) : sentence;
    return send(outputPayload({ count, style, output }, `lorem ${count}`), { cache: style !== 'random' });
  }

  if (head === 'spell') {
    requireMethod(req, 'GET');
    const text = getText(rest, query, MAX_SPELL_TEXT);
    const style = optionalStyle(query);
    const { output: corrected, corrections, limited } = await spellCheck(text);
    const output = style ? capstring(corrected, style) : corrected;
    const data = { input: text, style, output, corrections, limited };
    return send(outputPayload(data, `spell: ${text}`), { cache: style !== 'random' });
  }

  if (head === 'badge') {
    requireMethod(req, 'GET');
    const [styleRaw, ...textSegments] = rest;
    const style = getStyle(styleRaw ?? '');
    const text = getText(textSegments, query);
    const label = query.get('label') || style;
    if (label.length > MAX_LABEL) throw new ApiError(400, 'label_too_long', `label must be at most ${MAX_LABEL} characters.`);
    return new Response(badgeSvg(label, capstring(text, style)), {
      headers: {
        ...CORS,
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': style === 'random' ? 'no-store' : 'public, max-age=86400'
      }
    });
  }

  requireMethod(req, 'GET');
  const style = getStyle(head);
  const text = getText(rest, query);
  const output = capstring(text, style);
  return send(outputPayload({ input: text, style, output }, `${style}: ${text}`), { cache: style !== 'random' });
};

/**
 * Netlify Function entry point
 * @param {Request} req - Incoming request
 * @returns {Promise<Response>} Response
 */
export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const query = new URL(req.url).searchParams;
  let format = 'json';
  try {
    const { segments, ext } = parsePath(new URL(req.url).pathname);
    format = resolveFormat(ext, query, req.headers);
    return await route(req, format, query, segments);
  } catch (err) {
    let apiErr = err;
    /* c8 ignore start -- only the spellchecker loader can throw a non-ApiError, and only on a broken deploy */
    if (!(err instanceof ApiError)) {
      console.error('capstring api: unhandled error', err);
      apiErr = new ApiError(500, 'internal_error', 'Something went wrong.');
    }
    /* c8 ignore stop */
    const { allow, ...extra } = apiErr.extra;
    const data = { error: { code: apiErr.code, message: apiErr.message, ...extra } };
    // Errors are never wrapped in JSONP so a broken callback name cannot be reflected
    return respond(
      { data, text: `error: ${apiErr.code} - ${apiErr.message}`, title: `error: ${apiErr.code}` },
      { format: format === 'jsonp' ? 'json' : format, query, status: apiErr.status, cache: false, headers: allow ? { Allow: allow } : {} }
    );
  }
};
