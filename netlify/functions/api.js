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
 *   GET  /api                        service info
 *   GET  /api/styles                 style names and categories
 *   GET  /api/all/:text              every style
 *   GET  /api/chain/:styles/:text    apply styles in sequence (`upper+reverse` or `upper,reverse`)
 *   GET  /api/badge/:style/:text     shields-style SVG badge
 *   GET  /api/lorem/:count           lorem ipsum words, optionally `?style=`
 *   GET  /api/spell/:text            spell-corrected text, optionally `?style=`
 *   GET  /api/:style/:text           one style
 *   POST /api/batch                  { style, texts[] }
 *
 * Query: `?text=` overrides the path text (lets text contain `/`), `?format=txt`, `?pretty=1`.
 * @module capstring/api
 */

import capstring, { capstringAll, STYLES, CATEGORIES, isValidStyle } from '../../index.js';
import pkg from '../../package.json' with { type: 'json' };

export const config = { path: ['/api', '/api/*'] };

const SITE = 'https://capstring.netlify.app';
const MAX_TEXT = 2000;
const MAX_BATCH = 100;
const MAX_CHAIN = 10;
const MAX_LOREM = 1000;
const DEFAULT_LOREM = 50;
const MAX_LABEL = 100;
const MAX_SPELL_TEXT = 500;
const MAX_SPELL_SUGGESTIONS = 50;

