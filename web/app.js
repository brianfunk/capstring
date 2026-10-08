import { capstringAll, STYLES, CATEGORIES } from './capstring.js';

const API = `${location.origin}/api`;
const LABELS = { case: 'Case', code: 'Code', fun: 'Fun', encoding: 'Encodings', art: 'Unicode Art', api: 'API extras' };
/** Rows that are not library styles: computed by the HTTP API (spell) or locally (count) */
const EXTRAS = ['spell', 'count'];
const DEFAULT_TEXT = 'hello world';

const input = document.getElementById('t');
const results = document.getElementById('results');
const curl = document.getElementById('curl');
const curlLink = document.getElementById('curl-link');
const formatSelect = document.getElementById('format');
const toast = document.getElementById('toast');
const outputs = new Map();
let selectedStyle = null;
let toastTimer;
let spellRequest = 0;

/** Build one section per category with a copy row per style, plus the API extras */
const buildRows = () => {
  const groups = { ...CATEGORIES, api: EXTRAS };
  for (const [category, styles] of Object.entries(groups)) {
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = LABELS[category] ?? category;
    const ul = document.createElement('ul');
    for (const style of styles) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'row';
      btn.dataset.style = style;
      btn.setAttribute('aria-label', `Copy ${style} result`);
      const name = document.createElement('code');
      name.className = 'name';
      name.textContent = style;
      const out = document.createElement('span');
      out.className = 'out';
      btn.append(name, out);
      li.append(btn);
      ul.append(li);
      outputs.set(style, out);
    }
    section.append(h2, ul);
    results.append(section);
  }
};

/** Current text, falling back to the default so the grid is never empty */
const currentText = () => input.value || DEFAULT_TEXT;

/** encodeURIComponent plus the shell metacharacters it leaves alone (' ( ) * !), so the curl line pastes cleanly */
const shellSafeEncode = (text) => encodeURIComponent(text).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** The API URL for the selected row (or all styles) in the chosen format */
const apiUrl = (text) => {
  const format = formatSelect.value;
  const path = `${selectedStyle ?? 'all'}/${shellSafeEncode(text)}`;
  const ext = format === 'json' ? '' : `.${format}`;
  const query = format === 'jsonp' ? '?callback=cb' : '';
  return `${API}/${path}${ext}${query}`;
};

/** Refresh the curl line and its clickable link */
const renderCurl = () => {
  const url = apiUrl(currentText());
  curl.textContent = `curl ${url}`;
  curlLink.href = url;
};

/** Word and character counts, same rules as /api/count */
const countText = (text) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const characters = Array.from(text).length;
  const noSpaces = Array.from(text.replace(/\s/g, '')).length;
  return `${words} words, ${characters} chars, ${noSpaces} without spaces`;
};

/** Ask the API to spell-correct the text; stale responses are dropped */
const renderSpell = async (text) => {
  const el = outputs.get('spell');
  const mine = ++spellRequest;
  try {
    const res = await fetch(`${API}/spell/${encodeURIComponent(text.slice(0, 500))}`);
    const data = await res.json();
    if (mine !== spellRequest) return;
    el.textContent = res.ok ? data.output : `(${data.error?.message ?? 'unavailable'})`;
  } catch {
    if (mine === spellRequest) el.textContent = '(spell check unavailable)';
  }
};

/** Recompute every output and the curl line */
const render = () => {
  const text = currentText();
  const all = capstringAll(text);
  for (const style of STYLES) outputs.get(style).textContent = all[style];
  outputs.get('count').textContent = countText(text);
  renderSpell(text);
  renderCurl();
};

/** Show a transient toast message */
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
};

/** Copy text to the clipboard, reporting success or failure in the toast */
const copy = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copied ${label}`);
    return true;
  } catch {
    showToast('Copy failed. Select the text and copy it manually.');
    return false;
  }
};

/** Keep the URL shareable: ?t=<text>&style=<style>&format=txt */
const syncUrl = () => {
  const parts = [];
  if (input.value) parts.push(`t=${encodeURIComponent(input.value)}`);
  if (selectedStyle) parts.push(`style=${selectedStyle}`);
  if (formatSelect.value !== 'json') parts.push(`format=${formatSelect.value}`);
  history.replaceState(null, '', (parts.length ? `?${parts.join('&')}` : location.pathname) + location.hash);
};

let renderTimer;
input.addEventListener('input', () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    render();
    syncUrl();
  }, 120);
});

formatSelect.addEventListener('change', () => {
  renderCurl();
  syncUrl();
});

results.addEventListener('click', async (event) => {
  const btn = event.target.closest('.row');
  if (!btn) return;
  const style = btn.dataset.style;
  const value = outputs.get(style).textContent;
  selectedStyle = style;
  for (const el of results.querySelectorAll('.row.selected')) el.classList.remove('selected');
  btn.classList.add('selected');
  renderCurl();
  syncUrl();
  if (await copy(value, `${style}: ${value}`)) {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 600);
  }
});

document.getElementById('copy-curl').addEventListener('click', () => copy(curl.textContent, 'curl command'));

const params = new URLSearchParams(location.search);
if (params.get('t')) input.value = params.get('t');
if ([...STYLES, ...EXTRAS].includes(params.get('style'))) selectedStyle = params.get('style');
if ([...formatSelect.options].some((o) => o.value === params.get('format'))) formatSelect.value = params.get('format');
buildRows();
if (selectedStyle) results.querySelector(`.row[data-style="${selectedStyle}"]`)?.classList.add('selected');
render();

fetch(API)
  .then((res) => res.json())
  .then(({ version }) => {
    document.getElementById('api-version').textContent = `API v${version}.`;
  })
  .catch(() => { /* decorative */ });
