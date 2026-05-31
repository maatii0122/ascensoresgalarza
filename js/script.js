'use strict';

/* =============================================
   ASCENSORES GALARZA SRL — JavaScript principal
   ============================================= */

// --- Offset para el header fijo ---
function getScrollOffset() {
  const emergencyH = 40;
  const headerH = window.innerWidth >= 1024 ? 76 : 72;
  return emergencyH + headerH + 16;
}

// --- Smooth scroll para links de navegación ---
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top, behavior: 'smooth' });
    // Cerrar menú móvil si está abierto
    closeMobileMenu();
  });
});

// --- Header: scroll effect + active nav ---
const header = document.getElementById('header');
const navLinks = document.querySelectorAll('.nav__link');
const sections = document.querySelectorAll('main section[id]');

function updateHeader() {
  const scrolled = window.scrollY > 20;
  header.classList.toggle('scrolled', scrolled);
}

function updateActiveNav() {
  const scrollPos = window.scrollY + getScrollOffset() + 60;
  let current = '';
  sections.forEach(section => {
    if (section.offsetTop <= scrollPos) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    const href = link.getAttribute('href').replace('#', '');
    link.classList.toggle('active', href === current);
  });
}

window.addEventListener('scroll', () => {
  updateHeader();
  updateActiveNav();
}, { passive: true });

updateHeader();
updateActiveNav();

// --- Menú móvil ---
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

function openMobileMenu() {
  menuToggle.classList.add('open');
  mobileMenu.classList.add('open');
  menuToggle.setAttribute('aria-expanded', 'true');
  mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  menuToggle.classList.remove('open');
  mobileMenu.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

menuToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('open');
  isOpen ? closeMobileMenu() : openMobileMenu();
});

// Cerrar al hacer clic fuera del menú
document.addEventListener('click', e => {
  if (mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !menuToggle.contains(e.target)) {
    closeMobileMenu();
  }
});

// Cerrar al hacer Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    closeMobileMenu();
    menuToggle.focus();
  }
});

// --- Intersection Observer para animaciones ---
const animatedEls = document.querySelectorAll('.animate-on-scroll');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  animatedEls.forEach(el => observer.observe(el));
} else {
  // Fallback para navegadores sin soporte
  animatedEls.forEach(el => el.classList.add('in-view'));
}

// --- Validación y envío del formulario ---
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');

const validators = {
  nombre:   val => val.trim().length >= 3 ? '' : 'Por favor ingrese su nombre completo.',
  telefono: val => /^[\d\s\-\+\(\)]{6,20}$/.test(val.trim()) ? '' : 'Ingrese un número de teléfono válido.',
  email:    val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Ingrese un email válido.',
  direccion: val => val.trim().length >= 5 ? '' : 'Ingrese la dirección del ascensor.',
  servicio: val => val !== '' ? '' : 'Seleccione el tipo de servicio.',
};

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + '-error');
  if (!field || !errorEl) return;
  if (message) {
    field.classList.add('error');
    errorEl.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', fieldId + '-error');
  } else {
    field.classList.remove('error');
    errorEl.textContent = '';
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }
}

function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field || !validators[fieldId]) return true;
  const error = validators[fieldId](field.value);
  showError(fieldId, error);
  return !error;
}

// Validación en tiempo real (al salir del campo)
['nombre', 'telefono', 'email', 'direccion', 'servicio'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('blur', () => validateField(id));
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) validateField(id);
    });
  }
});

