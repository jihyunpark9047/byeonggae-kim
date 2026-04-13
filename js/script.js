/* ============================================================
   KYEONGBAE KIM — Portfolio
   script.js
   ============================================================ */

'use strict';

/* ---- Project Data ---- */
const PROJECTS = {
  'independent-1': {
    title: 'Fragments',
    category: 'Independent Film',
    year: '2024',
    duration: '7 min',
    role: 'Director / Animator',
    description: 'An animated short exploring the fragmentation of memory and identity. Each frame dissolves into the next, mirroring the way consciousness unravels under sustained pressure. The film was developed over eighteen months as a purely personal inquiry into the texture of forgetting.',
    videoId: '0VweUigkTzY',
    back: '../independent-film.html',
    galleryImages: [
      'https://img.youtube.com/vi/0VweUigkTzY/maxresdefault.jpg',
      'https://img.youtube.com/vi/0VweUigkTzY/hqdefault.jpg',
      'https://img.youtube.com/vi/0VweUigkTzY/mqdefault.jpg',
    ]
  },
  'independent-2': {
    title: 'Threshold',
    category: 'Independent Film',
    year: '2023',
    duration: '12 min',
    role: 'Director / Animator',
    description: 'A meditation on the liminal spaces between states — waking and sleeping, presence and absence. Figures drift through landscapes that breathe and shift. Nothing stays still. The work was screened at independent animation festivals in Seoul, Tokyo, and Berlin.',
    videoId: '0VweUigkTzY',
    back: '../independent-film.html',
    galleryImages: [
      'https://img.youtube.com/vi/0VweUigkTzY/maxresdefault.jpg',
      'https://img.youtube.com/vi/0VweUigkTzY/hqdefault.jpg',
      'https://img.youtube.com/vi/0VweUigkTzY/mqdefault.jpg',
    ]
  },
  'commercial-1': {
    title: 'Pulse',
    category: 'Commercial Film',
    year: '2024',
    duration: '3 min',
    role: 'Director / Lead Animator',
    description: 'A kinetic brand film for a leading digital platform. Raw energy translated into animated sequences that pulse with the rhythm of the brand. The brief called for something that felt alive — nervous, urgent, and alive.',
    videoId: 'Y4gwAX3yrpk',
    back: '../commercial-film.html',
    galleryImages: [
      'https://img.youtube.com/vi/Y4gwAX3yrpk/maxresdefault.jpg',
      'https://img.youtube.com/vi/Y4gwAX3yrpk/hqdefault.jpg',
      'https://img.youtube.com/vi/Y4gwAX3yrpk/mqdefault.jpg',
    ]
  },
  'commercial-2': {
    title: 'Resonance',
    category: 'Commercial Film',
    year: '2023',
    duration: '4 min',
    role: 'Director / Animator',
    description: 'Music video animation exploring resonance between the sonic and the visual. Colors and forms vibrate in precise response to each musical moment. Commissioned for a Korean pop artist's visual campaign.',
    videoId: 'Y4gwAX3yrpk',
    back: '../commercial-film.html',
    galleryImages: [
      'https://img.youtube.com/vi/Y4gwAX3yrpk/maxresdefault.jpg',
      'https://img.youtube.com/vi/Y4gwAX3yrpk/hqdefault.jpg',
      'https://img.youtube.com/vi/Y4gwAX3yrpk/mqdefault.jpg',
    ]
  }
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initNavToggle();
  initScrollReveal();
  initScrollHeader();
  initPageTransitions();
  initLightbox();
  initBackToTop();

  // Project template page
  if (document.getElementById('project-content')) {
    initProjectTemplate();
  }
});

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.querySelector('.cursor');
  const ring   = document.querySelector('.cursor-ring');
  if (!cursor || !ring) return;

  let ringX = 0, ringY = 0;
  let mouseX = 0, mouseY = 0;
  let animId;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.transform = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
  });

  function animateRing() {
    const ease = 0.12;
    ringX += (mouseX - ringX) * ease;
    ringY += (mouseY - ringY) * ease;
    ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
    animId = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover state on interactive elements
  const hoverables = 'a, button, [data-hover], .nav-block, .film-card, .gallery-item, .illustration-item';
  document.querySelectorAll(hoverables).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('is-hovering'));
  });
}

