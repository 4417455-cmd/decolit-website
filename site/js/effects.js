/* ==========================================================================
   Деколит — сквозные эффекты «Свет по фактуре» + рафинированное движение.
   Один rAF-цикл: курсор-спотлайт, скролл-прогресс, фон-морф, параллакс
   фактур, кастомный курсор. Плюс инерционный wheel-скролл и магнитные кнопки.
   Только transform/opacity. Все листенеры passive (кроме wheel — он гасит
   нативный скролл осознанно). Десктоп / тач / reduced-motion разведены.
   ========================================================================== */
(() => {
  'use strict';

  const mm = q => window.matchMedia(q).matches;
  const reduce  = mm('(prefers-reduced-motion: reduce)');
  const finePtr = mm('(pointer: fine)') && mm('(hover: hover)');
  const desktop = finePtr && window.innerWidth > 1024;
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- инжект фиксированных слоёв ----------
  const make = (cls, html) => {
    const d = document.createElement('div');
    d.className = cls;
    d.setAttribute('aria-hidden', 'true');
    if (html) d.innerHTML = html;
    return d;
  };

  const bg       = make('fx-bg', '<div class="fx-bg__grad"></div>');
  const vignette = make('fx-vignette');
  const spot     = make('fx-spot');
  const grain    = make('fx-grain');
  const progress = make('fx-progress');
  document.body.prepend(bg);
  document.body.append(vignette, spot, grain, progress);
  const grad = bg.firstElementChild;

  // кастомный курсор (десктоп)
  let cursor = null;
  if (desktop && !reduce) {
    cursor = make('fx-cursor on');
    cursor.dataset.label = 'смотреть';
    document.body.append(cursor);
    document.body.classList.add('fx-cursor-on');
  }

  // ---------- параллакс фактур (фоновые tex-слои) ----------
  const parallax = reduce ? [] : Array.from(
    document.querySelectorAll('.hero-bg,.statement-bg,.calc .calc-tex,.b2b>.tex,.final>.tex')
  );
  parallax.forEach(el => el.classList.add('fx-parallax'));

  // ---------- reveal «дороже»: clip-маска на безтеневых блоках ----------
  if (!reduce) {
    document.querySelectorAll(
      '.section-head.reveal,.statement .reveal,.work.reveal,' +
      '.works-cta.reveal,.flow .row.reveal,.lead-txt.reveal,.cross.reveal,.svc-hero .reveal'
    ).forEach(e => e.classList.add('fx-clip'));
  }

  // ---------- геометрия скролла ----------
  let maxScroll = 1;
  let MORPH = window.innerHeight * 1.3;
  const measure = () => {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    MORPH = window.innerHeight * 1.3;
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

  // ---------- состояние ----------
  const cx0 = window.innerWidth / 2, cy0 = window.innerHeight * 0.42;
  let tx = cx0, ty = cy0;     // цель курсора
  let sx = cx0, sy = cy0;     // сглаженный спотлайт
  let ccx = cx0, ccy = cy0;   // сглаженный кастомный курсор
  let frac = 0;               // прогресс скролла 0..1

  if (desktop && !reduce) {
    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    // курсор-подпись над плитками работ
    document.addEventListener('pointerover', e => {
      if (e.target.closest('.work,.cross a')) cursor.classList.add('label');
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      if (e.target.closest('.work,.cross a') && !e.relatedTarget?.closest('.work,.cross a'))
        cursor.classList.remove('label');
    }, { passive: true });
  }

  // ---------- 4.4 магнитные кнопки ----------
  if (desktop && !reduce) {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.classList.add('fx-magnetic');
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.25).toFixed(1) + 'px,' + (dy * 0.4).toFixed(1) + 'px)';
      }, { passive: true });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; }, { passive: true });
    });
  }

  // ---------- 4.1 инерционный wheel-скролл (десктоп) ----------
  let inertia = false, targetY = window.scrollY;
  if (desktop && !reduce) {
    document.documentElement.style.scrollBehavior = 'auto'; // якоря доводим сами ниже
    window.addEventListener('wheel', e => {
      if (e.ctrlKey) return;                 // не мешаем зуму
      e.preventDefault();
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
      targetY = Math.max(0, Math.min(maxScroll, targetY + d));
      inertia = true;
    }, { passive: false });
    // синхронизация цели при не-wheel скролле (клавиатура, скроллбар, якоря)
    window.addEventListener('scroll', () => { if (!inertia) targetY = window.scrollY; }, { passive: true });
    // плавная доводка к якорю своими руками
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      targetY = Math.max(0, Math.min(maxScroll, t.getBoundingClientRect().top + window.scrollY));
      inertia = true;
    });
  }

  // ---------- единый rAF-цикл ----------
  const frame = (now) => {
    // 4.1 инерционный скролл
    if (inertia) {
      const y = lerp(window.scrollY, targetY, 0.12);
      if (Math.abs(targetY - y) < 0.4) { window.scrollTo(0, targetY); inertia = false; }
      else window.scrollTo(0, y);
    }

    // 2.4 прогресс-скролла
    const target = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    frac = lerp(frac, target, 0.18);
    progress.style.transform = 'scaleX(' + frac.toFixed(4) + ')';

    // 2.3 фон-морф
    if (!reduce) grad.style.transform = 'translate3d(0,' + (-frac * MORPH).toFixed(2) + 'px,0)';

    // 4.2 параллакс фактур
    if (!reduce) {
      const vh = window.innerHeight;
      for (let i = 0; i < parallax.length; i++) {
        const el = parallax[i];
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - vh / 2) / vh;   // -1..1 вокруг центра
        el.style.transform = 'translate3d(0,' + (off * 22).toFixed(1) + 'px,0)';
      }
    }

    // 2.1 спотлайт + 4.4 курсор
    if (!reduce) {
      if (desktop) {
        sx = lerp(sx, tx, 0.09); sy = lerp(sy, ty, 0.09);
        spot.style.transform =
          'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) translate(-50%,-50%)';
        ccx = lerp(ccx, tx, 0.2); ccy = lerp(ccy, ty, 0.2);
        cursor.style.transform = 'translate3d(' + ccx.toFixed(1) + 'px,' + ccy.toFixed(1) + 'px,0)';
      } else {
        const bx = window.innerWidth  * (0.5 + Math.sin(now / 7000) * 0.16);
        const by = window.innerHeight * (0.4  + Math.cos(now / 9000) * 0.14);
        const sc = 1 + Math.sin(now / 4200) * 0.1;
        spot.style.transform =
          'translate3d(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + sc.toFixed(3) + ')';
      }
    }

    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
