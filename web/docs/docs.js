import capstring, { STYLES, CATEGORIES } from '../capstring.js';
import { CATEGORY_DOCS, STYLE_DOCS } from './styles-data.js';

/** The API base for whatever host is serving this page: localhost, Netlify, or a custom domain */
const API = `${location.origin}/api`;
const LANGS = [
  { id: 'node', label: 'Node', prism: 'javascript' },
  { id: 'cli', label: 'CLI', prism: 'bash' }
];

const q = (s) => JSON.stringify(s);
/** Show an output in a code comment, escaping line breaks */
const show = (s) => s.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
const pad = (code, width) => code.padEnd(width);

// ---------- code samples per section ----------

/** Samples for one style, outputs computed live */
const styleSamples = (style) => {
  const inputs = STYLE_DOCS[style].examples;
  return {
    node: `import capstring from 'capstring';\n\n${inputs.map((i) => `${pad(`capstring(${q(i)}, ${q(style)});`, 46)} // ${q(show(capstring(i, style)))}`).join('\n')}`,
    cli: inputs.map((i) => `$ npx capstring ${style} ${q(i)}\n${show(capstring(i, style))}`).join('\n\n')
  };
};

const SAMPLES = {
  overview: {
    node: `import capstring, { capstringAll } from 'capstring';\n\n${['title', 'kebab', 'sponge', 'flip'].map((s) => `${pad(`capstring('hello world', ${q(s)});`, 40)} // ${q(capstring('hello world', s))}`).join('\n')}\n\ncapstringAll('hello world').morse;      // ${q(capstring('hello world', 'morse'))}`,
    cli: `$ npx capstring kebab "hello world"\n${capstring('hello world', 'kebab')}\n\n$ echo "hello world" | npx capstring title\n${capstring('hello world', 'title')}\n\n$ npx capstring --all "hello world"\n${STYLES.slice(0, 6).map((s) => `${s.padEnd(12)}${capstring('hello world', s)}`).join('\n')}\n...`
  },
  install: {
    node: '// npm install capstring\nimport capstring from \'capstring\';\n\n// named exports\nimport { capstring, capstringAll, getStyles, isValidStyle, STYLES, CATEGORIES } from \'capstring\';\n\n// browser, no bundler\nimport capstring from \'https://cdn.jsdelivr.net/npm/capstring@1/index.js\';',
    cli: '$ npm install capstring\n$ pnpm add capstring\n$ yarn add capstring\n$ bun add capstring\n\n# or run the CLI without installing\n$ npx capstring --version'
  },
  transform: {
    node: `import capstring from 'capstring';\n\ncapstring('hello world', 'camel');     // ${q(capstring('hello world', 'camel'))}\ncapstring('hello world');              // ${q(capstring('hello world'))} (default: same)\ncapstring('');                         // ''\ncapstring(123, 'upper');               // false\ncapstring('hello world', 'nope');      // 'hello world' (unknown style returns input)`,
    cli: `$ npx capstring camel "hello world"\n${capstring('hello world', 'camel')}\n\n$ npx capstring nope "hello world"; echo "exit $?"\ncapstring: unknown style "nope". Run 'capstring --list' to see all styles.\nexit 2`
  },
  strict: {
    node: 'import capstring from \'capstring\';\n\ncapstring(123, \'title\', { strict: true });\n// TypeError: capstring: expected a string, got number\n\ncapstring(\'hello world\', \'nope\', { strict: true });\n// RangeError: capstring: unknown style "nope". Use getStyles() to list valid styles.',
    cli: '# The CLI is always strict: unknown styles exit 2\n$ npx capstring nope "hello world"\ncapstring: unknown style "nope". Run \'capstring --list\' to see all styles.'
  },
  all: {
    node: `import { capstringAll } from 'capstring';\n\nconst all = capstringAll('hello world');\nall.kebab;         // ${q(capstring('hello world', 'kebab'))}\nall.acronym;       // ${q(capstring('hello world', 'acronym'))}\nObject.keys(all);  // every style, in canonical order`,
    cli: `$ npx capstring --all "hello world"\n${STYLES.slice(0, 8).map((s) => `${s.padEnd(12)}${capstring('hello world', s)}`).join('\n')}\n...\n\n$ npx capstring --all --json "hello world"\n{\n  "same": "hello world",\n  "none": "",\n  ...\n}`
  },
  discover: {
    node: `import { STYLES, CATEGORIES, getStyles, isValidStyle } from 'capstring';\n\nSTYLES;                 // frozen array of every style name\nCATEGORIES.code;        // [${CATEGORIES.code.slice(0, 4).map((s) => `'${s}'`).join(', ')}, ...]\ngetStyles();            // a fresh copy you can mutate\nisValidStyle('kebab');  // true`,
    cli: `$ npx capstring --list\n${STYLES.slice(0, 6).join('\n')}\n...\n\n$ npx capstring --list --json\n${JSON.stringify(STYLES.slice(0, 4)).replace(']', ', ...]')}`
  },
  cli: {
    node: '// The CLI is a thin wrapper around the library:\n// cli.js exports main(argv, io) so it is testable without a process.\nimport { main } from \'capstring/cli.js\';',
    cli: `# quick start: npx runs it without installing\n$ npx capstring title hello world\nHello World\n\n# or install globally once\n$ npm install -g capstring\n$ capstring title hello world\nHello World\n\n$ capstring snake "hello world" --json\n{"input":"hello world","style":"snake","output":"hello_world"}\n\n$ echo "hello world" | capstring sponge\n${capstring('hello world', 'sponge')}\n\n$ capstring --count "hello world"\nwords: 2, chars: 11, chars (no spaces): 10, spaces: 1\n\n$ git branch --show-current | capstring slug\n\n$ pbpaste | capstring upper | pbcopy\n\n$ capstring upper -- --not-a-flag\n--NOT-A-FLAG`
  },
  typescript: {
    node: { lang: 'typescript', code: 'import capstring, { capstringAll, isValidStyle, type Style, type Category } from \'capstring\';\n\nconst style: Style = \'kebab\';          // autocompletes every style\nconst bad: Style = \'kebap\';            // error: not assignable to Style\nconst group: Category = \'encoding\';    // \'case\' | \'code\' | \'fun\' | \'encoding\' | \'art\'\n\ncapstring(\'hello world\', \'upper\');     // string\ncapstring(value as unknown, \'upper\');  // string | false\ncapstringAll(\'hello world\');           // Record<Style, string>\n\nif (isValidStyle(input)) capstring(\'hello world\', input); // input narrowed to Style' },
    cli: '# Nothing to configure. Types are in the package.\n$ npm install capstring\n$ npx tsc --noEmit'
  },
  http: {
    node: `const res = await fetch('${API}/kebab/hello%20world');\nconst { output } = await res.json();   // ${q(capstring('hello world', 'kebab'))}\n\n// batch\nconst batch = await fetch('${API}/batch', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ style: 'slug', texts: ['hello world', 'Hello World'] })\n}).then((r) => r.json());\nbatch.results.map((r) => r.output);     // ['hello-world', 'hello-world']`,
    cli: `$ curl ${API}/title/hello%20world\n{"input":"hello world","style":"title","output":"Hello World"}\n\n$ curl -X POST ${API}/batch \\\n  -H "Content-Type: application/json" \\\n  -d '{"style":"slug","texts":["hello world","Hello World"]}'\n\n$ curl "${API}/spell/helo%20wrld?style=title"\n\n$ curl ${API}/count/hello%20world.txt\nwords: 2, chars: 11, chars (no spaces): 10\n\n$ curl ${API}/lorem/5.txt\n\n$ curl -o badge.svg ${API}/badge/sponge/hello%20world`
  },
  formats: {
    node: `// Pick a format with an extension, ?format=, or an Accept header\nawait fetch('${API}/title/hello%20world.txt').then((r) => r.text());       // 'Hello World'\nawait fetch('${API}/title/hello%20world?format=yaml').then((r) => r.text());\nawait fetch('${API}/title/hello%20world', { headers: { Accept: 'text/csv' } }).then((r) => r.text());`,
    cli: `$ curl ${API}/title/hello%20world.txt\nHello World\n\n$ curl ${API}/title/hello%20world.yaml\ninput: "hello world"\nstyle: "title"\noutput: "Hello World"\n\n$ curl ${API}/title/hello%20world.csv\ninput,style,output\n"hello world","title","Hello World"\n\n$ curl -o hello.png ${API}/flip/hello%20world.png   # the result as an image (.svg too)

$ curl -H "Accept: application/xml" ${API}/title/hello%20world\n<?xml version="1.0" encoding="UTF-8"?>\n<result>\n  <input>hello world</input>\n  <style>title</style>\n  <output>Hello World</output>\n</result>`
  },
  limits: {
    node: `const res = await fetch('${API}/upper/' + 'a'.repeat(10001));\nres.status;                    // 413\n(await res.json()).error.code; // 'text_too_long'`,
    cli: `$ curl -i ${API}/upper/hello%20world | grep -i cache-control\ncache-control: public, max-age=86400\n\n$ curl -i ${API}/random/hello%20world | grep -i cache-control\ncache-control: no-store`
  },
  package: {
    node: '// What you get after npm install capstring\n// node_modules/capstring/\n//   index.js        the library\n//   index.d.ts      types\n//   cli.js          CLI logic\n//   bin/capstring.js\n//   package.json, README.md, LICENSE',
    cli: '$ npm pack capstring --dry-run\nnpm notice package size: ~15 kB\nnpm notice unpacked size: ~36 kB\nnpm notice total files: 7'
  }
};

