import capstring, { STYLES, CATEGORIES } from '../capstring.js';
import { CATEGORY_DOCS, STYLE_DOCS } from './styles-data.js';

const API = 'https://capstring.netlify.app/api';
const LANGS = [
  { id: 'js', label: 'Node', prism: 'javascript' },
  { id: 'ts', label: 'TypeScript', prism: 'typescript' },
  { id: 'cli', label: 'CLI', prism: 'bash' },
  { id: 'curl', label: 'curl', prism: 'bash' },
  { id: 'py', label: 'Python', prism: 'python' }
];

const q = (s) => JSON.stringify(s);
const enc = (s) => encodeURIComponent(s);
/** Show an output in a code comment, escaping line breaks */
const show = (s) => s.replace(/\r/g, '\\r').replace(/\n/g, '\\n');

// ---------- code samples per section ----------

/** Samples for one style: every language, outputs computed live */
const styleSamples = (style) => {
  const inputs = STYLE_DOCS[style].examples;
  const line = (input) => `capstring(${q(input)}, ${q(style)});`.padEnd(46) + ` // ${q(show(capstring(input, style)))}`;
  return {
    js: `import capstring from 'capstring';\n\n${inputs.map(line).join('\n')}`,
    ts: `import capstring, { type Style } from 'capstring';\n\nconst style: Style = ${q(style)};\n${inputs.map((i) => `capstring(${q(i)}, style);`.padEnd(46) + ` // ${q(show(capstring(i, style)))}`).join('\n')}`,
    cli: inputs.map((i) => `$ npx capstring ${style} ${q(i)}\n${show(capstring(i, style))}`).join('\n\n'),
    curl: inputs.slice(0, 2).map((i) => `$ curl ${API}/${style}/${enc(i)}.txt\n${show(capstring(i, style))}`).join('\n\n') +
      `\n\n$ curl ${API}/${style}/${enc(inputs[0])}\n${JSON.stringify({ input: inputs[0], style, output: capstring(inputs[0], style) })}`,
    py: `import requests\nfrom urllib.parse import quote\n\n${inputs.slice(0, 2).map((i) => `r = requests.get(f"${API}/${style}/{quote(${q(i)})}")\nprint(r.json()["output"])  # ${show(capstring(i, style))}`).join('\n\n')}`
  };
};

