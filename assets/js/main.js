/* SellyAgent — main.js
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
  if (scrolled > hero.offsetHeight) return;
  heroText.style.transform = `translateY(${scrolled * 0.45}px)`;
  heroImage.style.transform = `translateY(${scrolled * -0.18}px)`;
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
  if (hero && !prefersReducedMotion) updateHeroParallax();
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

// 11. FAQ accordion
function handleFaqClick(event) {
  const toggle = event.target.closest(".faq-item__toggle");
  if (!toggle) return;
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  faqList
    .querySelectorAll('.faq-item__toggle[aria-expanded="true"]')
    .forEach((open) => open.setAttribute("aria-expanded", "false"));
  toggle.setAttribute("aria-expanded", String(!isOpen));
}

// 12. Scroll reveals
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

// 13. Initialization
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

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => setMenuOpen(!navMenu.classList.contains("is-open")));
    navMenu.addEventListener("click", handleMenuLinkClick);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navMenu.classList.contains("is-open")) setMenuOpen(false);
    });
  }
}

init();
