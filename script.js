const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px' });

document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));

const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('figcaption');
const lightboxCounter = lightbox?.querySelector('.lightbox-counter');
const lightboxPrevious = lightbox?.querySelector('.lightbox-prev');
const lightboxNext = lightbox?.querySelector('.lightbox-next');
let lightboxTrigger = null;
let lightboxItems = [];
let lightboxIndex = 0;
let touchStartX = 0;

const renderLightboxImage = () => {
  const trigger = lightboxItems[lightboxIndex];
  if (!trigger || !lightboxImage) return;
  const image = trigger.matches('img') ? trigger : trigger.querySelector('img');
  const source = trigger.dataset.lightbox || image?.currentSrc || image?.src;
  if (!source) return;

  lightboxImage.src = source;
  lightboxImage.alt = image?.alt || 'Mehendi design';
  lightboxCaption.textContent = trigger.dataset.caption || image?.dataset.caption || image?.alt || '';
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  const showNavigation = lightboxItems.length > 1;
  lightboxPrevious.hidden = !showNavigation;
  lightboxNext.hidden = !showNavigation;
};

const closeLightbox = () => {
  lightbox?.classList.remove('open');
  lightbox?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lightboxTrigger?.focus();
};

const openLightbox = (trigger) => {
  if (!lightbox || !lightboxImage) return;
  const panel = trigger.closest('[data-gallery-panel]');
  const panelImages = panel ? [...panel.querySelectorAll('.gallery-slot img')] : [];
  const panelItems = panelImages.length ? panelImages : (panel ? [...panel.querySelectorAll('[data-lightbox]')] : []);
  lightboxItems = [...new Set(panelItems.length ? panelItems : [trigger])];
  lightboxIndex = Math.max(0, lightboxItems.indexOf(trigger));

  lightboxTrigger = trigger;
  renderLightboxImage();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lightbox.querySelector('.lightbox-close')?.focus();
};

const stepLightbox = (direction) => {
  if (lightboxItems.length < 2) return;
  lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
  renderLightboxImage();
};

document.querySelectorAll('.gallery-row').forEach((row) => {
  const rowImages = [...row.querySelectorAll('.gallery-slot img')];
  const triggers = rowImages.length ? rowImages : [...row.querySelectorAll('[data-lightbox]')];
  if (!triggers.length) return;

  row.classList.add('has-images');
  row.dataset.visibleCount = String(Math.min(triggers.length, 5));
  triggers.forEach((trigger, index) => {
    const slot = trigger.closest('.gallery-slot') || trigger;
    slot.classList.add('gallery-item');
    trigger.loading = trigger.closest('.gallery-panel.active') && index === 0 ? 'eager' : 'lazy';
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-label', `Enlarge ${trigger.querySelector?.('img')?.alt || trigger.alt || 'design photo'}`);
    trigger.addEventListener('click', () => openLightbox(trigger));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(trigger);
      }
    });
    if (index >= 5) slot.classList.add('gallery-hidden');
  });

  if (triggers.length > 5) {
    const fifthSlot = triggers[4].closest('.gallery-slot') || triggers[4];
    fifthSlot.dataset.more = `+${triggers.length - 5} more`;
  }
});

const galleryTabs = [...document.querySelectorAll('[data-gallery-tab]')];
const galleryPanels = [...document.querySelectorAll('[data-gallery-panel]')];

const showGalleryCategory = (category) => {
  galleryTabs.forEach((tab) => {
    const selected = tab.dataset.galleryTab === category;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  galleryPanels.forEach((panel) => {
    const selected = panel.dataset.galleryPanel === category;
    panel.classList.toggle('active', selected);
    panel.hidden = !selected;
  });
};

galleryTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => showGalleryCategory(tab.dataset.galleryTab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + galleryTabs.length) % galleryTabs.length;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % galleryTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = galleryTabs.length - 1;
    galleryTabs[nextIndex].focus();
    showGalleryCategory(galleryTabs[nextIndex].dataset.galleryTab);
  });
});

document.querySelectorAll('[data-gallery-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const category = link.dataset.galleryLink;
    showGalleryCategory(category);
    document.querySelector('#designs')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    galleryTabs.find((tab) => tab.dataset.galleryTab === category)?.focus({ preventScroll: true });
  });
});

lightbox?.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
lightboxPrevious?.addEventListener('click', () => stepLightbox(-1));
lightboxNext?.addEventListener('click', () => stepLightbox(1));
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightbox?.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });
lightbox?.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) > 50) stepLightbox(distance > 0 ? -1 : 1);
}, { passive: true });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
  if (!lightbox?.classList.contains('open')) return;
  if (event.key === 'ArrowLeft') stepLightbox(-1);
  if (event.key === 'ArrowRight') stepLightbox(1);
});

const dateInput = document.querySelector('input[type="date"]');
if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

document.querySelector('#booking-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const dateValue = data.get('date');
  const eventDate = dateValue ? new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : '';
  const message = [
    'Hello Neetha, I would like to enquire about a mehendi booking.',
    '',
    `Name: ${data.get('name') || ''}`,
    `Phone: ${data.get('phone') || ''}`,
    `Event date: ${eventDate}`,
    `Service: ${data.get('service') || ''}`,
    `Location: ${data.get('location') || ''}`,
    `Details: ${data.get('message') || ''}`
  ].join('\n');
  window.open(`https://wa.me/918660740795?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});
