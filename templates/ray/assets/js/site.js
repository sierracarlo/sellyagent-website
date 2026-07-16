/* ==========================================================================
   site.js — shared behaviour for every page.
   Each feature guards on the elements it needs, so this one file can load on
   any page and only the relevant behaviours activate.
   ========================================================================== */
(function () {
  'use strict';

  /* Reveal an element's scroll animation by flipping it into view. Works for
     both a container (`.in-view .will-animate`) and an element that is itself
     animated (`.will-animate.in-view`) — see base.css. */
  function reveal(element) {
    element.classList.add('in-view');
  }

  /* Publishes the scrollbar width as `--sbw` so CSS can subtract it from
     100vw. 100vw includes a classic scrollbar while document layout does not;
     without this correction, viewport-based grid math (sticky nav, home hero)
     lands ~half a scrollbar to the right of the content grid. Zero on
     overlay-scrollbar platforms, so nothing changes there. */
  function initScrollbarWidthVar() {
    function set() {
      var sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--sbw', sbw + 'px');
    }

    window.addEventListener('resize', set);
    set();
  }

  /* Hero carousel — overlapping crossfade + continuous Ken Burns zoom. -------- */
  function initHeroCarousel() {
    var slides = document.querySelectorAll('.hero__slide');
    if (slides.length <= 1) return;

    // On phones the crossfading stack is wasted work and the mid-fade frames
    // read as a cluttered double-exposure — hold a single static photo instead.
    if (window.matchMedia('(max-width: 640px)').matches) return;

    var FADE_MS = 2200; // must match the CSS opacity transition
    var HOLD_MS = 6000; // time each slide is held before the next begins
    var current = 0;

    setInterval(function () {
      var next = (current + 1) % slides.length;
      var previous = current;

      slides[next].classList.add('is-active');
      void slides[next].offsetWidth; // reflow so the zoom restarts cleanly

      // Retire the outgoing slide only once it has fully faded, so the
      // crossfade never snaps.
      setTimeout(function () {
        slides[previous].classList.remove('is-active');
      }, FADE_MS);

      current = next;
    }, HOLD_MS);
  }

  /* Sticky nav — two phases, one seamless bar. -------------------------------
     The in-hero nav and the fixed #sticky-nav sit on the same viewport grid,
     so at the scroll position where the hero nav would reach the top of the
     screen we swap them (`.is-pinned`) with zero visible movement. The bar
     stays transparent with white text while the hero is on screen, then gains
     a black blurred backdrop (`.is-solid`) once scrolled past the hero. */
  function initStickyNav() {
    var hero = document.getElementById('hero');
    var nav = document.getElementById('sticky-nav');
    if (!hero || !nav) return;

    var heroNav = hero.querySelector('.hero__nav');
    var NAV_HEIGHT = 92;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      var pinned = y > hero.offsetTop;
      var solid = y > hero.offsetTop + hero.offsetHeight - NAV_HEIGHT;

      nav.classList.toggle('is-pinned', pinned);
      nav.classList.toggle('is-solid', solid);
      if (heroNav) heroNav.style.visibility = pinned ? 'hidden' : '';
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
  }

  /* Hero content animates immediately on load. ------------------------------ */
  function initHeroReveal() {
    document.querySelectorAll('.hero .will-animate').forEach(reveal);
  }

  /* Scroll-triggered reveals for everything marked `.observe`. --------------- */
  function initScrollReveal() {
    var targets = document.querySelectorAll('.observe');
    if (!targets.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (target) { observer.observe(target); });
  }

  /* Gentle vertical parallax on an image, clamped so no edge is ever exposed.
     `speed` controls intensity; `scale` (if the image is CSS-scaled) bounds
     the travel to the available overflow. Writes are batched into
     requestAnimationFrame so scrolling never waits on style updates. */
  function bindParallax(frameId, imageId, speed, scale) {
    var frame = document.getElementById(frameId);
    var image = document.getElementById(imageId);
    if (!frame || !image) return;

    var ticking = false;

    function update() {
      ticking = false;
      var rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return; // offscreen

      var frameCenter = rect.top + rect.height / 2;
      var offset = (window.innerHeight / 2 - frameCenter) * speed;

      if (scale) {
        var maxOffset = (rect.height * (scale - 1)) / 2;
        offset = Math.max(-maxOffset, Math.min(maxOffset, offset));
        image.style.transform = 'scale(' + scale + ') translateY(' + offset + 'px)';
      } else {
        image.style.transform = 'translateY(' + offset + 'px)';
      }
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  /* Smooth scrolling with decay ----------------------------------------------
     Wheel input feeds a target position; the actual scroll eases toward it by
     a fixed fraction per frame (exponential decay), so movement glides and
     settles instead of stepping. Native behaviour is kept where it's better:
     touch devices (momentum is native), keyboard, scrollbar drags, and users
     who prefer reduced motion. Because the easing drives window.scrollTo, all
     scroll-linked features (sticky nav, parallax, reveals) work unchanged. */
  function initSmoothScroll() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var EASE = 0.1;   // fraction of the remaining distance covered per frame
    var target = window.scrollY;
    var current = window.scrollY;
    var animating = false;

    function maxScroll() {
      return document.documentElement.scrollHeight - window.innerHeight;
    }

    function step() {
      current += (target - current) * EASE;

      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        animating = false;
        return;
      }

      window.scrollTo(0, current);
      requestAnimationFrame(step);
    }

    window.addEventListener('wheel', function (event) {
      if (document.body.classList.contains('menu-open')) return;
      event.preventDefault();

      var delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;                    // lines
      else if (event.deltaMode === 2) delta *= window.innerHeight; // pages

      target = Math.max(0, Math.min(maxScroll(), target + delta));

      if (!animating) {
        animating = true;
        requestAnimationFrame(step);
      }
    }, { passive: false });

    // Scrolls from other sources (keyboard, scrollbar, anchors) stay native;
    // re-sync so the next wheel starts from wherever the page actually is.
    window.addEventListener('scroll', function () {
      if (!animating) { current = target = window.scrollY; }
    }, { passive: true });
  }

  /* Mobile menu — the nav hamburgers open a full-screen link panel. Closing
     happens via the X, choosing a link, or pressing Escape; body scrolling is
     locked while it's open. */
  function initMobileMenu() {
    var menu = document.getElementById('mobile-menu');
    if (!menu) return;

    var burgers = document.querySelectorAll('.nav-burger');
    var closeButton = menu.querySelector('.mobile-menu__close');

    function setOpen(open) {
      menu.classList.toggle('open', open);
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('menu-open', open);
      burgers.forEach(function (burger) {
        burger.setAttribute('aria-expanded', String(open));
      });
      if (open) closeButton.focus();
    }

    burgers.forEach(function (burger) {
      burger.addEventListener('click', function () { setOpen(true); });
    });
    closeButton.addEventListener('click', function () { setOpen(false); });
    menu.querySelectorAll('.mobile-menu__links a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
    });
  }

  /* Gallery carousel (property page) — the left/right halves of the image are
     invisible buttons that step backwards/forwards through the slides with a
     crossfade. The hover gradients that hint at this are pure CSS.
     When idle, the carousel advances by itself: the timer pauses while the
     cursor is over the image, restarts after any manual step, and is skipped
     entirely for users who prefer reduced motion. */
  function initGalleryCarousel() {
    var carousel = document.getElementById('pd-carousel');
    if (!carousel) return;

    var slides = carousel.querySelectorAll('.pd-carousel__slide');
    if (slides.length <= 1) return;

    var IDLE_MS = 5000;
    var current = 0;
    var timer = null;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(index) {
      var next = (index + slides.length) % slides.length;
      slides[current].classList.remove('is-active');
      slides[next].classList.add('is-active');
      current = next;
    }

    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function startAutoplay() {
      if (reducedMotion || timer) return;
      timer = setInterval(function () { show(current + 1); }, IDLE_MS);
    }

    function manualStep(delta) {
      show(current + delta);
      stopAutoplay();   // restart the idle countdown from this interaction
      startAutoplay();
    }

    carousel.querySelector('.pd-carousel__zone--prev')
      .addEventListener('click', function () { manualStep(-1); });
    carousel.querySelector('.pd-carousel__zone--next')
      .addEventListener('click', function () { manualStep(1); });

    // Hovering means the user is engaged (reading, about to click), so the
    // carousel holds still; it resumes counting once the cursor leaves.
    carousel.addEventListener('pointerenter', stopAutoplay);
    carousel.addEventListener('pointerleave', startAutoplay);

    startAutoplay();
  }

  /* Accordion for the "More Iconic Properties" rows. ------------------------ */
  var ICON_CLOSE =
    '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">' +
    '<line x1="1" y1="1" x2="11" y2="11" stroke="#191919" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="11" y1="1" x2="1" y2="11" stroke="#191919" stroke-width="1.5" stroke-linecap="round"/></svg>';

  var ICON_PLUS =
    '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">' +
    '<line x1="6" y1="1" x2="6" y2="11" stroke="#191919" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="1" y1="6" x2="11" y2="6" stroke="#191919" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function initAccordion() {
    var headers = document.querySelectorAll('.prow-header');
    if (!headers.length) return;

    headers.forEach(function (header) {
      function toggle() {
        var row = header.closest('.prow');
        var body = row.querySelector('.accordion-body');
        var icon = row.querySelector('.prow-icon');
        var willOpen = !body.classList.contains('open');

        body.classList.toggle('open', willOpen);
        header.setAttribute('aria-expanded', String(willOpen));
        icon.innerHTML = willOpen ? ICON_CLOSE : ICON_PLUS;
      }

      header.addEventListener('click', toggle);
      header.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  /* Boot ------------------------------------------------------------------- */
  initScrollbarWidthVar();
  initSmoothScroll();
  initMobileMenu();
  initHeroCarousel();
  initStickyNav();
  initHeroReveal();
  initScrollReveal();
  bindParallax('cta-banner', 'cta-parallax', 0.12, 1.25); // home CTA banner
  bindParallax('banner-mid', 'banner-parallax', 0.12);    // about mid banner
  initGalleryCarousel();
  initAccordion();
})();
