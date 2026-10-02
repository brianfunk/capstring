import { capstringAll, STYLES, CATEGORIES } from './capstring.js';

const API = `${location.origin}/api`;
const LABELS = { case: 'Case', code: 'Code', fun: 'Fun', encoding: 'Encodings', art: 'Unicode Art' };
const DEFAULT_TEXT = 'hello world';

const input = document.getElementById('t');
const results = document.getElementById('results');
const curl = document.getElementById('curl');
const toast = document.getElementById('toast');
const outputs = new Map();
let selectedStyle = null;
let toastTimer;

/** Build one section per category with a button row per style */
const buildRows = () => {
  for (const [category, styles] of Object.entries(CATEGORIES)) {
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
  document.getElementById('count').textContent = String(STYLES.length);
};

/** Current text, falling back to the default so the grid is never empty */
const currentText = () => input.value || DEFAULT_TEXT;

/** The curl command for the selected style (or all styles) */
const curlFor = (text) => {
  const path = selectedStyle ? `${selectedStyle}/${encodeURIComponent(text)}` : `all/${encodeURIComponent(text)}`;
  return `curl ${API}/${path}`;
};

/** Recompute every output and the curl line */
const render = () => {
  const text = currentText();
  const all = capstringAll(text);
  for (const [style, el] of outputs) el.textContent = all[style];
  curl.textContent = curlFor(text);
};

/** Show a transient toast message */
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
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

/** Keep the URL shareable: ?t=<text> */
const syncUrl = () => {
  const url = input.value ? `?t=${encodeURIComponent(input.value)}` : location.pathname;
  history.replaceState(null, '', url + location.hash);
};

let renderTimer;
input.addEventListener('input', () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    render();
    syncUrl();
  }, 60);
});

results.addEventListener('click', async (event) => {
  const btn = event.target.closest('.row');
  if (!btn) return;
  const style = btn.dataset.style;
  const value = outputs.get(style).textContent;
  selectedStyle = style;
  for (const el of results.querySelectorAll('.row.selected')) el.classList.remove('selected');
  btn.classList.add('selected');
  curl.textContent = curlFor(currentText());
  if (await copy(value, `${style}: ${value}`)) {
    btn.classList.add('copied');
    setTimeout(() => btn.classList.remove('copied'), 600);
  }
});

document.getElementById('copy-curl').addEventListener('click', () => copy(curl.textContent, 'curl command'));

const fromUrl = new URLSearchParams(location.search).get('t');
if (fromUrl) input.value = fromUrl;
buildRows();
render();