/* ============================================================
   NAV TOGGLE
   ============================================================ */
function initNavToggle() {
  const toggle  = document.querySelector('.nav-toggle');
  const overlay = document.querySelector('.nav-overlay');
  if (!toggle || !overlay) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('is-open');
    overlay.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on link click
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      toggle.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
}

/* ============================================================
   SCROLL REVEAL (IntersectionObserver)
   ============================================================ */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

/* ============================================================
   SCROLL HEADER
   ============================================================ */
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ============================================================
   PAGE TRANSITIONS
   ============================================================ */
function initPageTransitions() {
  // Fade in on load
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.6s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });
  });

  // Fade out on internal link click
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || link.target === '_blank') return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const dest = link.href;
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = dest; }, 450);
    });
  });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
function initLightbox() {
  const lightbox = document.querySelector('.lightbox');
  if (!lightbox) return;

  const lightboxImg   = lightbox.querySelector('.lightbox-img');
  const lightboxClose = lightbox.querySelector('.lightbox-close');

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 400);
  }

  // Bind gallery items
  document.querySelectorAll('[data-lightbox]').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.lightbox;
      openLightbox(src);
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

/* ============================================================
   BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = document.querySelector('.footer-back-top');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   PROJECT TEMPLATE — populate from URL param
   ============================================================ */
function initProjectTemplate() {
  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');
  const data    = PROJECTS[id];

  if (!data) {
    document.getElementById('project-content').innerHTML =
      '<p style="padding:200px 48px;font-family:DM Mono,monospace;font-size:.625rem;letter-spacing:.2em;color:rgba(240,237,232,.3)">PROJECT NOT FOUND</p>';
    return;
  }

  // Back link
  const backLink = document.querySelector('.project-back');
  if (backLink) backLink.href = data.back;

  // Label
  const label = document.querySelector('.project-label');
  if (label) label.textContent = data.category;

  // Title
  const title = document.querySelector('.project-title');
  if (title) title.textContent = data.title;

  // Description
  const desc = document.querySelector('.project-desc');
  if (desc) desc.textContent = data.description;

  // Meta
  const metaYear     = document.querySelector('[data-meta="year"]');
  const metaDuration = document.querySelector('[data-meta="duration"]');
  const metaRole     = document.querySelector('[data-meta="role"]');
  if (metaYear)     metaYear.textContent     = data.year;
  if (metaDuration) metaDuration.textContent = data.duration;
  if (metaRole)     metaRole.textContent     = data.role;

  // Video
  const videoFrame = document.querySelector('.project-video-frame');
  if (videoFrame) {
    videoFrame.src = `https://www.youtube.com/embed/${data.videoId}?rel=0&modestbranding=1&color=white`;
  }

  // Gallery
  const galleryGrid = document.querySelector('.project-gallery-grid');
  if (galleryGrid && data.galleryImages) {
    galleryGrid.innerHTML = data.galleryImages.map(src => `
      <div class="gallery-item" data-lightbox="${src}">
        <img src="${src}" alt="Gallery image" loading="lazy">
        <div class="gallery-item-overlay">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
      </div>
    `).join('');

    // Re-init lightbox bindings for dynamically added items
    document.querySelectorAll('[data-lightbox]').forEach(item => {
      item.addEventListener('click', () => {
        const lightbox    = document.querySelector('.lightbox');
        const lightboxImg = lightbox.querySelector('.lightbox-img');
        lightboxImg.src   = item.dataset.lightbox;
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  // Page title
  document.title = `${data.title} — Kyeongbae Kim`;
}
