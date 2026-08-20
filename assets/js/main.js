/* Selly - main.js
   Cinematic scroll (Lenis), hero parallax, adaptive nav color,
   template carousel, feature switcher, video sound toggle,
   FAQ accordion, scroll reveals. */

// 1. Constants
const CAROUSEL_IDLE_MS = 5000;
const TEMPLATE_IMAGES = [
  "assets/images/template-1.jpg",
  "assets/images/template-2.jpg",
  "assets/images/template-3.jpg",
];
const FEATURE_IMAGES = {
  websites: "assets/images/feature-websites.jpg",
  social: "assets/images/feature-social.jpg",
  email: "assets/images/feature-email.jpg",
  trestle: "assets/images/feature-trestle.jpg",
};
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 2. DOM references
const header = document.getElementById("siteHeader");
const hero = document.getElementById("hero");
const heroText = document.querySelector("[data-parallax-text]");
const heroImage = document.querySelector("[data-parallax-image]");
const carousel = document.getElementById("templateCarousel");
const featuresPanel = document.getElementById("featuresPanel");
const featureImage = document.querySelector("[data-feature-image]");
const video = document.getElementById("promoVideo");
const muteToggle = document.getElementById("muteToggle");
const faqList = document.getElementById("faqList");
const navFlipSection = document.querySelector("[data-nav-flip]");
const contactForm = document.getElementById("contactForm");
const navMenu = document.getElementById("navMenu");
const menuToggle = document.getElementById("menuToggle");

// 3. Cinematic smooth scrolling (Lenis)
let lenis = null;

function initSmoothScroll() {
  if (prefersReducedMotion || typeof Lenis === "undefined") return;
  lenis = new Lenis({ lerp: 0.09 });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

// 4. Hero parallax — the text scrolls away slower than the page,
//    so the house image slides up and covers it.
function updateHeroParallax() {
  const scrolled = window.scrollY;
  const bound = hero ? hero.offsetHeight : navFlipSection ? navFlipSection.offsetHeight : 0;
  if (scrolled > bound) return;
  heroText.style.transform = `translateY(${scrolled * 0.45}px)`;
  if (heroImage) heroImage.style.transform = `translateY(${scrolled * -0.18}px)`;
}

// 5. Adaptive nav color — flips to ink once the header scrolls past
//    the section marked data-nav-flip (hero imagery / page gradient).
function updateHeaderColor() {
  if (!navFlipSection) return;
  // data-nav-flip may carry an explicit boundary (px); defaults to section height.
  const flipAt = parseFloat(navFlipSection.dataset.navFlip) || navFlipSection.offsetHeight;
  const overWhite = window.scrollY > flipAt - header.offsetHeight;
  header.classList.toggle("is-dark", overWhite);
}

function onScroll() {
  if (heroText && !prefersReducedMotion) updateHeroParallax();
  updateHeaderColor();
}

// 6. Template carousel — auto-advances when idle; the side slides
//    are clickable (hover tint indicates it).
let currentTemplate = 0;
let carouselTimer = null;

function templateAt(offset) {
  return (currentTemplate + offset + TEMPLATE_IMAGES.length) % TEMPLATE_IMAGES.length;
}

function renderCarousel() {
  const slides = {
    "[data-carousel-prev]": templateAt(-1),
    "[data-carousel-current]": currentTemplate,
    "[data-carousel-next]": templateAt(1),
  };
  Object.entries(slides).forEach(([selector, index]) => {
    const slide = carousel.querySelector(selector);
    const img = slide.querySelector("img");
    slide.classList.add("is-switching");
    setTimeout(() => {
      img.src = TEMPLATE_IMAGES[index];
      slide.classList.remove("is-switching");
    }, 200);
  });
}

function goToTemplate(step) {
  currentTemplate = templateAt(step);
  renderCarousel();
  restartCarouselTimer();
}

function restartCarouselTimer() {
  clearInterval(carouselTimer);
  carouselTimer = setInterval(() => goToTemplate(1), CAROUSEL_IDLE_MS);
}

// 7. Feature switcher — clicking a feature reveals its copy and
//    swaps the connected image.
function activateFeature(featureEl) {
  featuresPanel.querySelectorAll(".feature").forEach((el) => {
    const isActive = el === featureEl;
    el.classList.toggle("is-active", isActive);
    el.querySelector(".feature__toggle").setAttribute("aria-selected", String(isActive));
  });
  featureImage.classList.add("is-switching");
  setTimeout(() => {
    const key = featureEl.dataset.feature;
    featureImage.src = FEATURE_IMAGES[key];
    featureImage.alt = `${featureEl.querySelector(".feature__name").textContent} preview`;
    featureImage.classList.remove("is-switching");
  }, 250);
}

function handleFeatureClick(event) {
  const toggle = event.target.closest(".feature__toggle");
  if (!toggle) return;
  const feature = toggle.closest(".feature");
  if (!feature.classList.contains("is-active")) activateFeature(feature);
}

// 8. Video — autoplays at 50% volume when it scrolls into view;
//    browsers that block audible autoplay fall back to muted.
function initVideo() {
  video.volume = 0.5;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            video.muted = true;
            muteToggle.setAttribute("aria-pressed", "true");
            muteToggle.setAttribute("aria-label", "Unmute video");
            video.play().catch(() => {});
          });
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.4 }
  );
  observer.observe(video);
}