/** First path segments owned by named endpoints; a style with one of these names would be unreachable */
export const RESERVED = Object.freeze(['styles', 'all', 'chain', 'badge', 'lorem', 'spell', 'batch']);
const ENDPOINTS = [
  'GET /api/styles',
  'GET /api/all/:text',
  'GET /api/chain/:styles/:text',
  'GET /api/badge/:style/:text',
  'GET /api/lorem/:count?style=',
  'GET /api/spell/:text?style= (max 500 chars)',
  'GET /api/:style/:text',
  'POST /api/batch'
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

/** Lorem Ipsum base text */
const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

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

/**
 * Build a JSON or text response with CORS and caching headers
 * @param {unknown} body - JSON-serializable body, or a string when `format` is `txt`
 * @param {{ status?: number, format?: string, pretty?: boolean, cache?: boolean, headers?: Record<string,string> }} [opts] - Options
 * @returns {Response} Response
 */
const respond = (body, { status = 200, format = 'json', pretty = false, cache = true, headers = {} } = {}) => {
  const isText = format === 'txt';
  return new Response(isText ? String(body) : JSON.stringify(body, null, pretty ? 2 : 0), {
    status,
    headers: {
      ...CORS,
      'Content-Type': isText ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': cache ? 'public, max-age=86400' : 'no-store',
      ...headers
    }
  });
};

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
 * Resolve and validate the input text from path segments or the `text` query param
 * @param {string[]} segments - Remaining decoded path segments
 * @param {URLSearchParams} query - Query params
 * @returns {string} Text
 */
const getText = (segments, query) => {
  const text = query.has('text') ? query.get('text') : segments.join('/');
  if (!text) throw new ApiError(400, 'missing_text', 'Provide text in the path (/api/<style>/<text>) or as ?text=.');
  if (text.length > MAX_TEXT) throw new ApiError(413, 'text_too_long', `Text must be at most ${MAX_TEXT} characters.`);
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
 * Validate the output format
 * @param {URLSearchParams} query - Query params
 * @returns {'json'|'txt'} Format
 */
const getFormat = (query) => {
  const format = query.get('format') ?? 'json';
  if (format !== 'json' && format !== 'txt') {
    throw new ApiError(400, 'invalid_format', 'format must be "json" or "txt".');
  }
  return format;
};

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

// ========== Badge ==========

/**
 * Escape text for safe inclusion in SVG/XML
 * @param {string} str - Raw text
 * @returns {string} Escaped text
 */
const escapeXml = (str) => str.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

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
  const output = text.replace(/[A-Za-z]+/g, (word) => {
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
 * @returns {Promise<Response>} Response
 */
const route = async (req) => {
  const url = new URL(req.url);
  const query = url.searchParams;
  const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decode);
  const [head, ...rest] = segments;
  const format = getFormat(query);
  const pretty = query.has('pretty');
  const out = (body, opts = {}) => respond(body, { format, pretty, ...opts });

  if (head === undefined) {
    requireMethod(req, 'GET');
    const info = { name: pkg.name, version: pkg.version, docs: `${SITE}/#api`, endpoints: ENDPOINTS };
    return out(format === 'txt' ? `${info.name} ${info.version}\n${ENDPOINTS.join('\n')}` : info);
  }

  if (head === 'styles') {
    requireMethod(req, 'GET');
    noExtraSegments(rest);
    return out(format === 'txt' ? STYLES.join('\n') : { count: STYLES.length, styles: STYLES, categories: CATEGORIES });
  }

  if (head === 'all') {
    requireMethod(req, 'GET');
    const text = getText(rest, query);
    const results = capstringAll(text);
    const body = format === 'txt'
      ? STYLES.map((s) => `${s}\t${results[s]}`).join('\n')
      : { input: text, count: STYLES.length, results };
    return out(body, { cache: false });
  }

  if (head === 'chain') {
    requireMethod(req, 'GET');
    const [stylesRaw, ...textSegments] = rest;
    const styles = (stylesRaw ?? '').split(/[+,]/).filter(Boolean);
    if (!styles.length) throw new ApiError(400, 'missing_styles', 'Provide styles like /api/chain/upper+reverse/<text>.');
    if (styles.length > MAX_CHAIN) throw new ApiError(400, 'chain_too_long', `Chain at most ${MAX_CHAIN} styles.`);
    styles.forEach(getStyle);
    const text = getText(textSegments, query);
    const output = styles.reduce((acc, s) => capstring(acc, s), text);
    return out(format === 'txt' ? output : { input: text, styles, output }, { cache: !styles.includes('random') });
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

  if (head === 'lorem') {
    requireMethod(req, 'GET');
    const [countRaw, ...extra] = rest;
    noExtraSegments(extra);
    const count = countRaw === undefined ? DEFAULT_LOREM : (/^\d+$/.test(countRaw) ? Number(countRaw) : NaN);
    if (!Number.isInteger(count) || count < 1 || count > MAX_LOREM) {
      throw new ApiError(400, 'invalid_count', `count must be an integer from 1 to ${MAX_LOREM}.`);
    }
    const style = optionalStyle(query);
    const words = Array.from({ length: count }, (_, i) => LOREM_WORDS[i % LOREM_WORDS.length]).join(' ');
    const output = style ? capstring(words, style) : words;
    return out(format === 'txt' ? output : { count, style, output }, { cache: style !== 'random' });
  }

  if (head === 'spell') {
    requireMethod(req, 'GET');
    const text = getText(rest, query);
    if (text.length > MAX_SPELL_TEXT) throw new ApiError(413, 'text_too_long', `Spellcheck text must be at most ${MAX_SPELL_TEXT} characters.`);
    const style = optionalStyle(query);
    const { output: corrected, corrections, limited } = await spellCheck(text);
    const output = style ? capstring(corrected, style) : corrected;
    return out(format === 'txt' ? output : { input: text, style, output, corrections, limited }, { cache: style !== 'random' });
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
    const texts = body?.texts;
    if (!Array.isArray(texts) || texts.length === 0) throw new ApiError(400, 'missing_texts', '"texts" must be a non-empty array of strings.');
    if (texts.length > MAX_BATCH) throw new ApiError(400, 'batch_too_large', `Send at most ${MAX_BATCH} texts per request.`);
    const results = texts.map((input) => {
      if (typeof input !== 'string') return { input, output: null, error: 'not_a_string' };
      if (input.length > MAX_TEXT) return { input, output: null, error: 'text_too_long' };
      return { input, output: capstring(input, style) };
    });
    const payload = format === 'txt'
      ? results.map((r) => r.output ?? '').join('\n')
      : { style, count: results.length, results };
    return out(payload, { cache: false });
  }

  requireMethod(req, 'GET');
  const style = getStyle(head);
  const text = getText(rest, query);
  const output = capstring(text, style);
  return out(format === 'txt' ? output : { input: text, style, output }, { cache: style !== 'random' });
};

/**
 * Netlify Function entry point
 * @param {Request} req - Incoming request
 * @returns {Promise<Response>} Response
 */
export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    return await route(req);
  } catch (err) {
    let apiErr = err;
    /* c8 ignore start -- only the spellchecker loader can throw a non-ApiError, and only on a broken deploy */
    if (!(err instanceof ApiError)) {
      console.error('capstring api: unhandled error', err);
      apiErr = new ApiError(500, 'internal_error', 'Something went wrong.');
    }
    /* c8 ignore stop */
    const { allow, ...extra } = apiErr.extra;
    return respond(
      { error: { code: apiErr.code, message: apiErr.message, ...extra } },
      { status: apiErr.status, cache: false, headers: allow ? { Allow: allow } : {} }
    );
  }
};
