/* Деколит — интерактив главной страницы.
   Только transform/opacity-анимации, passive-листенеры, без внешних зависимостей. */

// --- header: фон при скролле ---
const hdr = document.getElementById('hdr');
addEventListener('scroll', () => {
  hdr.classList.toggle('scrolled', scrollY > 40);
}, { passive: true });

// --- мобильное меню ---
const mnav = document.getElementById('mnav');
document.getElementById('burger').onclick = () => mnav.classList.add('open');
document.getElementById('mx').onclick = () => mnav.classList.remove('open');
mnav.querySelectorAll('a').forEach(a => a.onclick = () => mnav.classList.remove('open'));

// --- reveal при скролле ---
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// --- калькулятор стоимости (есть только на главной) ---
const opts = document.getElementById('opts');
const area = document.getElementById('area');
if (opts && area) {
  const areaN = document.getElementById('areaN');
  const result = document.getElementById('result');
  const resultNote = document.getElementById('resultNote');
  let material = 6200;
  let work = 3500;
  const fmt = n => n.toLocaleString('ru-RU').replace(/,/g, ' ');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // плавный пересчёт результата (count-up между значениями вилки)
  let dispLow = 0, dispHigh = 0, rafId = 0;
  const setResult = (low, high) => { result.textContent = fmt(low) + ' – ' + fmt(high) + ' ₽'; };
  const animateResult = (low, high) => {
    if (reduceMotion) { dispLow = low; dispHigh = high; setResult(low, high); return; }
    cancelAnimationFrame(rafId);
    const fromL = dispLow, fromH = dispHigh, t0 = performance.now(), dur = 420;
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const l = Math.round((fromL + (low - fromL) * e) / 1000) * 1000;
      const h = Math.round((fromH + (high - fromH) * e) / 1000) * 1000;
      setResult(l, h);
      if (p < 1) rafId = requestAnimationFrame(step);
      else { dispLow = low; dispHigh = high; }
    };
    rafId = requestAnimationFrame(step);
  };

  const calc = () => {
    const a = +area.value;
    areaN.textContent = a;
    const total = (material + work) * a;
    const low = Math.round(total * 0.92 / 1000) * 1000;   // вилка ±8%
    const high = Math.round(total * 1.08 / 1000) * 1000;
    animateResult(low, high);
    resultNote.textContent = 'материал ' + fmt(material) + ' ₽/м² · нанесение ' + fmt(work) + ' ₽/м²';
  };

  opts.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    opts.querySelector('.active').classList.remove('active');
    b.classList.add('active');
    material = +b.dataset.material;
    work = +b.dataset.work;
    calc();
  });
  area.oninput = calc;
  calc();
}

// --- счётчики доверия (count-up при появлении) ---
const counters = document.querySelectorAll('[data-count]');
if (counters.length) {
  const fmtN = n => n.toLocaleString('ru-RU').replace(/,/g, ' ');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  counters.forEach(el => {
    const item = el.parentElement;
    const group = el.closest('.hero-meta,.trust');
    if (!item) return;

    item.classList.add('counter-item');
    if (group) {
      const items = Array.from(group.querySelectorAll(':scope > div'));
      const index = Math.max(0, items.indexOf(item));
      item.style.transitionDelay = (index * 120) + 'ms';
    }
  });

  const runCounter = el => {
    if (el.dataset.counted === 'true') return;
    el.dataset.counted = 'true';

    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const item = el.parentElement;
    const group = el.closest('.hero-meta,.trust');

    if (group) group.classList.add('counter-group-in');
    if (item) item.classList.add('counter-in');

    if (reduceMotion) {
      el.textContent = fmtN(target) + suffix;
      return;
    }

    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtN(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };

    el.textContent = fmtN(0) + suffix;
    requestAnimationFrame(tick);
  };

  const isVisible = el => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  };

  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        runCounter(e.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    counters.forEach(el => {
      if (isVisible(el)) requestAnimationFrame(() => runCounter(el));
      else cio.observe(el);
    });
  } else {
    counters.forEach(runCounter);
  }
}

