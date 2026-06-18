/* ============================================================
   KYEONGBAE KIM — Portfolio
   script.js
   ============================================================ */

'use strict';

/* ---- Portfolio data (from js/portfolio-data.js / Drive sync) ---- */
const PROJECTS = typeof PORTFOLIO !== 'undefined' ? PORTFOLIO.projects : {};

const NAV_SECTIONS = [
  { href: 'independent-film.html', number: '01', label: 'Independent Film' },
  { href: 'commercial-film.html', number: '02', label: 'Commercial Film' },
  { href: 'animating.html', number: '03', label: 'Animating' },
  { href: 'short-clip.html', number: '04', label: 'Short Clip' },
  { href: 'illustration.html', number: '05', label: 'Illustration' },
  { href: 'about.html', number: '06', label: 'About' },
];

const HOME_BLOCKS = [
  { href: 'independent-film.html', number: '01', title: 'Independent<br>Film', section: 'independent-film' },
  { href: 'commercial-film.html', number: '02', title: 'Commercial<br>Film', section: 'commercial-film' },
  { href: 'animating.html', number: '03', title: 'Animating', section: 'animating' },
  { href: 'short-clip.html', number: '04', title: 'Short Clip', section: 'short-clip' },
  { href: 'illustration.html', number: '05', title: 'Illustration', section: 'illustration' },
  { href: 'about.html', number: '06', title: 'About', section: 'about' },
];

function getSectionThumb(sectionKey) {
  if (typeof PORTFOLIO === 'undefined') return null;
  const section = PORTFOLIO.sections[sectionKey];
  if (!section) return null;
  if (section.projects && section.projects.length) {
    const p = PROJECTS[section.projects[0]];
    return p && p.thumbnail;
  }
  if (section.items && section.items.length) {
    return section.items[0].url;
  }
  return null;
}

function getHeroVideoEmbed() {
  const ids = PORTFOLIO?.sections?.['independent-film']?.projects || [];
  if (ids.length && PROJECTS[ids[0]]?.videoEmbed) {
    return PROJECTS[ids[0]].videoEmbed;
  }
  return null;
}

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
  initHomePage();
  initFilmGrid();
  initGalleryGrid();

  if (document.getElementById('project-content')) {
    initProjectTemplate();
  }
});

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.body.classList.add('custom-cursor');

  const cursor = document.querySelector('.cursor');
  const ring   = document.querySelector('.cursor-ring');
  if (!cursor || !ring) return;

  let ringX = 0, ringY = 0;
  let mouseX = 0, mouseY = 0;
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
    requestAnimationFrame(animateRing);
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
    document.body.classList.toggle('nav-is-open', isOpen);
  });

  // Close on link click
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      document.body.classList.remove('nav-is-open');
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      toggle.classList.remove('is-open');
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      document.body.classList.remove('nav-is-open');
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
  }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

  els.forEach(el => {
    // If already in viewport on load, reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-visible');
    } else {
      io.observe(el);
    }
  });
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
   HOME PAGE
   ============================================================ */
function initHomePage() {
  const blocks = document.querySelector('.nav-blocks[data-home-blocks]');
  if (!blocks || typeof PORTFOLIO === 'undefined') return;

  blocks.innerHTML = HOME_BLOCKS.map((block, i) => {
    const thumb = getSectionThumb(block.section);
    const bgStyle = thumb
      ? `style="background-image:url('${thumb}')"`
      : '';
    const arrow = block.section === 'about' ? 'Learn more →' : 'View work →';
    return `
      <a href="${block.href}" class="nav-block" aria-label="${block.title.replace(/<br>/g, ' ')}">
        <div class="nav-block-bg" ${bgStyle}></div>
        <div class="nav-block-overlay"></div>
        <div class="nav-block-content">
          <span class="nav-block-number">${block.number}</span>
          <h2 class="nav-block-title">${block.title}</h2>
          <span class="nav-block-arrow">${arrow}</span>
        </div>
      </a>`;
  }).join('');

  bindHoverables();
  initScrollReveal();
}

/* ============================================================
   FILM GRID (Independent / Commercial listing)
   ============================================================ */
function initFilmGrid() {
  const grid = document.querySelector('.film-grid[data-section]');
  if (!grid || typeof PORTFOLIO === 'undefined') return;

  const sectionKey = grid.dataset.section;
  const ids = PORTFOLIO.sections[sectionKey]?.projects || [];
  const categoryMap = {
    'independent-film': 'Independent',
    'commercial-film': 'Commercial',
    'animating': 'Animating',
    'short-clip': 'Short Clip',
  };
  const categoryLabel = categoryMap[sectionKey] || 'Work';

  grid.innerHTML = ids.map((id, i) => {
    const p = PROJECTS[id];
    if (!p) return '';
    const thumb = p.thumbnail || '';
    const delay = i > 0 ? ` reveal-delay-${Math.min(i, 3)}` : '';
    const metaExtra = p.client
      ? `<span class="film-card-client">${p.client}</span>`
      : '';
    return `
      <a href="projects/project-template.html?id=${id}" class="film-card reveal${delay}">
        <div class="film-card-thumb">
          <img src="${thumb}" alt="${p.title}" loading="lazy">
          <div class="film-card-play" aria-hidden="true">
            <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
        </div>
        <div class="film-card-info">
          <div class="film-card-meta">
            <span class="film-card-category">${categoryLabel}</span>
            ${metaExtra}
            <span class="film-card-year">${p.year || ''}</span>
          </div>
          <h2 class="film-card-title">${p.title}</h2>
          <span class="film-card-link">View project</span>
        </div>
      </a>`;
  }).join('');

  bindHoverables();
  initScrollReveal();
}