// ---------- helpers ----------

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.append(child);
  return node;
};

let lang = 'node';
try { lang = localStorage.getItem('capstring-docs-lang') || 'node'; } catch { /* ignore */ }
if (!LANGS.some((l) => l.id === lang)) lang = 'node';
const sampleBlocks = [];

/** Build an inline sample block with Node / CLI tabs; all blocks switch together */
const sampleBlock = (samples) => {
  const tabs = el('div', { class: 'sample-tabs', role: 'tablist' });
  const code = el('code');
  const pre = el('pre', {}, [code]);
  const block = el('div', { class: 'sample' }, [tabs, pre]);
  const render = () => {
    for (const b of tabs.querySelectorAll('[role="tab"]')) b.setAttribute('aria-selected', String(b.dataset.lang === lang));
    const entry = samples[lang] ?? samples.node;
    const text = typeof entry === 'string' ? entry : entry.code;
    const prism = typeof entry === 'string' ? LANGS.find((l) => l.id === lang).prism : entry.lang;
    code.className = `language-${prism}`;
    code.textContent = text;
    if (window.Prism) window.Prism.highlightElement(code);
  };
  for (const l of LANGS) {
    const b = el('button', { type: 'button', role: 'tab', 'data-lang': l.id, text: l.label });
    b.addEventListener('click', () => {
      lang = l.id;
      try { localStorage.setItem('capstring-docs-lang', lang); } catch { /* ignore */ }
      for (const r of sampleBlocks) r();
    });
    tabs.append(b);
  }
  const copy = el('button', { type: 'button', class: 'copy', text: 'Copy' });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      copy.textContent = 'Copied';
    } catch {
      copy.textContent = 'Copy failed';
    }
    setTimeout(() => { copy.textContent = 'Copy'; }, 1200);
  });
  tabs.append(copy);
  sampleBlocks.push(render);
  render();
  return block;
};