form.addEventListener('submit', async e => {
  e.preventDefault();

  // Validar todos los campos
  const valid = ['nombre', 'telefono', 'email', 'direccion', 'servicio']
    .map(validateField)
    .every(Boolean);

  if (!valid) {
    const firstError = form.querySelector('.form-input.error, .form-select.error');
    if (firstError) firstError.focus();
    return;
  }

  // Estado de carga
  const btnText = submitBtn.querySelector('span');
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.75';
  btnText.textContent = 'Enviando...';

  try {
    // Si el action tiene el endpoint real de FormSpree, usar fetch
    const action = form.getAttribute('action');
    if (action && !action.includes('XXXXXXXXX')) {
      const data = new FormData(form);
      const res = await fetch(action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Error al enviar');
    } else {
      // Modo demo: simular envío
      await new Promise(r => setTimeout(r, 1200));
      // En producción, configurar FormSpree o backend propio
      console.log('Demo: formulario enviado (configurar endpoint real en FormSpree)');
    }

    // Éxito
    form.reset();
    form.hidden = true;
    formSuccess.hidden = false;
    formSuccess.focus();
    trackEvent('form_submit', { service: document.getElementById('servicio').value });

  } catch {
    alert('Hubo un error al enviar el formulario. Por favor llámenos al 4778-1991 o escríbanos por WhatsApp.');
    submitBtn.disabled = false;
    submitBtn.style.opacity = '';
    btnText.textContent = 'Enviar Solicitud';
  }
});

// --- Tracking de eventos (Google Analytics / GTM) ---
function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push({ event: eventName, ...params });
  }
}

// Botones de tracking
document.querySelectorAll('[data-track]').forEach(el => {
  el.addEventListener('click', () => {
    const action = el.dataset.track;
    const label = el.getAttribute('href') || '';

    if (action.includes('whatsapp')) {
      trackEvent('whatsapp_click', { location: action, url: label });
    } else if (action.includes('phone') || action.includes('emergency')) {
      trackEvent('phone_click', { location: action, number: label });
    } else if (action.includes('email')) {
      trackEvent('email_click', { location: action });
    }
  });
});

// --- Lazy loading de imágenes (para cuando se agreguen) ---
if ('loading' in HTMLImageElement.prototype) {
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = img.dataset.src;
  });
} else if ('IntersectionObserver' in window) {
  const imgObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          imgObserver.unobserve(img);
        }
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
}

// --- Utilidad: update año del copyright automáticamente ---
document.querySelectorAll('.footer__copy').forEach(el => {
  el.innerHTML = el.innerHTML.replace(/\d{4}/, new Date().getFullYear());
});

/* =============================================
   PRELOADER
   ============================================= */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  setTimeout(() => preloader.classList.add('hidden'), 350);
});

/* =============================================
   STATS COUNTER ANIMATION
   ============================================= */
(function () {
  const statEls = document.querySelectorAll('.stat-item__number[data-target]');
  if (!statEls.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  statEls.forEach(el => observer.observe(el));
})();

/* =============================================
   FAQ ACCORDION
   ============================================= */
document.querySelectorAll('.faq-item__question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-item__answer');
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.faq-item').forEach(other => {
      other.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
      other.querySelector('.faq-item__answer').hidden = true;
      other.classList.remove('faq-item--open');
    });

    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
      item.classList.add('faq-item--open');
    }
  });
});

/* =============================================
   HERO QUICK FORM
   ============================================= */
(function () {
  const form = document.getElementById('quickForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.quick-form__submit');
    btn.disabled = true;
    btn.innerHTML = 'Enviando<span style="opacity:.6">...</span>';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        form.closest('.hero__quick-form').innerHTML =
          '<div class="quick-form__success">✓ ¡Solicitud enviada!<br><small style="opacity:.7;font-weight:400">Le contactamos a la brevedad.</small></div>';
      } else {
        throw new Error();
      }
    } catch {
      btn.disabled = false;
      btn.innerHTML = 'Pedir Cotización <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    }
  });
})();

/* =============================================
   HERO BANNER SLIDESHOW — 6 fondos con crossfade
   ============================================= */