/* ============================================================
   GALLERY GRID (Animating / Short Clip / Illustration)
   ============================================================ */
function initGalleryGrid() {
  const grid = document.querySelector('.illustration-grid[data-section]');
  if (!grid || typeof PORTFOLIO === 'undefined') return;

  const sectionKey = grid.dataset.section;
  const items = PORTFOLIO.sections[sectionKey]?.items || [];

  grid.innerHTML = items.map((item, i) => {
    const delay = i > 0 ? ` reveal-delay-${Math.min(i % 3, 3)}` : '';
    const lightboxSrc = item.url ? item.url.replace('&sz=w1200', '&sz=w2000') : item.fullUrl;
    return `
      <div class="illustration-item reveal${delay}" data-lightbox="${lightboxSrc}">
        <img src="${item.url}" alt="${item.name}" loading="lazy">
        <div class="illustration-overlay">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
      </div>`;
  }).join('');

  bindLightboxItems();
  bindHoverables();
  initScrollReveal();
}

function bindHoverables() {
  const hoverables = 'a, button, [data-hover], .nav-block, .film-card, .gallery-item, .illustration-item';
  document.querySelectorAll(hoverables).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('is-hovering'));
  });
}

function bindLightboxItems() {
  document.querySelectorAll('[data-lightbox]').forEach(item => {
    if (item.dataset.lightboxBound) return;
    item.dataset.lightboxBound = '1';
    item.addEventListener('click', () => {
      const lightbox = document.querySelector('.lightbox');
      const lightboxImg = lightbox.querySelector('.lightbox-img');
      lightboxImg.src = item.dataset.lightbox;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });
}

/* ============================================================
   PROJECT TEMPLATE — populate from URL param
   ============================================================ */
function initProjectTemplate() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const data = PROJECTS[id];

  if (!data) {
    document.getElementById('project-content').innerHTML =
      '<p style="padding:200px 48px;font-family:DM Mono,monospace;font-size:.625rem;letter-spacing:.2em;color:rgba(240,237,232,.3)">PROJECT NOT FOUND</p>';
    return;
  }

  const backLink = document.querySelector('.project-back');
  if (backLink) backLink.href = data.back;

  const label = document.querySelector('.project-label');
  if (label) label.textContent = data.category;

  const title = document.querySelector('.project-title');
  if (title) title.textContent = data.title;

  const desc = document.querySelector('.project-desc');
  if (desc) desc.textContent = data.description || '';

  const setMeta = (key, value) => {
    const el = document.querySelector(`[data-meta="${key}"]`);
    const wrap = document.querySelector(`[data-meta-wrap="${key}"]`) ||
      (el && el.closest('.project-meta-item'));
    if (!el) return;
    if (value) {
      el.textContent = value;
      if (wrap) wrap.style.display = '';
    } else if (wrap) {
      wrap.style.display = 'none';
    }
  };

  setMeta('year', data.year);
  setMeta('duration', data.duration);
  setMeta('role', data.role);
  setMeta('client', data.client);

  const videoFrame = document.querySelector('.project-video-frame');
  const videoWrap  = document.querySelector('.project-video');
  const poster     = document.querySelector('.project-video-poster');

  if (data.videoEmbed) {
    if (poster && data.thumbnail) {
      // Show thumbnail poster; load video on click
      poster.querySelector('.project-poster-img').src = data.thumbnail;
      poster.addEventListener('click', () => {
        const sep = data.videoEmbed.includes('?') ? '&' : '?';
        videoFrame.src = data.videoEmbed + sep + 'autoplay=1';
        poster.classList.add('hidden');
      });
    } else {
      if (poster) poster.style.display = 'none';
      if (videoFrame) videoFrame.src = data.videoEmbed;
    }
  } else {
    if (videoWrap) videoWrap.style.display = 'none';
  }

  const gallerySection = document.querySelector('.project-gallery');
  const galleryGrid = document.querySelector('.project-gallery-grid');
  const gallery = data.gallery || [];

  if (galleryGrid && gallery.length) {
    galleryGrid.innerHTML = gallery.map((g) => {
      const lightboxSrc = g.url ? g.url.replace('&sz=w1200', '&sz=w2000') : g.fullUrl;
      return `
      <div class="gallery-item" data-lightbox="${lightboxSrc}">
        <img src="${g.url}" alt="${g.name || 'Gallery'}" loading="lazy">
        <div class="gallery-item-overlay">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
      </div>`;
    }).join('');
    bindLightboxItems();
  } else if (gallerySection) {
    gallerySection.style.display = 'none';
  }

  document.title = `${data.title} — Kyeongbae Kim`;
}
