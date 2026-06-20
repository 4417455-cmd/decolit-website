(() => {
  const gallery = document.querySelector('[data-works-gallery]');
  const toggle = document.querySelector('[data-works-toggle]');
  if (!gallery || !toggle) return;

  const total = 131;
  const initialCount = 8;
  const pngFiles = new Set([3, 17, 23, 35, 36, 54, 71, 74, 77, 80, 84, 85, 90, 95, 98, 101, 106, 108, 109, 112, 117, 122, 131]);
  let expanded = false;

  const pad = n => String(n).padStart(2, '0');
  const ext = n => pngFiles.has(n) ? 'png' : 'jpg';
  const layoutClass = n => {
    const mod = (n - 1) % 12;
    if (mod === 0) return 'lg';
    if (mod === 1) return 'md';
    if (mod === 2 || mod === 3) return 'w6';
    return 'sm';
  };

  const render = () => {
    const count = expanded ? total : initialCount;
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= count; i += 1) {
      const n = pad(i);
      const card = document.createElement('article');
      card.className = `work ${layoutClass(i)}`;
      card.innerHTML = `
        <div class="surface photo grain" style="background-image:url('assets/img/works/work-${n}.${ext(i)}')"></div>
        <div class="cap"><div class="m"><span>Декоративные покрытия</span></div></div>
      `;
      fragment.appendChild(card);
    }

    gallery.replaceChildren(fragment);
    toggle.textContent = expanded ? 'Скрыть работы' : 'Смотреть все работы';
    toggle.setAttribute('aria-expanded', String(expanded));
  };

  toggle.addEventListener('click', () => {
    expanded = !expanded;
    render();
  });

  render();
})();