// ---------- inline samples for the fixed sections ----------

for (const section of document.querySelectorAll('.prose section[data-sample]')) {
  const samples = SAMPLES[section.dataset.sample];
  if (samples) section.append(sampleBlock(samples));
}

// ---------- style docs ----------

const styleDocs = document.getElementById('style-docs');
for (const [category, styles] of Object.entries(CATEGORIES)) {
  const doc = CATEGORY_DOCS[category];
  const section = el('section', { id: `cat-${category}`, class: 'category' }, [
    el('h2', { text: doc.title }),
    el('p', { class: 'category-intro', text: doc.intro })
  ]);
  for (const style of styles) {
    const d = STYLE_DOCS[style];
    const table = el('table', {}, [el('tr', {}, [el('th', { text: 'Input' }), el('th', { text: 'Output' })])]);
    for (const input of d.examples) {
      table.append(el('tr', {}, [el('td', { text: input }), el('td', { text: capstring(input, style) })]));
    }
    const entry = el('article', { id: `style-${style}`, class: 'style-entry' }, [
      el('h3', {}, [el('code', { text: style })]),
      el('p', { class: 'summary', text: d.summary }),
      el('p', { class: 'detail', text: d.detail }),
      table
    ]);
    if (d.notes) entry.append(el('ul', { class: 'notes' }, d.notes.map((n) => el('li', { text: n }))));
    entry.append(sampleBlock(styleSamples(style)));
    entry.append(el('p', { class: 'try' }, [el('a', { href: `/?t=hello+world&style=${style}`, text: `Try ${style} in the playground →` })]));
    section.append(entry);
  }
  styleDocs.append(section);
}

// ---------- table of contents ----------

const tocList = document.getElementById('toc');
const tocItems = [];
const addToc = (id, label, level) => {
  const li = el('li', { class: `l${level}` }, [el('a', { href: `#${id}`, text: label })]);
  tocList.append(li);
  tocItems.push({ id, li, text: label.toLowerCase() });
};
for (const section of document.querySelectorAll('.prose > section')) {
  addToc(section.id, section.querySelector('h1, h2').textContent, 1);
  // The Styles section nests one section per category; list each category once with its styles under it
  for (const category of section.querySelectorAll(':scope > #style-docs > section.category')) {
    addToc(category.id, category.querySelector('h2').textContent, 2);
    for (const entry of category.querySelectorAll('.style-entry')) addToc(entry.id, entry.id.replace('style-', ''), 3);
  }
}

document.getElementById('toc-filter').addEventListener('input', (e) => {
  const needle = e.target.value.trim().toLowerCase();
  for (const item of tocItems) item.li.classList.toggle('hidden', needle !== '' && !item.text.includes(needle));
});

// ---------- scroll spy for the sidebar ----------

const targets = tocItems.map((i) => document.getElementById(i.id));
const spy = () => {
  let best = targets[0];
  for (const t of targets) if (t.getBoundingClientRect().top <= 120) best = t;
  for (const item of tocItems) item.li.querySelector('a').toggleAttribute('aria-current', item.id === best.id);
};
addEventListener('scroll', spy, { passive: true });
addEventListener('hashchange', () => setTimeout(spy, 50));
spy();