function handleMuteToggle() {
  video.muted = !video.muted;
  if (!video.muted) video.volume = 0.5;
  muteToggle.setAttribute("aria-pressed", String(video.muted));
  muteToggle.setAttribute("aria-label", video.muted ? "Unmute video" : "Mute video");
}

// 9. Nav menu overlay — plus toggles it, Escape closes, links close
//    then scroll to their section (feature links also activate their tab).
function setMenuOpen(open) {
  navMenu.classList.toggle("is-open", open);
  navMenu.setAttribute("aria-hidden", String(!open));
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  header.classList.toggle("is-menu-open", open);
  document.body.style.overflow = open ? "hidden" : "";
  if (lenis) open ? lenis.stop() : lenis.start();
}

function handleMenuLinkClick(event) {
  const link = event.target.closest(".nav-menu__link");
  if (!link) {
    // Click landed on the empty overlay area — just close.
    setMenuOpen(false);
    return;
  }
  const href = link.getAttribute("href");
  if (!href.startsWith("#")) return; // cross-page link: navigate normally
  event.preventDefault();
  setMenuOpen(false);
  const featureKey = link.dataset.featureLink;
  if (featureKey) {
    activateFeature(featuresPanel.querySelector(`[data-feature="${featureKey}"]`));
  }
  const target = document.querySelector(link.getAttribute("href"));
  if (lenis) {
    lenis.scrollTo(target, { offset: -40 });
  } else {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

// 10. Contact form — client-side validation and a success state.
//     Wire the submission to a real endpoint (e.g. Formspree or a
//     Cloudflare Worker) inside this handler when one exists.
function handleContactSubmit(event) {
  event.preventDefault();
  const status = document.getElementById("contactStatus");
  if (!contactForm.checkValidity()) {
    status.textContent = "Please fill in your name, a valid email, and a message.";
    status.classList.add("is-error");
    return;
  }
  status.classList.remove("is-error");
  status.textContent = "Thanks! We'll get back to you shortly.";
  contactForm.reset();
}

// 11. Template strip (social page) — auto-scrolls forever; dragging
//     scrubs it directly and auto-scroll resumes on release.
function initTemplateStrip(strip) {
  const track = strip.querySelector(".post-strip__track");
  track.innerHTML += track.innerHTML; // duplicate set for a seamless loop
  const clones = track.children.length / 2;
  for (let i = clones; i < track.children.length; i++) {
    track.children[i].setAttribute("aria-hidden", "true");
    track.children[i].alt = "";
  }

  const SPEED = 30; // px per second
  let offset = 0;
  let setWidth = 0;
  let dragging = false;
  let lastPointerX = 0;
  let lastTime = performance.now();

  const measure = () => {
    setWidth = track.scrollWidth / 2;
  };
  measure();
  window.addEventListener("resize", measure);

  function frame(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    if (!dragging && !prefersReducedMotion) offset -= SPEED * dt;
    // keep offset within (-setWidth, 0] so the loop never shows a gap
    offset = -(((-offset % setWidth) + setWidth) % setWidth);
    track.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  strip.addEventListener("pointerdown", (event) => {
    dragging = true;
    lastPointerX = event.clientX;
    strip.classList.add("is-dragging");
    strip.setPointerCapture(event.pointerId);
  });
  strip.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    offset += event.clientX - lastPointerX;
    lastPointerX = event.clientX;
  });
  const release = () => {
    dragging = false;
    strip.classList.remove("is-dragging");
  };
  strip.addEventListener("pointerup", release);
  strip.addEventListener("pointercancel", release);
}

// 12. Template showcase (websites page) — three live template pages in
//     iframes. One shows the desktop viewport; the others show mobile.
//     Clicking a mobile card expands it to desktop and collapses the
//     current one; a veil covers each iframe while its viewport swaps.
function initTemplateShowcase(stage) {
  const VIEWPORTS = { mobile: 390, desktop: 1440 };
  const SWITCH_MS = 650; // matches the .tpl flex-basis transition
  const CARD_HEIGHT = 458;
  const units = Array.from(stage.querySelectorAll(".tpl"));
  const stacked = () => window.matchMedia("(max-width: 900px)").matches;

  // Where each card sits after any tween: mobile cards keep their 213px
  // basis (shrinking pro-rata on narrow containers) and the desktop card
  // absorbs the rest.
  function cardWidths() {
    if (stacked()) {
      const width = stage.clientWidth;
      return { mobile: width, desktop: width };
    }
    const inner = stage.clientWidth - 2 * 19; // two flex gaps
    const mobile = inner >= 1103 ? 213 : (inner * 213) / 1103;
    return { mobile, desktop: inner - 2 * mobile };
  }

  // Lay both copies of every page out once (and again only on resize):
  // each frame is sized for the card width its state will occupy, so
  // expanding a card never causes layout inside an iframe — the switch
  // is purely a crossfade plus transforms.
  function sizeAll() {
    const widths = cardWidths();
    units.forEach((unit) => {
      // Stacked layout shows every page at the desktop viewport; side by
      // side, the active copy follows each card's state.
      setActive(unit, stacked() || unit.classList.contains("is-desktop") ? "desktop" : "mobile");
      unit.querySelectorAll(".tpl__frame").forEach((frame) => {
        const viewport = VIEWPORTS[frame.dataset.viewport];
        const width = widths[frame.dataset.viewport];
        frame.style.width = `${viewport}px`;
        frame.style.height = `${Math.ceil(CARD_HEIGHT * viewport / Math.max(width, 1))}px`;
      });
    });
    fitFrames();
  }

  // Transform-only tracking — cheap enough to run every animation frame
  // while the card widths tween.
  function fitFrames() {
    units.forEach((unit) => {
      const width = unit.querySelector(".tpl__card").clientWidth;
      unit.querySelectorAll(".tpl__frame").forEach((frame) => {
        frame.style.transform = `scale(${width / VIEWPORTS[frame.dataset.viewport]})`;
      });
    });
  }

  function activeFrame(unit) {
    return unit.querySelector(".tpl__frame.is-active");
  }

  function setActive(unit, viewport) {
    unit.querySelectorAll(".tpl__frame").forEach((frame) => {
      frame.classList.toggle("is-active", frame.dataset.viewport === viewport);
    });
  }

  let switching = false;

  function expand(unit) {
    if (switching || unit.classList.contains("is-desktop") || stacked()) return;
    switching = true;
    setWarm(unit, false);
    units.forEach((u) => {
      const becomesDesktop = u === unit;
      u.classList.toggle("is-desktop", becomesDesktop);
      setActive(u, becomesDesktop ? "desktop" : "mobile");
    });
    const start = performance.now();
    const follow = (now) => {
      fitFrames();
      if (now - start < SWITCH_MS) {
        requestAnimationFrame(follow);
      } else {
        fitFrames();
        switching = false;
      }
    };
    requestAnimationFrame(follow);
  }

  // Hover intent pre-warms the frames the click would reveal (this
  // unit's desktop copy and the current desktop unit's mobile copy), so
  // they are already rasterized when the crossfade starts.
  function setWarm(unit, warm) {
    units.forEach((u) => {
      u.querySelectorAll(".tpl__frame").forEach((frame) => {
        frame.classList.remove("is-warm");
      });
    });
    if (!warm) return;
    const current = units.find((u) => u.classList.contains("is-desktop"));
    unit.querySelector('.tpl__frame--desktop').classList.add("is-warm");
    if (current && current !== unit) {
      current.querySelector('.tpl__frame--mobile').classList.add("is-warm");
    }
  }

  units.forEach((unit) => {
    const expandButton = unit.querySelector(".tpl__expand");
    expandButton.addEventListener("click", () => expand(unit));
    expandButton.addEventListener("pointerenter", () => setWarm(unit, true));
    expandButton.addEventListener("pointerleave", () => setWarm(unit, false));

    // Mobile drag layer: vertical drags scroll the framed page. Drags are
    // relayed via postMessage; scaled frames scroll 1:1 with the finger
    // (delta divided by the frame's scale). See the embed guard inside
    // the template pages for the receiving half.
    const touchLayer = unit.querySelector(".tpl__touch");
    let lastY = null;

    touchLayer.addEventListener("pointerdown", (event) => {
      lastY = event.clientY;
      touchLayer.setPointerCapture(event.pointerId);
    });
    touchLayer.addEventListener("pointermove", (event) => {
      if (lastY === null) return;
      const frame = activeFrame(unit);
      const scale = frame.getBoundingClientRect().width / frame.offsetWidth;
      const dy = (lastY - event.clientY) / (scale || 1);
      lastY = event.clientY;
      frame.contentWindow.postMessage({ type: "sellyagent:scroll", dy }, "*");
    });
    const endDrag = () => { lastY = null; };
    touchLayer.addEventListener("pointerup", endDrag);
    touchLayer.addEventListener("pointercancel", endDrag);
  });

  // The framed page bounces the delta back when it hits its top or
  // bottom, so the drag hands off to the page scroll instead of trapping.
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "sellyagent:edge") return;
    let sourceFrame = null;
    units.forEach((unit) => {
      unit.querySelectorAll(".tpl__frame").forEach((frame) => {
        if (frame.contentWindow === event.source) sourceFrame = frame;
      });
    });
    if (!sourceFrame) return;
    const scale = sourceFrame.getBoundingClientRect().width / sourceFrame.offsetWidth || 1;
    // Drag deltas arrive in frame-space (rescale); wheel deltas are already
    // screen-space. Route through Lenis when it's driving the page so the
    // hand-off keeps the same glide as normal scrolling.
    const dy = data.wheel ? data.dy : data.dy * scale;
    if (lenis) {
      lenis.scrollTo((lenis.targetScroll ?? window.scrollY) + dy);
    } else {
      window.scrollBy(0, dy);
    }
  });

  window.addEventListener("resize", sizeAll);
  sizeAll();
}

