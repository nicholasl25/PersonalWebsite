document.addEventListener('DOMContentLoaded', () => {

  // Intro splash: two letter wheels land on N then L, once per tab session
  (function initSplash() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    if (document.documentElement.classList.contains('splash-skip')) {
      splash.classList.add('splash-screen--gone', 'splash-screen--instant');
      splash.setAttribute('aria-hidden', 'true');
      splash.removeAttribute('aria-modal');
      return;
    }

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const cycles = 10;
    const buildStrip = () =>
      Array.from({ length: cycles }, () => alphabet)
        .join('')
        .split('')
        .map(ch => `<span class="splash-wheel-letter">${ch}</span>`)
        .join('');

    const leftStrip = splash.querySelector('.splash-wheel-strip--left');
    const rightStrip = splash.querySelector('.splash-wheel-strip--right');
    if (!leftStrip || !rightStrip) return;

    leftStrip.innerHTML = buildStrip();
    rightStrip.innerHTML = buildStrip();

    document.body.classList.add('splash-active');

    const dismiss = () => {
      sessionStorage.setItem('nlSplashSeen', '1');
      splash.classList.add('splash-screen--gone');
      document.body.classList.remove('splash-active');
      splash.setAttribute('aria-hidden', 'true');
      splash.removeAttribute('aria-modal');
    };

    const prefersReduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      splash.classList.add('splash-screen--animating');
      window.setTimeout(dismiss, 450);
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        splash.classList.add('splash-screen--animating');
      });
    });

    const fallbackMs = 2500;
    const fallbackId = window.setTimeout(dismiss, fallbackMs);

    const onEnd = () => {
      window.clearTimeout(fallbackId);
      rightStrip.removeEventListener('animationend', onEnd);
      dismiss();
    };

    rightStrip.addEventListener('animationend', onEnd);
  })();

  // Navbar scroll effect
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Scroll spy: highlight nav for the section in view
  const sectionIds = ['hero', 'about', 'education', 'experience', 'projects', 'contact', 'commit-history'];
  const logo = document.querySelector('.nav-logo');
  const desktopNavLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const mobileNavLinks = document.querySelectorAll('#mobile-menu a[href^="#"]');

  const getNavTriggerY = () => {
    const nav = document.getElementById('navbar');
    const h = nav ? nav.offsetHeight : 64;
    return window.scrollY + h + 16;
  };

  const setActiveSection = id => {
    if (logo) {
      logo.classList.toggle('nav-link-active', id === 'hero');
    }
    [...desktopNavLinks, ...mobileNavLinks].forEach(link => {
      const href = link.getAttribute('href');
      const match = href === `#${id}`;
      link.classList.toggle('nav-link-active', id !== 'hero' && match);
      if (id !== 'hero' && match) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const updateScrollSpy = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight - 4;
    if (window.scrollY >= maxScroll) {
      setActiveSection(sectionIds[sectionIds.length - 1]);
      return;
    }
    const triggerY = getNavTriggerY();
    let current = 'hero';
    for (const sid of sectionIds) {
      const el = document.getElementById(sid);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (triggerY >= top) current = sid;
    }
    setActiveSection(current);
  };

  let spyTicking = false;
  const onScrollSpy = () => {
    if (!spyTicking) {
      requestAnimationFrame(() => {
        updateScrollSpy();
        spyTicking = false;
      });
      spyTicking = true;
    }
  };

  window.addEventListener('scroll', onScrollSpy, { passive: true });
  window.addEventListener('resize', onScrollSpy, { passive: true });
  updateScrollSpy();

  // Mobile menu toggle
  const toggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  toggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    toggle.classList.toggle('active');
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      toggle.classList.remove('active');
    });
  });

  // Scroll-triggered fade-in animations
  const animateTargets = [
    ...document.querySelectorAll('.edu-card, .exp-card, .project-card, .about-content, .contact-links, .commit-viz')
  ];

  animateTargets.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  animateTargets.forEach(el => observer.observe(el));

  // Smooth scroll for anchor links (fallback for browsers without CSS scroll-behavior)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