const SAMPLES = {
  overview: {
    js: `import capstring, { capstringAll } from 'capstring';\n\ncapstring('hello world', 'title');     // ${q(capstring('hello world', 'title'))}\ncapstring('hello world', 'kebab');     // ${q(capstring('hello world', 'kebab'))}\ncapstring('hello world', 'sponge');    // ${q(capstring('hello world', 'sponge'))}\ncapstring('hello world', 'flip');      // ${q(capstring('hello world', 'flip'))}\n\ncapstringAll('hello world').morse;     // ${q(capstring('hello world', 'morse'))}`,
    ts: `import capstring, { type Style } from 'capstring';\n\nconst style: Style = 'kebab';            // autocompletes every style\ncapstring('hello world', style);         // ${q(capstring('hello world', 'kebab'))}`,
    cli: `$ npx capstring kebab "hello world"\n${capstring('hello world', 'kebab')}\n\n$ echo "hello world" | npx capstring title\n${capstring('hello world', 'title')}\n\n$ npx capstring --all "hello world"\n${STYLES.slice(0, 6).map((s) => `${s.padEnd(12)}${capstring('hello world', s)}`).join('\n')}\n...`,
    curl: `$ curl ${API}/title/hello%20world\n${JSON.stringify({ input: 'hello world', style: 'title', output: 'Hello World' })}\n\n$ curl ${API}/sponge/hello%20world.txt\n${capstring('hello world', 'sponge')}`,
    py: `import requests\n\nr = requests.get("${API}/title/hello%20world")\nprint(r.json()["output"])  # Hello World`
  },
  install: {
    js: '// npm install capstring\nimport capstring from \'capstring\';\n\n// named exports\nimport { capstring, capstringAll, getStyles, isValidStyle, STYLES, CATEGORIES } from \'capstring\';\n\n// browser, no bundler\nimport capstring from \'https://cdn.jsdelivr.net/npm/capstring@1/index.js\';',
    ts: '// Types ship with the package: no @types install\nimport capstring, { type Style, type Category } from \'capstring\';',
    cli: '$ npm install capstring\n$ pnpm add capstring\n$ yarn add capstring\n$ bun add capstring\n\n# or run the CLI without installing\n$ npx capstring --version',
    curl: `# Nothing to install. The HTTP API is public.\n$ curl ${API}/styles.txt | head -5\n${STYLES.slice(0, 5).join('\n')}`,
    py: `# No package needed, use the HTTP API\nimport requests\nr = requests.get("${API}/upper/hello%20world")\nprint(r.json()["output"])  # HELLO WORLD`
  },
  transform: {
    js: `import capstring from 'capstring';\n\ncapstring('hello world', 'camel');     // ${q(capstring('hello world', 'camel'))}\ncapstring('hello world');              // ${q(capstring('hello world'))} (default: same)\ncapstring('');                         // ''\ncapstring(123, 'upper');               // false\ncapstring('hello', 'not-a-style');     // 'hello' (unknown style returns input)`,
    ts: 'import capstring from \'capstring\';\n\nconst a = capstring(\'hello world\', \'camel\');   // string\nconst b = capstring(value as unknown, \'upper\'); // string | false',
    cli: `$ npx capstring camel "hello world"\n${capstring('hello world', 'camel')}\n\n$ npx capstring nope "hello world"; echo "exit $?"\ncapstring: unknown style "nope". Run 'capstring --list' to see all styles.\nexit 2`,
    curl: `$ curl ${API}/camel/hello%20world\n${JSON.stringify({ input: 'hello world', style: 'camel', output: capstring('hello world', 'camel') })}\n\n$ curl ${API}/nope/hello%20world\n{"error":{"code":"unknown_style","message":"Unknown style \\"nope\\". See /api/styles.","styles":[...]}}`,
    py: `import requests\n\nr = requests.get("${API}/camel/hello%20world")\nprint(r.json()["output"])  # ${capstring('hello world', 'camel')}`
  },
  strict: {
    js: 'import capstring from \'capstring\';\n\ncapstring(123, \'title\', { strict: true });\n// TypeError: capstring: expected a string, got number\n\ncapstring(\'hello world\', \'nope\', { strict: true });\n// RangeError: capstring: unknown style "nope". Use getStyles() to list valid styles.',
    ts: 'import capstring, { type CapstringOptions } from \'capstring\';\n\nconst options: CapstringOptions = { strict: true };\ncapstring(\'hello world\', \'title\', options);',
    cli: '# The CLI is always strict: unknown styles exit 2\n$ npx capstring nope "hello world"\ncapstring: unknown style "nope". Run \'capstring --list\' to see all styles.',
    curl: `# The API is always strict: unknown styles are 404\n$ curl -i ${API}/nope/hello%20world | head -1\nHTTP/2 404`,
    py: `import requests\n\nr = requests.get("${API}/nope/hello%20world")\nr.status_code  # 404\nr.json()["error"]["code"]  # "unknown_style"`
  },
  all: {
    js: `import { capstringAll } from 'capstring';\n\nconst all = capstringAll('hello world');\nall.kebab;     // ${q(capstring('hello world', 'kebab'))}\nall.acronym;   // ${q(capstring('hello world', 'acronym'))}\nObject.keys(all);  // every style, in canonical order`,
    ts: 'import { capstringAll, type Style } from \'capstring\';\n\nconst all: Record<Style, string> = capstringAll(\'hello world\');',
    cli: `$ npx capstring --all "hello world"\n${STYLES.slice(0, 8).map((s) => `${s.padEnd(12)}${capstring('hello world', s)}`).join('\n')}\n...\n\n$ npx capstring --all --json "hello world"\n{\n  "same": "hello world",\n  "none": "",\n  ...\n}`,
    curl: `$ curl ${API}/all/hello%20world.txt | head -4\n${STYLES.slice(0, 4).map((s) => `${s}\t${capstring('hello world', s)}`).join('\n')}\n\n$ curl ${API}/all/hello%20world\n{"input":"hello world","count":${STYLES.length},"results":{"same":"hello world",...}}`,
    py: `import requests\n\nr = requests.get("${API}/all/hello%20world")\nfor style, output in r.json()["results"].items():\n    print(style, output)`
  },
  discover: {
    js: `import { STYLES, CATEGORIES, getStyles, isValidStyle } from 'capstring';\n\nSTYLES;                 // frozen array of every style name\nCATEGORIES.code;        // ${q(CATEGORIES.code.slice(0, 4)).replace(/"/g, "'")}, ...]\ngetStyles();            // a fresh copy you can mutate\nisValidStyle('kebab');  // true`,
    ts: 'import { isValidStyle, capstring } from \'capstring\';\n\nfunction transform(text: string, style: string) {\n  if (!isValidStyle(style)) throw new Error(`unknown style ${style}`);\n  return capstring(text, style); // style is Style here\n}',
    cli: `$ npx capstring --list\n${STYLES.slice(0, 6).join('\n')}\n...\n\n$ npx capstring --list --json\n${JSON.stringify(STYLES.slice(0, 4)).replace(']', ',...]')}`,
    curl: `$ curl ${API}/styles\n{"count":${STYLES.length},"styles":[...],"categories":{"case":[...],"code":[...],...}}\n\n$ curl ${API}/styles.txt`,
    py: `import requests\n\nstyles = requests.get("${API}/styles").json()\nstyles["count"]            # ${STYLES.length}\nstyles["categories"]["art"]`
  },
  styles: {
    js: `// Click a style in the sidebar to see samples for it.\nimport capstring from 'capstring';\n\n${CATEGORIES.case.slice(0, 5).map((s) => `capstring('hello world', ${q(s)});`.padEnd(40) + `// ${q(capstring('hello world', s))}`).join('\n')}`,
    ts: 'import capstring, { type Style } from \'capstring\';\n\nconst styles: Style[] = [\'title\', \'kebab\', \'sponge\'];\nstyles.map((s) => capstring(\'hello world\', s));',
    cli: '$ npx capstring --list',
    curl: `$ curl ${API}/styles.txt`,
    py: `import requests\nprint(requests.get("${API}/styles.txt").text)`
  },
  cli: {
    js: '// The CLI is a thin wrapper around the library.\n// cli.js exports main(argv, io) so it is testable without a process.\nimport { main } from \'capstring/cli.js\';',
    ts: '// Same as JavaScript; the CLI has no separate types.',
    cli: `$ npx capstring title hello world\nHello World\n\n$ npx capstring snake "hello world" --json\n{"input":"hello world","style":"snake","output":"hello_world"}\n\n$ echo "hello world" | npx capstring sponge\n${capstring('hello world', 'sponge')}\n\n$ git branch --show-current | npx capstring slug\n\n$ pbpaste | npx capstring upper | pbcopy\n\n$ npx capstring upper -- --not-a-flag\n--NOT-A-FLAG`,
    curl: `# No CLI needed: curl is the CLI\n$ curl ${API}/title/hello%20world.txt\nHello World`,
    py: 'import subprocess\n\nout = subprocess.run(["npx", "capstring", "kebab", "hello world"], capture_output=True, text=True)\nprint(out.stdout.strip())  # hello-world'
  },
  typescript: {
    js: '// Plain JavaScript gets the same autocomplete from the bundled index.d.ts\n// in editors that read JSDoc and .d.ts files.',
    ts: 'import capstring, { capstringAll, isValidStyle, type Style, type Category } from \'capstring\';\n\nconst style: Style = \'kebab\';          // autocompletes every style\nconst bad: Style = \'kebap\';            // error: not assignable to Style\nconst group: Category = \'encoding\';    // \'case\' | \'code\' | \'fun\' | \'encoding\' | \'art\'\n\ncapstring(\'hello world\', \'upper\');     // string\ncapstring(value as unknown, \'upper\');  // string | false\ncapstringAll(\'hello world\');           // Record<Style, string>\n\nif (isValidStyle(input)) capstring(\'hello world\', input); // input narrowed to Style',
    cli: '# Nothing to configure. Types are in the package.\n$ npm install capstring\n$ npx tsc --noEmit',
    curl: '# Types for the API responses are in the OpenAPI document\n$ curl https://capstring.netlify.app/openapi.json',
    py: '# Python clients can generate types from the OpenAPI document\n# https://capstring.netlify.app/openapi.json'
  },
  http: {
    js: `const res = await fetch('${API}/kebab/hello%20world');\nconst { output } = await res.json();   // ${q(capstring('hello world', 'kebab'))}\n\n// batch\nconst batch = await fetch('${API}/batch', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ style: 'slug', texts: ['hello world', 'Hello World'] })\n}).then((r) => r.json());\nbatch.results.map((r) => r.output);     // ['hello-world', 'hello-world']`,
    ts: `interface Transform { input: string; style: string; output: string }\n\nconst res = await fetch('${API}/kebab/hello%20world');\nconst data = (await res.json()) as Transform;`,
    cli: `$ curl ${API}/title/hello%20world\n{"input":"hello world","style":"title","output":"Hello World"}`,
    curl: `$ curl ${API}/title/hello%20world\n{"input":"hello world","style":"title","output":"Hello World"}\n\n$ curl -X POST ${API}/batch \\\n  -H "Content-Type: application/json" \\\n  -d '{"style":"slug","texts":["hello world","Hello World"]}'\n\n$ curl "${API}/spell/helo%20wrld?style=title"\n\n$ curl ${API}/count/hello%20world.txt\nwords: 2, chars: 11, chars (no spaces): 10\n\n$ curl ${API}/lorem/5.txt\n\n$ curl -o badge.svg ${API}/badge/sponge/hello%20world`,
    py: `import requests\nfrom urllib.parse import quote\n\nr = requests.get(f"${API}/title/{quote('hello world')}")\nprint(r.json()["output"])  # Hello World\n\nbatch = requests.post(f"${API}/batch", json={"style": "slug", "texts": ["hello world", "Hello World"]})\nprint([x["output"] for x in batch.json()["results"]])`
  },
  formats: {
    js: `// Pick a format with an extension, ?format=, or an Accept header\nawait fetch('${API}/title/hello%20world.txt').then((r) => r.text());             // 'Hello World'\nawait fetch('${API}/title/hello%20world?format=yaml').then((r) => r.text());\nawait fetch('${API}/title/hello%20world', { headers: { Accept: 'text/csv' } }).then((r) => r.text());`,
    ts: `const text: string = await fetch('${API}/title/hello%20world.txt').then((r) => r.text());`,
    cli: `$ curl ${API}/title/hello%20world.yaml`,
    curl: `$ curl ${API}/title/hello%20world.txt\nHello World\n\n$ curl ${API}/title/hello%20world.yaml\ninput: "hello world"\nstyle: "title"\noutput: "Hello World"\n\n$ curl ${API}/title/hello%20world.csv\ninput,style,output\n"hello world","title","Hello World"\n\n$ curl -H "Accept: application/xml" ${API}/title/hello%20world\n<?xml version="1.0" encoding="UTF-8"?>\n<result>\n  <input>hello world</input>\n  <style>title</style>\n  <output>Hello World</output>\n</result>\n\n$ curl "${API}/title/hello%20world.jsonp?callback=cb"\n/**/ typeof cb === 'function' && cb({"input":"hello world","style":"title","output":"Hello World"});`,
    py: `import requests\n\nprint(requests.get("${API}/title/hello%20world", headers={"Accept": "text/plain"}).text)  # Hello World\nprint(requests.get("${API}/title/hello%20world.yaml").text)`
  },
  limits: {
    js: `const res = await fetch('${API}/upper/' + 'a'.repeat(2001));\nres.status;                    // 413\n(await res.json()).error.code; // 'text_too_long'`,
    ts: 'interface ApiError { error: { code: string; message: string; styles?: string[] } }',
    cli: `$ curl -i ${API}/upper/hello%20world | grep -i cache-control\ncache-control: public, max-age=86400\n\n$ curl -i ${API}/random/hello%20world | grep -i cache-control\ncache-control: no-store`,
    curl: `$ curl -i ${API}/upper/hello%20world | grep -i cache-control\ncache-control: public, max-age=86400\n\n$ curl -i ${API}/random/hello%20world | grep -i cache-control\ncache-control: no-store`,
    py: `import requests\n\nr = requests.get("${API}/upper/" + "a" * 2001)\nr.status_code              # 413\nr.json()["error"]["code"]  # "text_too_long"`
  },
  package: {
    js: '// What you get after npm install capstring\n// node_modules/capstring/\n//   index.js        the library\n//   index.d.ts      types\n//   cli.js          CLI logic\n//   bin/capstring.js\n//   package.json, README.md, LICENSE',
    ts: '// index.d.ts is referenced from package.json "types" and the "exports" map',
    cli: '$ npm pack capstring --dry-run\nnpm notice package size: ~15 kB\nnpm notice unpacked size: ~36 kB\nnpm notice total files: 7',
    curl: '$ curl -s https://registry.npmjs.org/capstring/latest | jq \'{version, dependencies}\'',
    py: '# pip has no capstring package; use the HTTP API or the Node CLI'
  }
};