// 13. FAQ accordion
function handleFaqClick(event) {
  const toggle = event.target.closest(".faq-item__toggle");
  if (!toggle) return;
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  faqList
    .querySelectorAll('.faq-item__toggle[aria-expanded="true"]')
    .forEach((open) => open.setAttribute("aria-expanded", "false"));
  toggle.setAttribute("aria-expanded", String(!isOpen));
}

// 14. Scroll reveals
function initReveals() {
  if (prefersReducedMotion) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// 15. Trestle map — drag to pan anywhere within the artwork, zoom in and
//     out via the corner controls (out reveals the wider metro area).
//     Pins react to hover only (CSS); nothing is clickable.
function initPortalMap(mapEl) {
  const scene = mapEl.querySelector("[data-map-scene]");
  const VIEWBOX = { w: 1090, h: 640 }; // matches the inline SVG
  // Full artwork bounds — the drawn map extends well past the viewBox so
  // panning and zooming out never reveal blank space.
  const ART = { x: -300, y: -220, w: 1690, h: 1080 };
  const ZOOM_STEP = 1.4;
  const MIN_SCALE = 0.62;
  const MAX_SCALE = 4;
  let scale = 1;
  let tx = 0;
  let ty = 0;

  // preserveAspectRatio="slice": px per user unit, and the visible window
  // measured in user units.
  function metrics() {
    const k = Math.max(mapEl.clientWidth / VIEWBOX.w, mapEl.clientHeight / VIEWBOX.h);
    return { k, vw: mapEl.clientWidth / k, vh: mapEl.clientHeight / k };
  }

  // Keep the visible window inside the artwork; if a fully zoomed-out axis
  // is smaller than the window, center it instead.
  function clampAxis(t, view, artStart, artSize) {
    const max = -artStart * scale;
    const min = view - (artStart + artSize) * scale;
    return min > max ? (view - artSize * scale) / 2 - artStart * scale : Math.min(max, Math.max(t, min));
  }

  function clamp() {
    const { vw, vh } = metrics();
    tx = clampAxis(tx, vw, ART.x, ART.w);
    ty = clampAxis(ty, vh, ART.y, ART.h);
  }

  function render() {
    scene.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  // Zoom about the center of the visible window so the view stays anchored.
  function zoom(factor) {
    const { vw, vh } = metrics();
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    tx = vw / 2 - ((vw / 2 - tx) / scale) * next;
    ty = vh / 2 - ((vh / 2 - ty) / scale) * next;
    scale = next;
    clamp();
    render();
  }

  mapEl.querySelectorAll("[data-map-zoom]").forEach((btn) => {
    btn.addEventListener("click", () => zoom(btn.dataset.mapZoom === "in" ? ZOOM_STEP : 1 / ZOOM_STEP));
  });

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  mapEl.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".portal__zoom")) return;
    event.preventDefault(); // stops text selection from starting mid-drag
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    mapEl.classList.add("is-panning");
    mapEl.setPointerCapture(event.pointerId);
  });
  mapEl.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const { k } = metrics(); // screen px → user units
    tx += (event.clientX - lastX) / k;
    ty += (event.clientY - lastY) / k;
    lastX = event.clientX;
    lastY = event.clientY;
    clamp();
    render();
  });
  const endPan = () => {
    dragging = false;
    mapEl.classList.remove("is-panning");
  };
  mapEl.addEventListener("pointerup", endPan);
  mapEl.addEventListener("pointercancel", endPan);

  window.addEventListener("resize", () => {
    clamp();
    render();
  });
}

