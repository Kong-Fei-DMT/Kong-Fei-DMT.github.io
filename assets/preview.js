/* Load the external player only after an explicit request. A page owns at most one. */
(() => {
  let active = null;
  const stop = (restoreFocus = false) => {
    if (!active) return;
    const {container, frame, triggers, close, status, panel, opener} = active;
    frame.remove();
    container.classList.remove('is-previewing');
    panel?.classList.remove('has-active-preview');
    triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
    close.hidden = true;
    if (status) status.hidden = true;
    active = null;
    if (restoreFocus) opener.focus({preventScroll: true});
  };

  document.querySelectorAll('[data-video-preview]').forEach((container, index) => {
    const bvid = container.dataset.bvid;
    const stage = container.querySelector('.preview-stage');
    const triggers = [...container.querySelectorAll('[data-preview-trigger]')];
    const close = container.querySelector('[data-preview-close]');
    const status = container.querySelector('[data-preview-status]');
    if (!/^BV[0-9A-Za-z]{10}$/.test(bvid || '') || !stage || !close || !triggers.length) return;
    if (!stage.id) {
      let id = `video-preview-${index + 1}`;
      while (document.getElementById(id)) id += '-player';
      stage.id = id;
    }

    const start = opener => {
      if (active?.container === container) {
        active.opener = opener;
        close.focus({preventScroll: true});
        return;
      }
      stop();
      const frame = document.createElement('iframe');
      frame.src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}&autoplay=1&muted=1&danmaku=0&poster=1`;
      frame.title = container.dataset.frameTitle?.trim() || container.dataset.title?.trim() || 'Bilibili video preview';
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      const panel = container.closest('.glass-panel');
      active = {container, frame, triggers, close, status, panel, opener};
      stage.append(frame);
      container.classList.add('is-previewing');
      panel?.classList.add('has-active-preview');
      triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'true'));
      close.hidden = false;
      if (status) status.hidden = false;
      close.focus({preventScroll: true});
    };

    triggers.forEach(trigger => {
      trigger.setAttribute('role', 'button');
      trigger.setAttribute('aria-controls', stage.id);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', event => {
        // Keep native open-in-new-tab/window gestures and the no-JS external link.
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        start(trigger);
      });
      trigger.addEventListener('keydown', event => {
        if (event.key !== ' ' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (!event.repeat) start(trigger);
      });
    });
    close.addEventListener('click', () => {
      if (active?.container === container) stop(true);
    });
  });

  // Remove the player before navigation or a back/forward-cache snapshot.
  window.addEventListener('pagehide', () => stop());
})();
