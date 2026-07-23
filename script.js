/* ============================================================
   GGS Painting LLC — Static site behaviors
   ============================================================ */
(function () {
  'use strict';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderIcons() { try { window.lucide && window.lucide.createIcons(); } catch (e) {} }

  /* ---- Icon cluster (About) : hexagon of satellite icons around a brand center ---- */
  function buildCluster(el) {
    var icons = (el.dataset.icons || '').split(',').filter(Boolean);
    var center = el.dataset.center;
    var box = el.parentElement.getBoundingClientRect();
    var avail = box.width || 480;
    var isM = window.innerWidth < 900;
    var size = isM ? Math.min(360, window.innerWidth - 64) : 480;
    if (size > avail && avail > 0) size = avail;
    var R = size * 0.355, cx = size / 2, cy = size / 2, sat = size * 0.165, ctr = size * 0.16;
    var tints = ['var(--charcoal-100)', 'var(--orange-050)'];
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    var pts = icons.slice(0, 6).map(function (ic, i) {
      var a = (Math.PI / 180) * (i * 60 - 90);
      return { ic: ic, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), tint: tints[i % 2] };
    });
    var svgLines = '';
    pts.forEach(function (p, i) {
      var q = pts[(i + 1) % pts.length];
      svgLines += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '" stroke="var(--charcoal-300)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="0.1 12" />';
    });
    var html = '<svg class="cluster-lines" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' + svgLines + '</svg>';
    pts.forEach(function (p) {
      html += '<div class="icon-cluster__sat" style="left:' + (p.x - sat) + 'px;top:' + (p.y - sat) + 'px;width:' + (sat * 2) + 'px;height:' + (sat * 2) + 'px;background:' + p.tint + '"><i data-lucide="' + p.ic + '" style="width:' + (sat * 0.85) + 'px;height:' + (sat * 0.85) + 'px"></i></div>';
    });
    html += '<div class="icon-cluster__center" style="left:' + (cx - ctr) + 'px;top:' + (cy - ctr) + 'px;width:' + (ctr * 2) + 'px;height:' + (ctr * 2) + 'px">' +
      (center ? '<img src="' + center + '" alt="">' : '<i data-lucide="paintbrush" style="width:' + ctr + 'px;height:' + ctr + 'px;color:#fff"></i>') + '</div>';
    el.innerHTML = html;
  }
  function initClusters() {
    var clusters = document.querySelectorAll('.icon-cluster');
    clusters.forEach(buildCluster);
    renderIcons();
  }

  /* ---- Reveal on scroll ---- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('is-visible'); });
      return;
    }
    function revealVisible() {
      els.forEach(function (e) {
        if (e.classList.contains('is-visible')) return;
        var r = e.getBoundingClientRect();
        if (r.top < window.innerHeight - 40 && r.bottom > 0) e.classList.add('is-visible');
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
    revealVisible();
    requestAnimationFrame(revealVisible);
    [250, 500, 1200, 2400, 4000].forEach(function (delay) {
      setTimeout(revealVisible, delay);
    });
    window.addEventListener('load', revealVisible, { once: true });
    window.addEventListener('hashchange', revealVisible);
    window.addEventListener('scroll', revealVisible, { passive: true });
  }

  /* ---- Count-up numbers ---- */
  function initCountUp() {
    var els = document.querySelectorAll('.countup');
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.textContent = e.dataset.target; });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var target = parseInt(e.target.dataset.target, 10), dur = 1400, t0 = performance.now();
        function tick(t) {
          var p = Math.min(1, (t - t0) / dur);
          e.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---- Pain-points accordion (swaps photo + caption) ---- */
  function initPains() {
    var list = document.getElementById('pains-list');
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll('.pain-item'));
    var imgs = document.querySelectorAll('#pains-photo .img');
    var caption = document.getElementById('pains-caption');
    items.forEach(function (item) {
      var head = item.querySelector('.pain-item__head');
      head.addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');
        items.forEach(function (i) { i.classList.remove('open'); });
        if (!wasOpen) {
          item.classList.add('open');
          var idx = parseInt(item.dataset.photo, 10);
          imgs.forEach(function (im, k) { im.classList.toggle('active', k === idx); });
          if (caption) caption.innerHTML = item.dataset.title;
        }
        renderIcons();
      });
    });
  }

  /* ---- Brand chip tint ---- */
  function initBrandTint() {
    var panel = document.getElementById('brand-panel');
    var chips = document.querySelectorAll('#brand-chips .chip');
    if (!panel || !chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('mouseenter', function () { panel.style.setProperty('--brand-wall-tint', chip.dataset.tint + '42'); });
      chip.addEventListener('mouseleave', function () { panel.style.removeProperty('--brand-wall-tint'); });
    });
  }

  /* ---- Back to top ---- */
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    function onScroll() { btn.classList.toggle('show', window.scrollY > window.innerHeight * 0.9); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---- Mobile nav ---- */
  function initMobileNav() {
    var nav = document.querySelector('.navbar');
    var toggle = document.querySelector('.navbar__toggle');
    var links = document.getElementById('mobile-menu');
    if (!nav || !toggle || !links) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });

    links.addEventListener('click', function (event) {
      if (event.target && event.target.tagName === 'A') setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ---- Resize (rebuild cluster) ---- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(initClusters, 150);
  });

  function init() {
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
    initClusters();
    initReveal();
    initCountUp();
    initPains();
    initBrandTint();
    initBackToTop();
    initMobileNav();
    renderIcons();
    setTimeout(renderIcons, 400);
    setTimeout(renderIcons, 1400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