// ---------- build the style docs ----------

const styleDocs = document.getElementById('style-docs');
const tocList = document.getElementById('toc');

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const child of children) node.append(child);
  return node;
};

for (const [category, styles] of Object.entries(CATEGORIES)) {
  const doc = CATEGORY_DOCS[category];
  const section = el('section', { id: `cat-${category}`, 'data-sample': 'styles', class: 'category' }, [
    el('h2', { text: doc.title }),
    el('p', { class: 'category-intro', text: doc.intro })
  ]);
  for (const style of styles) {
    const d = STYLE_DOCS[style];
    const table = el('table', {}, [el('tr', {}, [el('th', { text: 'Input' }), el('th', { text: 'Output' })])]);
    for (const input of d.examples) {
      table.append(el('tr', {}, [el('td', { text: input }), el('td', { text: capstring(input, style) })]));
    }
    const entry = el('article', { id: `style-${style}`, class: 'style-entry', 'data-sample': `style:${style}` }, [
      el('h3', {}, [el('code', { text: style })]),
      el('p', { class: 'summary', text: d.summary }),
      el('p', { class: 'detail', text: d.detail }),
      table
    ]);
    if (d.notes) entry.append(el('ul', { class: 'notes' }, d.notes.map((n) => el('li', { text: n }))));
    entry.append(el('p', { class: 'try' }, [el('a', { href: `/?t=hello+world&style=${style}`, text: `Try ${style} in the playground →` })]));
    section.append(entry);
  }
  styleDocs.append(section);
}

