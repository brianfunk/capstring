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
const ENDPOINTS = ['GET /api/styles', 'GET /api/all/:text', 'GET /api/chain/:styles/:text', 'GET /api/:style/:text', 'POST /api/batch'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

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
    return respond({ name: pkg.name, version: pkg.version, docs: `${SITE}/#api`, endpoints: ENDPOINTS }, { pretty });
  }

  if (head === 'styles') {
    requireMethod(req, 'GET');
    if (rest.length) throw new ApiError(404, 'not_found', 'No such endpoint.');
    return respond({ count: STYLES.length, styles: STYLES, categories: CATEGORIES }, { pretty });
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

  if (head === 'batch') {
    requireMethod(req, 'POST');
    if (rest.length) throw new ApiError(404, 'not_found', 'No such endpoint.');
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
    return respond({ style, count: results.length, results }, { pretty, cache: false });
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
    /* c8 ignore next -- defensive: nothing in route() is expected to throw anything but ApiError */
    const apiErr = err instanceof ApiError ? err : new ApiError(500, 'internal_error', 'Something went wrong.');
    const { allow, ...extra } = apiErr.extra;
    return respond(
      { error: { code: apiErr.code, message: apiErr.message, ...extra } },
      { status: apiErr.status, cache: false, headers: allow ? { Allow: allow } : {} }
    );
  }
};
