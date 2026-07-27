(() => {
  const gallery = document.querySelector('[data-works-gallery]');
  const toggle = document.querySelector('[data-works-toggle]');
  if (!gallery || !toggle) return;

  const total = 109;
  const initialCount = 10;
  const pngFiles = new Set([1, 12, 15, 29, 30, 46, 57, 59, 61, 63, 66, 67, 71, 76, 79, 81, 85, 86, 87, 90, 95, 100, 109]);
  let expanded = false;

  const pad = n => String(n).padStart(3, '0');
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
      card.dataset.zoomTitle = `Работа ${n}`;
      card.innerHTML = `
        <div class="surface photo grain" style="background-image:url('assets/img/works-tilda/work-${n}.${ext(i)}')"></div>
      `;
      fragment.appendChild(card);
    }

    gallery.replaceChildren(fragment);
    gallery.dispatchEvent(new CustomEvent('works-gallery:rendered', { bubbles: true }));
    toggle.textContent = expanded ? 'Скрыть работы' : 'Смотреть все работы';
    toggle.setAttribute('aria-expanded', String(expanded));
  };

  toggle.addEventListener('click', () => {
    expanded = !expanded;
    render();
  });

  render();
})();
