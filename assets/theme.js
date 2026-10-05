/* Runs before styles so the saved appearance is applied before the first paint. */
(() => {
  const root = document.documentElement;
  let saved;
  try { saved = localStorage.getItem('portfolio-theme'); } catch { /* Storage may be unavailable. */ }
  const manual = saved === 'light' || saved === 'dark';
  root.dataset.theme = manual ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.dataset.themePreference = manual ? 'manual' : 'system';
})();
