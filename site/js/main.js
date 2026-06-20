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
