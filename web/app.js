import capstring, { capstringAll, STYLES, CATEGORIES } from './capstring.js';

const API = `${location.origin}/api`;
const LABELS = { case: 'Case', code: 'Code', fun: 'Fun', encoding: 'Encodings', art: 'Unicode Art' };
const DEFAULT_TEXT = 'hello world';
const MAX_CHAIN = 10;
const MAX_CHAIN_OUTPUT = 20000; // binary/morse expand ~9x per step; keep shared URLs from allocating huge strings

const input = document.getElementById('t');
const results = document.getElementById('results');
const curl = document.getElementById('curl');
const curlLink = document.getElementById('curl-link');
const formatSelect = document.getElementById('format');
const toast = document.getElementById('toast');
const chainBar = document.getElementById('chain');
const chainList = document.getElementById('chain-list');
const chainOut = document.getElementById('chain-out');
const spellButton = document.getElementById('spell');
const outputs = new Map();
let selectedStyle = null;
let chain = [];
let toastTimer;

/** Build one section per category with a copy row and an add-to-chain button per style */
const buildRows = () => {
  for (const [category, styles] of Object.entries(CATEGORIES)) {
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = `${LABELS[category] ?? category} (${styles.length})`;
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
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'add';
      add.dataset.add = style;
      add.textContent = '+';
      add.title = `Add ${style} to chain`;
      add.setAttribute('aria-label', `Add ${style} to chain`);
      li.append(btn, add);
      ul.append(li);
      outputs.set(style, out);
    }
    section.append(h2, ul);
    results.append(section);
  }
  document.getElementById('count').textContent = `in ${STYLES.length} ways`; // the only place the count appears, and it is computed
};

/** Current text, falling back to the default so the grid is never empty */
const currentText = () => input.value || DEFAULT_TEXT;

/** encodeURIComponent plus the shell metacharacters it leaves alone (' ( ) * !), so the curl line pastes cleanly */
const shellSafeEncode = (text) => encodeURIComponent(text).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** Output of the current chain applied to the current text, stopping once it grows past the bound */
const chainResult = () => {
  let acc = currentText();
  for (const s of chain) {
    acc = capstring(acc, s);
    if (acc.length > MAX_CHAIN_OUTPUT) return `(output exceeds ${MAX_CHAIN_OUTPUT} characters at "${s}"; shorten the text or the chain)`;
  }
  return acc;
};

/** The API URL for the chain, the selected style, or all styles, with the chosen format extension */
const apiUrl = (text) => {
  const format = formatSelect.value;
  const encoded = shellSafeEncode(text);
  const path = chain.length ? `chain/${chain.join('+')}/${encoded}` : selectedStyle ? `${selectedStyle}/${encoded}` : `all/${encoded}`;
  const ext = format === 'json' ? '' : `.${format}`;
  const query = format === 'jsonp' ? '?callback=cb' : '';
  return `${API}/${path}${ext}${query}`;
};

/** Render the chain bar */
const renderChain = () => {
  chainBar.hidden = chain.length === 0;
  chainList.replaceChildren(...chain.map((style, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.remove = String(i);
    chip.textContent = `${style} ×`;
    chip.setAttribute('aria-label', `Remove ${style} from chain`);
    return chip;
  }));
  chainOut.textContent = chain.length ? chainResult() : '';
};

/** Refresh the curl line and its clickable link */
const renderCurl = () => {
  const url = apiUrl(currentText());
  curl.textContent = `curl ${url}`;
  curlLink.href = url;
};

/** Recompute every output, the chain, and the curl line */
const render = () => {
  const all = capstringAll(currentText());
  for (const [style, el] of outputs) el.textContent = all[style];
  renderChain();
  renderCurl();
};

/** Show a transient toast message */
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
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

/** Keep the URL shareable: ?t=<text>&style=<style>&chain=a+b&format=txt */
const syncUrl = () => {
  const parts = [];
  if (input.value) parts.push(`t=${encodeURIComponent(input.value)}`);
  if (selectedStyle) parts.push(`style=${selectedStyle}`);
  if (chain.length) parts.push(`chain=${chain.join('+')}`); // style names are [a-z0-9]+, safe unencoded
  if (formatSelect.value !== 'json') parts.push(`format=${formatSelect.value}`);
  history.replaceState(null, '', (parts.length ? `?${parts.join('&')}` : location.pathname) + location.hash);
};

let renderTimer;
input.addEventListener('input', () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    render();
    syncUrl();
  }, 60);
});

formatSelect.addEventListener('change', () => {
  renderCurl();
  syncUrl();
});

results.addEventListener('click', async (event) => {
  const add = event.target.closest('.add');
  if (add) {
    if (chain.length >= MAX_CHAIN) {
      showToast(`Chains are limited to ${MAX_CHAIN} styles`);
      return;
    }
    chain.push(add.dataset.add);
    render();
    syncUrl();
    return;
  }
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

chainBar.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-remove]');
  if (chip) {
    chain.splice(Number(chip.dataset.remove), 1);
    render();
    syncUrl();
  }
});

document.getElementById('chain-copy').addEventListener('click', () => {
  const value = chainOut.textContent; // copy exactly what is shown (random would differ on recompute)
  copy(value, `chain: ${value}`);
});
document.getElementById('chain-clear').addEventListener('click', () => {
  chain = [];
  render();
  syncUrl();
});
document.getElementById('copy-curl').addEventListener('click', () => copy(curl.textContent, 'curl command'));

spellButton.addEventListener('click', async () => {
  const text = input.value.trim();
  if (!text) return;
  spellButton.disabled = true;
  try {
    const res = await fetch(`${API}/spell/${encodeURIComponent(text)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? res.statusText);
    if (data.output !== text) {
      input.value = data.output;
      render();
      syncUrl();
      const n = data.corrections.length;
      showToast(`Fixed ${n} word${n === 1 ? '' : 's'}: ${data.corrections.map((c) => `${c.from} → ${c.to}`).join(', ')}`);
    } else {
      showToast('Looks right already');
    }
  } catch (err) {
    showToast(`Spell check failed: ${err.message}`);
  } finally {
    spellButton.disabled = false;
  }
});

const params = new URLSearchParams(location.search);
if (params.get('t')) input.value = params.get('t');
if (STYLES.includes(params.get('style'))) selectedStyle = params.get('style');
chain = (params.get('chain') ?? '').split(/[+,\s]/).filter((s) => STYLES.includes(s)).slice(0, MAX_CHAIN);
if ([...formatSelect.options].some((o) => o.value === params.get('format'))) formatSelect.value = params.get('format');
buildRows();
if (selectedStyle) results.querySelector(`.row[data-style="${selectedStyle}"]`)?.classList.add('selected');
render();

fetch(API)
  .then((res) => res.json())
  .then(({ version }) => {
    document.getElementById('api-version').textContent = `API v${version}`;
  })
  .catch(() => { /* decorative */ });