// 16. Trestle portal snap — the portal fills the viewport (CSS), and when
//     the user scrolls it substantially into view the page glides so it
//     occupies the full screen. Re-arms once it mostly leaves the viewport.
function initPortalSnap(portal) {
  if (prefersReducedMotion) return;
  const wide = window.matchMedia("(min-width: 1025px)");
  let snapped = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!wide.matches) return;
        if (entry.intersectionRatio >= 0.35 && !snapped) {
          snapped = true;
          // Land the portal just below the fixed header so the filter
          // bar stays visible; together they fill the screen exactly.
          const offset = -header.offsetHeight;
          if (lenis) {
            lenis.scrollTo(portal, { offset, duration: 1 });
          } else {
            window.scrollTo({
              top: portal.getBoundingClientRect().top + window.scrollY + offset,
              behavior: "smooth",
            });
          }
        } else if (entry.intersectionRatio < 0.1) {
          snapped = false;
        }
      });
    },
    { threshold: [0.1, 0.35] }
  );
  observer.observe(portal);
}

// 17. Initialization
function init() {
  initSmoothScroll();
  initReveals();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (video) initVideo();
  if (muteToggle) muteToggle.addEventListener("click", handleMuteToggle);

  if (carousel) {
    carousel.querySelector("[data-carousel-prev]").addEventListener("click", () => goToTemplate(-1));
    carousel.querySelector("[data-carousel-next]").addEventListener("click", () => goToTemplate(1));
    restartCarouselTimer();
  }

  if (featuresPanel) featuresPanel.addEventListener("click", handleFeatureClick);
  if (faqList) faqList.addEventListener("click", handleFaqClick);
  if (contactForm) contactForm.addEventListener("submit", handleContactSubmit);

  const templateStrip = document.querySelector("[data-template-strip]");
  if (templateStrip) initTemplateStrip(templateStrip);

  const portalMap = document.getElementById("portalMap");
  if (portalMap) initPortalMap(portalMap);

  const portal = document.getElementById("mlsPortal");
  if (portal) initPortalSnap(portal);

  const showcaseStage = document.querySelector("[data-showcase]");
  if (showcaseStage) initTemplateShowcase(showcaseStage);

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => setMenuOpen(!navMenu.classList.contains("is-open")));
    navMenu.addEventListener("click", handleMenuLinkClick);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navMenu.classList.contains("is-open")) setMenuOpen(false);
    });
  }
}

init();