// --- FAQ-аккордеон ---
document.querySelectorAll('.q button').forEach(btn => {
  btn.onclick = () => {
    const q = btn.parentElement;
    const a = q.querySelector('.a');
    const open = q.classList.contains('open');
    document.querySelectorAll('.q').forEach(x => {
      x.classList.remove('open');
      x.querySelector('.a').style.maxHeight = null;
    });
    if (!open) {
      q.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  };
});

// --- форма заявки: отправка на email через FormSubmit.co ---
// Бэкенда нет (статика на nginx), поэтому используем FormSubmit —
// бесплатный сервис, шлёт данные формы на decolitpro@yandex.ru.
// Первая отправка с нового адреса требует подтверждения по email (активация).
const leadForm = document.querySelector('[data-lead-form]');
if (leadForm) {
  const note = leadForm.parentElement.querySelector('.form-note');
  const btn = leadForm.querySelector('[type="submit"]');
  const btnText = btn ? btn.textContent : '';

  const setStatus = (state, msg) => {
    leadForm.dataset.state = state; // 'idle' | 'loading' | 'success' | 'error'
    if (btn) {
      btn.disabled = state === 'loading' || state === 'success';
      btn.textContent =
        state === 'loading' ? 'Отправляем…' :
        state === 'success' ? 'Заявка отправлена ✓' :
        btnText;
    }
    if (note) {
      note.textContent = msg || note.dataset.defaultText ||
        'Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных';
      if (msg) note.dataset.defaultText = note.dataset.defaultText ||
        'Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных';
    }
  };

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (leadForm.dataset.state === 'loading' || leadForm.dataset.state === 'success') return;

    // простая валидация
    const name = (leadForm.elements['name'] || {}).value || '';
    const phone = (leadForm.elements['phone'] || {}).value || '';
    const phoneDigits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) { setStatus('error', 'Укажите имя — как к вам обращаться.'); return; }
    if (phoneDigits.length < 10) { setStatus('error', 'Укажите телефон — на него перезвоним.'); return; }

    setStatus('loading');

    try {
      const formData = new FormData(leadForm);
      formData.append('_subject', 'Новая заявка с сайта Деколит');
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');
      formData.append('page', location.pathname);

      const resp = await fetch('https://formsubmit.co/ajax/decolitpro@yandex.ru', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json().catch(() => ({}));
      if (data && data.success === 'false') throw new Error('FormSubmit error');

      setStatus('success', 'Спасибо! Заявка отправлена — перезвоним в течение нескольких минут.');
      leadForm.reset();
    } catch (err) {
      setStatus('error', 'Не удалось отправить. Позвоните +7 985 999-25-55 или напишите в Telegram.');
    }
  });
}