(function () {
  const SLIDE_COUNT    = 6;
  const SLIDE_DURATION = 5500;  // ms entre transiciones
  const FADE_DURATION  = 1100;  // ms de crossfade

  let offscreens   = [];
  let current      = 0;
  let isFading     = false;
  let autoTimer    = null;
  let rafId        = null;

  // ── Seeded pseudo-random ──────────────────────────────────────────────
  function sr(seed) {
    let s = seed;
    return function() {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  // ── Hexagon helper ────────────────────────────────────────────────────
  function hexPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i - Math.PI / 6;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }

  // ── Funciones de dibujo ───────────────────────────────────────────────

  // BG1: Elevator shaft with vertical light beams
  function drawBg1(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = sr(1);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#020e1f');
    grad.addColorStop(0.5, '#041530');
    grad.addColorStop(1, '#071e42');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 8; i++) {
      const x = (w / 8) * (i + 0.5) + (rng() - 0.5) * w * 0.06;
      const bw = w * (0.02 + rng() * 0.03);
      const alpha = 0.04 + rng() * 0.09;
      const bg = ctx.createLinearGradient(x - bw, 0, x + bw, 0);
      bg.addColorStop(0, 'rgba(0,200,255,0)');
      bg.addColorStop(0.5, `rgba(0,180,255,${alpha})`);
      bg.addColorStop(1, 'rgba(0,200,255,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(x - bw * 3, 0, bw * 6, h);
    }

    ctx.strokeStyle = 'rgba(0,150,255,0.11)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      const y = (h / 14) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0,150,255,0.08)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i <= 20; i++) {
      const x = (w / 20) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    for (let i = 0; i < 14; i++) {
      const y = (h / 14) * i + h / 28;
      const bright = rng() > 0.65;
      ctx.beginPath();
      ctx.arc(w - 28, y, bright ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = bright ? 'rgba(0,220,255,0.85)' : 'rgba(0,150,255,0.3)';
      ctx.fill();
      if (bright) {
        const g = ctx.createRadialGradient(w - 28, y, 0, w - 28, y, 14);
        g.addColorStop(0, 'rgba(0,220,255,0.3)');
        g.addColorStop(1, 'rgba(0,220,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(w - 28, y, 14, 0, Math.PI * 2); ctx.fill();
      }
    }

    const bg2 = ctx.createRadialGradient(w * 0.5, h, 0, w * 0.5, h, w * 0.7);
    bg2.addColorStop(0, 'rgba(0,100,255,0.22)');
    bg2.addColorStop(0.5, 'rgba(0,60,180,0.08)');
    bg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg2; ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 60; i++) {
      const sx = rng() * w, sy = rng() * h;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + rng() * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(150,210,255,${0.15 + rng() * 0.5})`;
      ctx.fill();
    }
  }

  // BG2: Circuit board with cyan traces
  function drawBg2(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = sr(2);

    ctx.fillStyle = '#030d1a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0,80,120,0.18)';
    ctx.lineWidth = 0.5;
    const gs = Math.round(w / 30);
    for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

    for (let t = 0; t < 22; t++) {
      const alpha = 0.3 + rng() * 0.5;
      const isCyan = rng() > 0.3;
      const color = isCyan ? `rgba(0,200,255,${alpha})` : `rgba(0,255,180,${alpha})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8 + rng() * 1.2;
      ctx.beginPath();
      let cx2 = rng() * w, cy2 = rng() * h;
      ctx.moveTo(cx2, cy2);
      for (let s = 0; s < 3 + Math.floor(rng() * 4); s++) {
        if (rng() > 0.5) cx2 += (rng() - 0.3) * w * 0.25;
        else             cy2 += (rng() - 0.3) * h * 0.3;
        cx2 = Math.max(0, Math.min(w, cx2));
        cy2 = Math.max(0, Math.min(h, cy2));
        ctx.lineTo(cx2, cy2);
      }
      ctx.stroke();

      const nr = 2 + rng() * 3;
      const nc = isCyan ? 'rgba(0,220,255,' : 'rgba(0,255,180,';
      const ng = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, nr * 4);
      ng.addColorStop(0, nc + '0.85)');
      ng.addColorStop(0.3, nc + '0.2)');
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.arc(cx2, cy2, nr * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = nc + '1)';
      ctx.beginPath(); ctx.arc(cx2, cy2, nr, 0, Math.PI * 2); ctx.fill();
    }

    for (let c = 0; c < 7; c++) {
      const cx2 = rng() * w * 0.8 + w * 0.1;
      const cy2 = rng() * h * 0.8 + h * 0.1;
      const cw = 18 + rng() * 32, ch = 12 + rng() * 22;
      ctx.strokeStyle = 'rgba(0,200,255,0.38)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx2, cy2, cw, ch);
      const pins = 3 + Math.floor(rng() * 3);
      for (let p = 1; p <= pins; p++) {
        const px = cx2 + (cw / (pins + 1)) * p;
        ctx.strokeStyle = 'rgba(0,180,255,0.32)';
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(px, cy2); ctx.lineTo(px, cy2 - 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px, cy2 + ch); ctx.lineTo(px, cy2 + ch + 8); ctx.stroke();
      }
    }

    const cg = ctx.createRadialGradient(w * 0.25, h * 0.5, 0, w * 0.25, h * 0.5, w * 0.6);
    cg.addColorStop(0, 'rgba(0,150,255,0.1)');
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h);
  }

  // BG3: Particle network / neural web
  function drawBg3(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = sr(3);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#020b18');
    grad.addColorStop(1, '#051428');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    const count = 80;
    const particles = Array.from({ length: count }, () => ({
      x: rng() * w, y: rng() * h,
      r: 1 + rng() * 2.5,
      hub: rng() > 0.85
    }));

    const maxDist = w * 0.18;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const a = (1 - dist / maxDist) * 0.35;
          const hub = particles[i].hub || particles[j].hub;
          ctx.strokeStyle = hub ? `rgba(0,220,255,${a})` : `rgba(60,130,255,${a * 0.7})`;
          ctx.lineWidth = hub ? 1.2 : 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      if (p.hub) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        g.addColorStop(0, 'rgba(0,220,255,0.55)');
        g.addColorStop(0.4, 'rgba(0,180,255,0.12)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,230,255,1)';
      } else {
        ctx.fillStyle = `rgba(80,160,255,${0.4 + rng() * 0.4})`;
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });

    [[0.2, 0.3, 0.32], [0.8, 0.7, 0.25]].forEach(([gx, gy, ga]) => {
      const bg = ctx.createRadialGradient(w*gx, h*gy, 0, w*gx, h*gy, w*0.4);
      bg.addColorStop(0, `rgba(13,71,161,${ga})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    });
  }

  // BG4: 3D perspective vanishing-point grid
  function drawBg4(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = sr(4);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#010810');
    grad.addColorStop(0.46, '#021428');
    grad.addColorStop(0.50, '#0a2050');
    grad.addColorStop(1, '#030f22');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    const vpX = w * 0.5, vpY = h * 0.48;

    const hg = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, w * 0.6);
    hg.addColorStop(0, 'rgba(0,100,255,0.32)');
    hg.addColorStop(0.3, 'rgba(0,60,200,0.1)');
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, w, h);

    const vCount = 24;
    for (let i = 0; i <= vCount; i++) {
      const xTop = (w / vCount) * i;
      const a = 0.1 + Math.sin((i / vCount) * Math.PI) * 0.22;
      ctx.strokeStyle = `rgba(0,180,255,${a})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(vpX, vpY); ctx.lineTo(xTop, 0); ctx.stroke();
    }

    for (let i = 1; i <= 10; i++) {
      const t = i / 10, e = t * t;
      const y = vpY * (1 - e);
      const xL = vpX + (0 - vpX) * (1 - e);
      const xR = vpX + (w - vpX) * (1 - e);
      ctx.strokeStyle = `rgba(0,160,255,${0.06 + e * 0.18})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(xL, y); ctx.lineTo(xR, y); ctx.stroke();
    }

    for (let i = 0; i <= 16; i++) {
      const xBot = (w / 16) * i;
      const a = 0.08 + Math.sin((i / 16) * Math.PI) * 0.28;
      ctx.strokeStyle = `rgba(0,200,255,${a})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(vpX, vpY); ctx.lineTo(xBot, h); ctx.stroke();
    }

    for (let i = 1; i <= 12; i++) {
      const t = i / 12, e = t * t;
      const y = vpY + (h - vpY) * e;
      const xL = vpX + (0 - vpX) * e;
      const xR = vpX + (w - vpX) * e;
      ctx.strokeStyle = `rgba(0,180,255,${0.05 + (1 - e) * 0.22})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(xL, y); ctx.lineTo(xR, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0,200,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, vpY); ctx.lineTo(w, vpY); ctx.stroke();

    const vpg = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, 90);
    vpg.addColorStop(0, 'rgba(0,220,255,0.75)');
    vpg.addColorStop(0.2, 'rgba(0,180,255,0.25)');
    vpg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vpg; ctx.fillRect(0, 0, w, h);

    for (let s = 0; s < 80; s++) {
      const sx = rng() * w, sy = rng() * vpY * 0.95;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.4 + rng() * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,220,255,${0.12 + rng() * 0.6})`;
      ctx.fill();
    }
  }

  // BG5: Aurora / cosmic nebula
  function drawBg5(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = sr(5);

    ctx.fillStyle = '#020512'; ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 120; i++) {
      const sx = rng() * w, sy = rng() * h;
      const r = 0.3 + rng() * 1.8;
      const bright = rng() > 0.92;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = bright ? `rgba(255,255,255,${0.2 + rng() * 0.6})` : `rgba(180,210,255,${0.1 + rng() * 0.4})`;
      ctx.fill();
      if (bright) {
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 9);
        sg.addColorStop(0, 'rgba(200,230,255,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sx, sy, 9, 0, Math.PI * 2); ctx.fill();
      }
    }

    [
      [0.25, 0.35, 0.55, 'rgba(13,71,161,0.52)'],
      [0.75, 0.45, 0.50, 'rgba(74,20,140,0.42)'],
      [0.50, 0.65, 0.45, 'rgba(0,96,100,0.38)'],
      [0.15, 0.75, 0.38, 'rgba(21,101,192,0.32)'],
      [0.85, 0.20, 0.40, 'rgba(100,0,130,0.35)'],
      [0.55, 0.20, 0.35, 'rgba(0,120,180,0.28)'],
    ].forEach(([bx, by, br, bc]) => {
      const bg = ctx.createRadialGradient(w*bx, h*by, 0, w*bx, h*by, w*br);
      bg.addColorStop(0, bc); bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    });

    const streakColors = [
      ['rgba(0,200,255,0.12)', 'rgba(0,100,200,0.04)'],
      ['rgba(120,0,255,0.10)', 'rgba(60,0,120,0.04)'],
      ['rgba(0,255,180,0.10)', 'rgba(0,120,80,0.04)'],
    ];
    for (let s = 0; s < 5; s++) {
      const sx = rng() * w, sy = rng() * h * 0.6;
      const sw = 30 + rng() * 80, sl = h * (0.2 + rng() * 0.4);
      const [sc1, sc2] = streakColors[Math.floor(rng() * streakColors.length)];
      ctx.save(); ctx.translate(sx, sy); ctx.rotate((rng() - 0.5) * 0.5);
      const sg = ctx.createLinearGradient(0, 0, 0, sl);
      sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(0.3, sc1);
      sg.addColorStop(0.7, sc2); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.fillRect(-sw / 2, 0, sw, sl);
      ctx.restore();
    }
  }

  // BG6: Hexagonal matrix
  function drawBg6(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = sr(6);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#010c1a'); grad.addColorStop(1, '#031525');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    const hexR = Math.max(16, Math.round(w / 22));
    const hexW = hexR * Math.sqrt(3);
    const hexH = hexR * 2;
    const cols2 = Math.ceil(w / hexW) + 2;
    const rows2 = Math.ceil(h / (hexH * 0.75)) + 2;

    for (let row = -1; row < rows2; row++) {
      for (let col = -1; col < cols2; col++) {
        const cx2 = col * hexW + (row % 2 === 0 ? 0 : hexW / 2);
        const cy2 = row * hexH * 0.75;
        const pts = hexPoints(cx2, cy2, hexR - 1);
        const roll = rng();
        const glowing = roll > 0.93;
        const medium  = roll > 0.78 && !glowing;
        const fAlpha  = glowing ? 0.18 : medium ? 0.06 : 0.02;
        const sAlpha  = glowing ? 0.85 : medium ? 0.32 : 0.09;
        const isCyan  = rng() > 0.4;
        const base    = isCyan ? '0,200,255' : '60,130,255';

        ctx.fillStyle = `rgba(${base},${fAlpha})`;
        ctx.beginPath();
        pts.forEach(([px, py], i) => i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
        ctx.closePath(); ctx.fill();

        ctx.strokeStyle = `rgba(${base},${sAlpha})`;
        ctx.lineWidth = glowing ? 1.5 : 0.5;
        ctx.stroke();

        if (glowing) {
          const gg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, hexR * 1.9);
          gg.addColorStop(0, `rgba(${base},0.25)`);
          gg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gg;
          ctx.beginPath(); ctx.arc(cx2, cy2, hexR * 1.9, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    const cg = ctx.createRadialGradient(w*.5, h*.5, 0, w*.5, h*.5, w*.55);
    cg.addColorStop(0, 'rgba(0,80,160,0.28)');
    cg.addColorStop(0.5, 'rgba(0,40,100,0.1)');
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h);

    const vg = ctx.createRadialGradient(w*.5, h*.5, w*.3, w*.5, h*.5, w*.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,5,15,0.6)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  const drawFns = [drawBg1, drawBg2, drawBg3, drawBg4, drawBg5, drawBg6];

  // ── Inicialización ───────────────────────────────────────────────────

  function init() {
    const heroCanvas = document.getElementById('heroCanvas');
    if (!heroCanvas) return;

    const ctx = heroCanvas.getContext('2d');
    const W = window.innerWidth;
    const H = window.innerHeight;
    heroCanvas.width  = W;
    heroCanvas.height = H;

    // Pre-renderizar los 6 fondos en offscreen canvases
    offscreens = drawFns.map(fn => {
      const oc = document.createElement('canvas');
      oc.width = W; oc.height = H;
      fn(oc);
      return oc;
    });

    // Dibujar el primero inmediatamente
    ctx.drawImage(offscreens[0], 0, 0);

    // Dots: clic manual
    document.querySelectorAll('.hero__dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const target = parseInt(dot.dataset.slide, 10);
        if (target === current || isFading) return;
        clearTimeout(autoTimer);
        crossfade(heroCanvas, ctx, target, true);
      });
    });

    // Arrancar el auto-avance
    scheduleNext(heroCanvas, ctx);

    // Redimensionar si cambia el viewport
    window.addEventListener('resize', debounce(() => resize(heroCanvas, ctx), 250));
  }

  // ── Crossfade ────────────────────────────────────────────────────────

  function crossfade(heroCanvas, ctx, target, resetTimer) {
    if (isFading) return;
    isFading = true;
    const from = current;
    const startTime = performance.now();

    function step(now) {
      const t = Math.min((now - startTime) / FADE_DURATION, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out quad

      ctx.globalAlpha = 1;
      ctx.drawImage(offscreens[from], 0, 0);
      ctx.globalAlpha = ease;
      ctx.drawImage(offscreens[target], 0, 0);
      ctx.globalAlpha = 1;

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        current = target;
        isFading = false;
        updateDots(current);
        if (resetTimer) scheduleNext(heroCanvas, ctx);
      }
    }

    rafId = requestAnimationFrame(step);
  }

  function scheduleNext(heroCanvas, ctx) {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      const next = (current + 1) % SLIDE_COUNT;
      crossfade(heroCanvas, ctx, next, true);
    }, SLIDE_DURATION);
  }

  // ── Dots ─────────────────────────────────────────────────────────────

  function updateDots(activeIndex) {
    document.querySelectorAll('.hero__dot').forEach((dot, i) => {
      const active = i === activeIndex;
      dot.classList.toggle('hero__dot--active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  }

  // ── Resize ───────────────────────────────────────────────────────────

  function resize(heroCanvas, ctx) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    heroCanvas.width  = W;
    heroCanvas.height = H;
    offscreens = drawFns.map(fn => {
      const oc = document.createElement('canvas');
      oc.width = W; oc.height = H;
      fn(oc);
      return oc;
    });
    ctx.drawImage(offscreens[current], 0, 0);
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // ── Arrancar al cargar ───────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
