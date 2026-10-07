document.documentElement.classList.add('js');
/* A manual selection wins over the system preference on every page and locale. */
const themeToggle = document.querySelector('[data-theme-toggle]');
if (themeToggle) {
  const root = document.documentElement;
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  const renderTheme = theme => {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    themeToggle.querySelector('[data-theme-label]').textContent = dark ? themeToggle.dataset.lightLabel : themeToggle.dataset.darkLabel;
    themeToggle.setAttribute('aria-label', dark ? themeToggle.dataset.lightAction : themeToggle.dataset.darkAction);
  };
  renderTheme(root.dataset.theme || (systemTheme.matches ? 'dark' : 'light'));
  themeToggle.hidden = false;
  themeToggle.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.themePreference = 'manual';
    renderTheme(theme);
    try { localStorage.setItem('portfolio-theme', theme); } catch { /* Keep the toggle working without storage. */ }
  });
  systemTheme.addEventListener('change', e => {
    if (root.dataset.themePreference !== 'manual') renderTheme(e.matches ? 'dark' : 'light');
  });
}
/* Progressive enhancement: all reading and navigation work without JavaScript. */
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
if (menu && nav) {
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), {threshold:0.08});
  document.querySelectorAll('.reveal').forEach(el => { el.classList.add('will-reveal'); observer.observe(el); });
  // Avoid permanently hidden content if a browser suspends observation.
  setTimeout(() => document.querySelectorAll('.will-reveal').forEach(el => el.classList.add('is-visible')), 8000);
  reducedMotion.addEventListener('change',e=>{if(e.matches){observer.disconnect();document.querySelectorAll('.will-reveal').forEach(el=>el.classList.add('is-visible'));}});
}
const dialog = document.querySelector('.lightbox');
if (dialog && typeof dialog.showModal === 'function') {
  let opener;
  const image = dialog.querySelector('img');
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    opener = button; image.src = button.dataset.zoom; image.alt = button.dataset.alt;
    dialog.querySelector('.lightbox-caption').textContent = button.dataset.caption || '';
    dialog.showModal(); document.body.classList.add('modal-open');
  }));
  dialog.querySelector('.lightbox-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus({preventScroll:true});});
} else {
  document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{location.href=button.dataset.zoom;}));
}
document.querySelectorAll('video').forEach(video => {
  const error = () => { const message = video.parentElement.querySelector('.video-error'); if(message) message.hidden=false; };
  video.addEventListener('error',error);video.querySelector('source')?.addEventListener('error',error);
});

/* Pointer-driven glass: stable entry bounds avoid tilt feedback; no loop while idle. */
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const glassResets = [];
document.querySelectorAll('.glass-panel').forEach(panel => {
  let bounds = null;
  let frame = 0;
  let point = null;
  const reset = () => {
    cancelAnimationFrame(frame); frame = 0; bounds = null; point = null;
    panel.classList.remove('is-tracking');
    ['--tilt-x','--tilt-y','--glass-x','--glass-y'].forEach(name => panel.style.removeProperty(name));
  };
  glassResets.push(reset);
  panel.addEventListener('pointerenter', event => {
    if (panel.classList.contains('has-active-preview')) { reset(); return; }
    if (event.pointerType !== 'mouse' || !finePointer.matches || reducedMotion.matches) return;
    bounds = panel.getBoundingClientRect();
  });
  panel.addEventListener('pointermove', event => {
    if (panel.classList.contains('has-active-preview')) { reset(); return; }
    if (!bounds || reducedMotion.matches || !finePointer.matches) return;
    point = {x:event.clientX,y:event.clientY};
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (panel.classList.contains('has-active-preview')) { reset(); return; }
      if (!bounds || !point) return;
      const x = Math.max(0,Math.min(1,(point.x-bounds.left)/bounds.width));
      const y = Math.max(0,Math.min(1,(point.y-bounds.top)/bounds.height));
      panel.style.setProperty('--tilt-x', `${(0.5-y)*8}deg`);
      panel.style.setProperty('--tilt-y', `${(x-0.5)*10}deg`);
      panel.style.setProperty('--glass-x', `${x*100}%`);
      panel.style.setProperty('--glass-y', `${y*100}%`);
      panel.classList.add('is-tracking');
    });
  });
  panel.addEventListener('pointerleave',reset);
  panel.addEventListener('pointercancel',reset);
});
const resetGlass = () => glassResets.forEach(reset=>reset());
window.addEventListener('blur',resetGlass);
window.addEventListener('resize',resetGlass,{passive:true});
window.addEventListener('scroll',resetGlass,{passive:true});
reducedMotion.addEventListener('change',resetGlass);
finePointer.addEventListener('change',resetGlass);
// Language is encoded in the URL: shareable, works without storage or JavaScript.
const languageSwitch = document.querySelector('[data-language-switch]');
if (languageSwitch) {
  const alternatePath = languageSwitch.getAttribute('href');
  const preserveSection = () => { languageSwitch.href = alternatePath + location.hash; };
  preserveSection();
  window.addEventListener('hashchange', preserveSection);
}
