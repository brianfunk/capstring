/**
 * Shared header and footer for every capstring page (playground, API docs, developer docs, 404).
 * Plain script, no module, so it works inside the Docsify shell too. The nav is a div, not <nav>,
 * because Docsify claims the first <nav> element on the page as its own navbar.
 * Usage: <header data-site-header></header> ... <footer data-site-footer></footer> + <script src="/site.js"></script>
 */
(() => {
  const NAV = [
    { href: '/', label: 'Playground' },
    { href: '/dev/', label: 'Developer Docs' },
    { href: '/docs/', label: 'API Reference' }
  ];
  const ICONS = {
    github: '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
    npm: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect width="24" height="24" rx="3" fill="#cb3837"/><path fill="#fff" d="M4 4h16v16H4z M6 6v12h6V9h3v9h3V6z" fill-rule="evenodd"/></svg>',
    sun: '<svg class="sun" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="moon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    mit: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3zm0 2.2 6 2.3V11c0 4-2.6 7.6-6 9-3.4-1.4-6-5-6-9V6.5l6-2.3z"/><path fill="currentColor" d="M8.2 9h1.3l1.5 3.4L12.5 9h1.3v6h-1.1v-3.7l-1.3 2.9h-.8l-1.3-2.9V15H8.2V9z"/></svg>'
  };
  const year = new Date().getFullYear();
  const path = location.pathname;

  const header = document.querySelector('[data-site-header]');
  if (header) {
    header.innerHTML = `
      <a class="site-brand" href="/" aria-label="capstring home">
        <img src="/icon.svg" alt="" width="36" height="36">
        <span class="site-wordmark">cApStRiNg</span>
      </a>
      <div class="site-nav" role="navigation" aria-label="Site">
        ${NAV.map((n) => `<a href="${n.href}"${(n.href === '/' ? path === '/' : path.startsWith(n.href)) ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')}
      </div>
      <div class="site-links">
        <a href="https://github.com/brianfunk/capstring" title="GitHub" aria-label="GitHub repository">${ICONS.github}</a>
        <a href="https://www.npmjs.com/package/capstring" title="npm" aria-label="npm package">${ICONS.npm}</a>
        <button type="button" class="theme-toggle" title="Toggle light / dark" aria-label="Toggle light or dark theme">${ICONS.sun}${ICONS.moon}</button>
      </div>`;
    header.querySelector('.theme-toggle').addEventListener('click', () => {
      const api = window.capstringTheme;
      if (api) api.set(api.get() === 'dark' ? 'light' : 'dark');
    });
  }

  const footer = document.querySelector('[data-site-footer]');
  if (footer) {
    footer.innerHTML = `
      <div class="site-footer-links">
        <a href="https://github.com/brianfunk/capstring">${ICONS.github}<span>GitHub</span></a>
        <a href="https://www.npmjs.com/package/capstring">${ICONS.npm}<span>npm</span></a>
        <a href="https://github.com/brianfunk/capstring/blob/master/LICENSE">${ICONS.mit}<span>MIT license</span></a>
        <a href="/docs/">API Reference</a>
        <a href="/dev/">Developer Docs</a>
        <a href="/openapi.json">openapi.json</a>
      </div>
      <p class="site-copyright">© 2016–${year} capstring</p>`;
  }
})();
