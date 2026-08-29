document.addEventListener('DOMContentLoaded', () => {

  // Preloader
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('hidden'), 300);
  });

  // Header scroll state
  const header = document.getElementById('header');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
    backToTop.classList.toggle('show', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  navToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    navToggle.classList.toggle('active');
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });

  // Gallery filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      galleryItems.forEach(item => {
        const match = filter === 'all' || item.dataset.cat === filter;
        item.classList.toggle('hide', !match);
      });
    });
  });

  // FAQ accordion
  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.acc-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Contact form (client-side demo, replace with real backend/email service)
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formNote.textContent = 'Teşekkürler! Talebiniz alındı, en kısa sürede sizinle iletişime geçeceğiz.';
    form.reset();
  });

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.section-head, .card, .price-card, .about-media, .about-text, .gallery-item');
  revealEls.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

});
