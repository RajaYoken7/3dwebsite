/* ═══════════════════════════════════════════════════════════════
   DELL G15 5530 — CINEMATIC SCROLLYTELLING ENGINE
   122-Frame Image Sequence · Apple-Level Scroll Scrubbing
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── CONFIG ──────────────────────────────────────────────────────
const CONFIG = {
  TOTAL_FRAMES:      122,
  FRAME_PATH: (n) => `assets/g15-exploaded/ezgif-frame-${String(n).padStart(3, '0')}.jpg`,
  PRELOAD_BATCH:     12,

  // Scroll % → copy overlay thresholds
  SECTIONS: {
    ENGINEERING: { start: 0.13, end: 0.40, label: 'Engineering' },
    COOLING:     { start: 0.40, end: 0.65, label: 'Thermal System' },
    GRAPHICS:    { start: 0.65, end: 0.88, label: 'Graphics & Performance' },
    REASSEMBLY:  { start: 0.88, end: 1.00, label: 'Reassembly' },
  },
};

// ─── STATE ────────────────────────────────────────────────────────
const state = {
  frames:       new Array(CONFIG.TOTAL_FRAMES).fill(null),
  loadedCount:  0,
  currentFrame: 0,
  lerpFrame:    0,           // smooth interpolated frame
  isReady:      false,
  rafId:        null,
  lastScrollY:  -1,
  progress:     0,
};

// ─── DOM REFS ─────────────────────────────────────────────────────
let canvas, ctx, seqWrapper, progressBar, sectionLabel;
let copyEngineering, copyCooling, copyGraphics;
let loadingOverlay, loadingBar, loadingPct;
let nav;

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectLoadingOverlay();

  canvas           = document.getElementById('hero-canvas');
  ctx              = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  seqWrapper       = document.getElementById('sequence-wrapper');
  progressBar      = document.getElementById('seq-progress-bar');
  sectionLabel     = document.getElementById('seq-section-label');
  copyEngineering  = document.getElementById('copy-engineering');
  copyCooling      = document.getElementById('copy-cooling');
  copyGraphics     = document.getElementById('copy-graphics');
  nav              = document.getElementById('nav');

  resizeCanvas();
  window.addEventListener('resize', debounce(resizeCanvas, 150));

  initNav();
  initScrollReveal();
  preloadFrames();
});

// ─── LOADING OVERLAY ─────────────────────────────────────────────
function injectLoadingOverlay() {
  const el = document.createElement('div');
  el.className = 'loading-overlay';
  el.id = 'loading-overlay';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="loading-logo">Dell G15 5530</div>
    <div class="loading-label">Cinematic Experience</div>
    <div class="loading-bar-wrap">
      <div class="loading-bar" id="loading-bar"></div>
    </div>
    <div class="loading-pct" id="loading-pct">Initialising…</div>
  `;
  document.body.prepend(el);
  loadingOverlay = el;
  loadingBar     = document.getElementById('loading-bar');
  loadingPct     = document.getElementById('loading-pct');
}

function setLoadingProgress(pct) {
  if (loadingBar) loadingBar.style.width = `${pct}%`;
  if (loadingPct) {
    loadingPct.textContent = pct < 100
      ? `Loading frames… ${Math.round(pct)}%`
      : 'Ready';
  }
}

function hideLoading() {
  if (!loadingOverlay) return;
  loadingOverlay.classList.add('hidden');
  setTimeout(() => loadingOverlay?.remove(), 1000);
}

// ─── CANVAS ───────────────────────────────────────────────────────
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (state.frames[state.currentFrame]) drawFrame(state.currentFrame);
}

// ─── PRELOAD ──────────────────────────────────────────────────────
function preloadFrames() {
  // Frame 1 immediately — instant hero
  const img0 = new Image();
  img0.src = CONFIG.FRAME_PATH(1);
  img0.onload = () => {
    state.frames[0] = img0;
    state.loadedCount = 1;
    drawFrame(0);
    loadBatch(2, CONFIG.TOTAL_FRAMES);
  };
  img0.onerror = () => { loadBatch(2, CONFIG.TOTAL_FRAMES); };
}

function loadBatch(from, to) {
  const size = CONFIG.PRELOAD_BATCH;
  let cur = from;

  function next() {
    if (cur > to) { onReady(); return; }
    const end = Math.min(cur + size - 1, to);
    let pending = end - cur + 1;

    for (let i = cur; i <= end; i++) {
      const idx = i - 1;
      const img = new Image();
      img.src = CONFIG.FRAME_PATH(i);
      img.onload = () => {
        state.frames[idx] = img;
        state.loadedCount++;
        setLoadingProgress((state.loadedCount / CONFIG.TOTAL_FRAMES) * 100);
        if (--pending === 0) next();
      };
      img.onerror = () => {
        state.loadedCount++;
        if (--pending === 0) next();
      };
    }
    cur = end + 1;
  }
  next();
}

function onReady() {
  state.isReady = true;
  setLoadingProgress(100);
  setTimeout(() => {
    hideLoading();
    nav.classList.add('top');
    startLoop();
    revealHero();
  }, 500);
}

// ─── DRAW ─────────────────────────────────────────────────────────
function drawFrame(idx) {
  const img = state.frames[idx];
  if (!img) return;

  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  const iw = img.naturalWidth  || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  // Contain: show entire laptop without cropping
  const scale = Math.min(W / iw, H / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);

  // Cinematic edge vignette
  const vig = ctx.createRadialGradient(W/2, H/2, H * 0.3, W/2, H/2, H * 0.9);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(5,5,5,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Bottom gradient fade into next section
  const fade = ctx.createLinearGradient(0, H * 0.72, 0, H);
  fade.addColorStop(0, 'rgba(5,5,5,0)');
  fade.addColorStop(1, 'rgba(5,5,5,0.85)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, H * 0.72, W, H * 0.28);
}

// ─── MAIN LOOP ────────────────────────────────────────────────────
function startLoop() {
  function tick() {
    const sy = window.scrollY;

    if (sy !== state.lastScrollY) {
      state.lastScrollY = sy;
      updateNav(sy);
      if (seqWrapper) {
        const prog = calcProgress(sy);
        state.progress = prog;

        // Update progress bar
        if (progressBar) progressBar.style.width = `${prog * 100}%`;

        // Target frame
        const target = Math.round(prog * (CONFIG.TOTAL_FRAMES - 1));

        // Smooth lerp — feels more premium than snap
        state.lerpFrame += (target - state.lerpFrame) * 0.18;
        const frameIdx = Math.round(state.lerpFrame);

        if (frameIdx !== state.currentFrame || sy === 0) {
          state.currentFrame = frameIdx;
          drawFrame(frameIdx);
        }

        updateOverlays(prog);
        updateSectionLabel(prog);
      }
    }
    state.rafId = requestAnimationFrame(tick);
  }
  state.rafId = requestAnimationFrame(tick);
}

function calcProgress(scrollY) {
  const wrapTop  = seqWrapper.offsetTop;
  const wrapH    = seqWrapper.offsetHeight;
  const viewH    = window.innerHeight;
  const into     = scrollY - wrapTop;
  const scrollable = wrapH - viewH;
  return Math.max(0, Math.min(1, into / scrollable));
}

// ─── OVERLAYS ─────────────────────────────────────────────────────
function updateOverlays(p) {
  const S = CONFIG.SECTIONS;
  setActive(copyEngineering, p, S.ENGINEERING.start, S.ENGINEERING.end);
  setActive(copyCooling,     p, S.COOLING.start,     S.COOLING.end);
  setActive(copyGraphics,    p, S.GRAPHICS.start,     S.GRAPHICS.end);
}

function setActive(el, p, start, end) {
  if (!el) return;
  const on = p >= start && p < end;
  el.classList.toggle('active', on);
  el.setAttribute('aria-hidden', String(!on));
}

function updateSectionLabel(p) {
  if (!sectionLabel) return;
  const S = CONFIG.SECTIONS;
  let label = 'Scroll to explore';

  for (const section of Object.values(S)) {
    if (p >= section.start && p < section.end) {
      label = section.label;
      break;
    }
  }

  if (sectionLabel.textContent !== label) {
    sectionLabel.style.opacity = '0';
    setTimeout(() => {
      sectionLabel.textContent = label;
      sectionLabel.style.opacity = '1';
    }, 200);
  }
}

// ─── NAVIGATION ───────────────────────────────────────────────────
function initNav() {
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth-scroll all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function updateNav(sy) {
  if (sy > 80) {
    nav.classList.add('visible');
    nav.classList.remove('top');
  } else {
    nav.classList.remove('visible');
    nav.classList.add('top');
  }
}

// ─── SCROLL REVEAL ────────────────────────────────────────────────
function initScrollReveal() {
  const els = document.querySelectorAll('[data-scroll-reveal]');
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach(el => io.observe(el));
}

function revealHero() {
  const heroEls = document.querySelectorAll('.hero-intro [data-scroll-reveal]');
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), i * 110 + 200);
  });
}

// ─── MAGNETIC BUTTONS ─────────────────────────────────────────────
window.addEventListener('load', () => {
  document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.12;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.12;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
});

// ─── KEYBOARD / ACCESSIBILITY ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const m = document.getElementById('mobile-menu');
    const h = document.getElementById('nav-hamburger');
    if (m) { m.classList.remove('open'); h?.setAttribute('aria-expanded', 'false'); }
  }
});

// ─── PAGE VISIBILITY ─────────────────────────────────────────────
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.rafId) cancelAnimationFrame(state.rafId);
  else if (!document.hidden && state.isReady) startLoop();
});

// ─── UTILITY ─────────────────────────────────────────────────────
function debounce(fn, delay) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
}
