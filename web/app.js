import { capstringAll, count, STYLES, CATEGORIES } from './capstring.js';

const API = `${location.origin}/api`;
const LABELS = { case: 'Case', code: 'Code', fun: 'Fun', encoding: 'Encodings', art: 'Unicode Art', tools: 'Tools', api: 'API only' };
/** Rows that are not styles: count comes from the library, spell from the HTTP API (it needs a dictionary) */
const TOOLS = ['count'];
const API_ONLY = ['spell', 'badge'];
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
  const groups = { ...CATEGORIES, tools: TOOLS, api: API_ONLY };
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
      const out = document.createElement(style === 'badge' ? 'img' : 'span');
      out.className = 'out';
      if (style === 'badge') {
        out.alt = 'SVG badge for the current text';
        out.height = 20;
      }
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

/** Text that would be misread in the path (a trailing format extension or a slash) goes in ?text= instead */
const needsQuery = (text) => /\.(json|jsonp|txt|html|xml|yaml|yml|csv|svg|png)$/i.test(text) || text.includes('/');

/** The API URL for the selected row (or all styles) in the chosen format */
const apiUrl = (text) => {
  const format = formatSelect.value;
  if (selectedStyle === 'badge') return badgeUrl(text);
  const route = selectedStyle ?? 'all';
  const ext = format === 'json' ? '' : `.${format}`;
  const params = [];
  if (needsQuery(text)) params.push(`text=${shellSafeEncode(text)}`);
  if (format === 'jsonp') params.push('callback=cb');
  const query = params.length ? `?${params.join('&')}` : '';
  return needsQuery(text) ? `${API}/${route}${ext}${query}` : `${API}/${route}/${shellSafeEncode(text)}${ext}${query}`;
};

/** Refresh the curl line and its clickable link */
const renderCurl = () => {
  const url = apiUrl(currentText());
  curl.textContent = `curl ${url}`;
  curlLink.href = url;
};

/** Word and character counts from the library's count() */
const countText = (text) => {
  const c = count(text);
  return `${c.words} words, ${c.characters} chars, ${c.charactersNoSpaces} without spaces, ${c.spaces} spaces`;
};

/** Badge URL for the current text, using the selected style (or title); ?text= when the path would misread it */
const badgeUrl = (text) => {
  const style = STYLES.includes(selectedStyle) ? selectedStyle : 'title';
  return needsQuery(text)
    ? `${API}/badge/${style}?text=${shellSafeEncode(text)}&label=capstring`
    : `${API}/badge/${style}/${shellSafeEncode(text)}?label=capstring`;
};

/** Ask the API to spell-correct the text; stale responses are dropped */
const renderSpell = async (text) => {
  const el = outputs.get('spell');
  const mine = ++spellRequest;
  try {
    const res = await fetch(`${API}/spell?text=${encodeURIComponent(text.slice(0, 500))}`);
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
  outputs.get('badge').src = badgeUrl(text);
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
  const value = style === 'badge' ? `![capstring](${outputs.get('badge').src})` : outputs.get(style).textContent;
  selectedStyle = style;
  for (const el of results.querySelectorAll('.row.selected')) el.classList.remove('selected');
  btn.classList.add('selected');
  renderCurl();
  syncUrl();
  if (style === 'badge') outputs.get('badge').src = badgeUrl(currentText());
  if (await copy(value, style === 'badge' ? 'badge markdown' : `${style}: ${value}`)) {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 600);
  }
});

document.getElementById('copy-curl').addEventListener('click', () => copy(curl.textContent, 'curl command'));

const params = new URLSearchParams(location.search);
if (params.get('t')) input.value = params.get('t');
if ([...STYLES, ...TOOLS, ...API_ONLY].includes(params.get('style'))) selectedStyle = params.get('style');
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
