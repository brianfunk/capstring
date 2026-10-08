// Runs synchronously in <head> on every page so the chosen theme is applied before first paint.
// Stored choice wins; otherwise follow the system preference and keep following it.
(() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let stored = null;
  try { stored = localStorage.getItem('capstring-theme'); } catch { /* storage may be blocked */ }
  const apply = () => { root.dataset.theme = stored === 'light' || stored === 'dark' ? stored : (media.matches ? 'dark' : 'light'); };
  apply();
  media.addEventListener('change', () => { if (!stored) apply(); });
  window.capstringTheme = {
    get: () => root.dataset.theme,
    set: (theme) => {
      stored = theme;
      try { localStorage.setItem('capstring-theme', theme); } catch { /* ignore */ }
      apply();
    }
  };
})();