// ---------- table of contents ----------

const tocItems = [];
for (const section of document.querySelectorAll('.prose section')) {
  const heading = section.querySelector('h1, h2');
  const level = section.classList.contains('category') ? 2 : 1;
  const li = el('li', { class: `l${level}` }, [el('a', { href: `#${section.id}`, text: heading.textContent })]);
  tocList.append(li);
  tocItems.push({ id: section.id, li, text: heading.textContent.toLowerCase() });
  for (const entry of section.querySelectorAll('.style-entry')) {
    const li3 = el('li', { class: 'l3' }, [el('a', { href: `#${entry.id}`, text: entry.id.replace('style-', '') })]);
    tocList.append(li3);
    tocItems.push({ id: entry.id, li: li3, text: entry.id.replace('style-', '') });
  }
}

document.getElementById('toc-filter').addEventListener('input', (e) => {
  const needle = e.target.value.trim().toLowerCase();
  for (const item of tocItems) item.li.classList.toggle('hidden', needle !== '' && !item.text.includes(needle));
});

// ---------- code panel ----------

const tabs = document.getElementById('lang-tabs');
const codeEl = document.getElementById('code-sample');
const codeTitle = document.getElementById('code-title');
let lang = 'js';
let currentSample = 'overview';
try { lang = localStorage.getItem('capstring-docs-lang') || 'js'; } catch { /* ignore */ }
if (!LANGS.some((l) => l.id === lang)) lang = 'js';