// --- просмотр фактур: тап по фото открывает галерею со свайпом ---
(() => {
  const selector = '.svc-hero .visual .surface,.sample-card .surface,.mat .swatch .surface.photo,.work';

  const getBgUrl = el => {
    const target = el.classList.contains('work') ? el.querySelector('.surface.photo') : el;
    const bg = target ? getComputedStyle(target).backgroundImage || '' : '';
    const m = bg.match(/url\(["']?(.+?)["']?\)/);
    return m ? m[1] : '';
  };

  const getTitle = el => {
    const sample = el.closest('.sample-card')?.querySelector('.sample-title')?.textContent;
    const mat = el.closest('.mat')?.querySelector('h3')?.textContent;
    const work = el.closest('.work')?.dataset.zoomTitle || el.closest('.work')?.querySelector('.t')?.textContent;
    const badge = el.closest('.visual')?.querySelector('.badge')?.textContent;
    return (sample || mat || work || badge || 'Фактура').trim();
  };

  const viewer = document.createElement('div');
  viewer.className = 'zoom-viewer';
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.innerHTML =
    '<button class="zoom-viewer__close" type="button" aria-label="Закрыть">×</button>' +
    '<button class="zoom-viewer__nav zoom-viewer__nav--prev" type="button" aria-label="Предыдущее фото">‹</button>' +
    '<div class="zoom-viewer__stage"><img class="zoom-viewer__img" alt=""></div>' +
    '<button class="zoom-viewer__nav zoom-viewer__nav--next" type="button" aria-label="Следующее фото">›</button>' +
    '<div class="zoom-viewer__title"></div>';
  document.body.append(viewer);

  const stage = viewer.querySelector('.zoom-viewer__stage');
  const img = viewer.querySelector('.zoom-viewer__img');
  const title = viewer.querySelector('.zoom-viewer__title');
  const closeBtn = viewer.querySelector('.zoom-viewer__close');
  const prevBtn = viewer.querySelector('.zoom-viewer__nav--prev');
  const nextBtn = viewer.querySelector('.zoom-viewer__nav--next');

  let scale = 1, x = 0, y = 0;
  let startScale = 1, startX = 0, startY = 0, startDist = 0;
  let scrollYBeforeOpen = 0;
  let items = [];
  let currentIndex = 0;
  let swipeStartX = 0, swipeStartY = 0, swipeMoved = false;
  let allItems = [];
  const points = new Map();

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist = () => {
    const p = Array.from(points.values());
    if (p.length < 2) return 0;
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  };
  const render = () => {
    if (scale <= 1.01) { x = 0; y = 0; scale = 1; }
    img.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
  };
  const reset = () => { scale = 1; x = 0; y = 0; render(); };

  const show = index => {
    if (!items.length) return;
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];
    img.src = item.src;
    img.alt = item.label;
    title.textContent = item.label + ' · ' + (currentIndex + 1) + ' / ' + items.length;
    reset();
  };

  const open = index => {
    scrollYBeforeOpen = window.scrollY;
    show(index);
    viewer.classList.add('open');
    document.body.classList.add('zoom-viewer-open');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollYBeforeOpen + 'px';
    document.body.style.width = '100%';
    closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    viewer.classList.remove('open');
    document.body.classList.remove('zoom-viewer-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollYBeforeOpen);
    points.clear();
    img.src = '';
  };

  const go = dir => show(currentIndex + dir);

  const buildItems = nodes => nodes
    .map(el => ({ el, src: getBgUrl(el), label: getTitle(el) }))
    .filter(item => item.src);

  const openFrom = (el, fallbackIndex) => {
    const isWork = el.classList.contains('work');
    const scopedNodes = isWork
      ? Array.from(document.querySelectorAll('[data-works-gallery] .work'))
      : Array.from(document.querySelectorAll(selector)).filter(node => !node.classList.contains('work'));
    items = buildItems(scopedNodes.filter(node => !node.closest('.cross a')));
    const freshIndex = items.findIndex(fresh => fresh.el === el);
    open(freshIndex >= 0 ? freshIndex : fallbackIndex);
  };

  const bindSurfaces = () => {
    const nodes = Array.from(document.querySelectorAll(selector)).filter(el => !el.closest('.cross a'));
    allItems = buildItems(nodes);

    allItems.forEach((item, index) => {
      const el = item.el;
      const interactive = el.classList.contains('work') ? el : item.el;
      interactive.dataset.zoomSrc = item.src;
      interactive.setAttribute('role', 'button');
      interactive.setAttribute('tabindex', '0');
      interactive.setAttribute('aria-label', 'Открыть фото крупно');
      if (el.dataset.zoomBound === 'true') return;
      el.dataset.zoomBound = 'true';
      el.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        e.preventDefault();
        openFrom(el, index);
      });
      el.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openFrom(el, index);
      });
    });
  };

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  viewer.addEventListener('click', e => { if (e.target === viewer) close(); });
  document.addEventListener('keydown', e => {
    if (!viewer.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  stage.addEventListener('pointerdown', e => {
    if (!viewer.classList.contains('open')) return;
    stage.setPointerCapture(e.pointerId);
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startX = x; startY = y; startScale = scale; startDist = dist();
    swipeStartX = e.clientX; swipeStartY = e.clientY; swipeMoved = false;
  });
  stage.addEventListener('pointermove', e => {
    if (!points.has(e.pointerId)) return;
    const prev = points.get(e.pointerId);
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (points.size >= 2) {
      const d = dist();
      if (startDist > 0) scale = clamp(startScale * (d / startDist), 1, 4);
    } else if (scale > 1) {
      x += e.clientX - prev.x;
      y += e.clientY - prev.y;
    } else {
      const dx = e.clientX - swipeStartX;
      const dy = e.clientY - swipeStartY;
      swipeMoved = Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.4;
    }
    render();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
    stage.addEventListener(type, e => {
      if (type === 'pointerup' && points.size === 1 && scale <= 1.01 && swipeMoved) {
        const dx = e.clientX - swipeStartX;
        if (Math.abs(dx) > 56) go(dx < 0 ? 1 : -1);
      }
      points.delete(e.pointerId);
      startScale = scale; startX = x; startY = y; startDist = dist();
    });
  });
  stage.addEventListener('dblclick', reset);
  document.addEventListener('works-gallery:rendered', bindSurfaces);
  bindSurfaces();
})();