for (const l of LANGS) {
  const b = el('button', { type: 'button', role: 'tab', 'data-lang': l.id, text: l.label });
  b.addEventListener('click', () => {
    lang = l.id;
    try { localStorage.setItem('capstring-docs-lang', lang); } catch { /* ignore */ }
    renderCode();
  });
  tabs.append(b);
}

const sampleFor = (key) => (key.startsWith('style:') ? styleSamples(key.slice(6)) : SAMPLES[key] ?? SAMPLES.overview);

const renderCode = () => {
  for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.lang === lang));
  const samples = sampleFor(currentSample);
  const code = samples[lang] ?? samples.js;
  const prismLang = LANGS.find((l) => l.id === lang).prism;
  codeEl.className = `language-${prismLang}`;
  codeEl.textContent = code;
  if (window.Prism) window.Prism.highlightElement(codeEl);
  codeTitle.textContent = currentSample.startsWith('style:') ? `capstring('hello world', '${currentSample.slice(6)}')` : document.getElementById(currentSample)?.querySelector('h1, h2')?.textContent ?? '';
};

document.getElementById('code-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeEl.textContent);
    document.getElementById('code-copy').textContent = 'Copied';
  } catch {
    document.getElementById('code-copy').textContent = 'Copy failed';
  }
  setTimeout(() => { document.getElementById('code-copy').textContent = 'Copy'; }, 1200);
});

// ---------- scroll spy: the code panel and TOC follow the section in view ----------

const targets = [...document.querySelectorAll('[data-sample]')];
const setCurrent = (node) => {
  const key = node.dataset.sample;
  if (key !== currentSample) {
    currentSample = key;
    renderCode();
  }
  for (const item of tocItems) item.li.querySelector('a').removeAttribute('aria-current');
  const match = tocItems.find((i) => i.id === node.id);
  if (match) match.li.querySelector('a').setAttribute('aria-current', 'true');
};

const spy = () => {
  const line = 120;
  let best = targets[0];
  for (const t of targets) {
    if (t.getBoundingClientRect().top <= line) best = t;
  }
  setCurrent(best);
};
addEventListener('scroll', spy, { passive: true });
addEventListener('hashchange', () => setTimeout(spy, 50));
spy();
