# SellyAgent Marketing Site

Static HTML/CSS/JS — open `index.html` in a browser. No build step.

## Placeholder swaps

| File | What it's for | Size / ratio |
| --- | --- | --- |
| `assets/images/hero-house.png` | Hero house photo (parallax layer) — **PNG with transparent top** so the headline shows through at rest | 1606×919 |
| `assets/images/dashboard.png` | Product dashboard screenshot | 910×398 shown (supply 2× ≈ 1820×796) |
| `assets/images/template-1.jpg` … `template-3.jpg` | Website template previews (carousel) | 677×351 (supply 2×) |
| `assets/images/feature-websites.jpg` / `feature-social.jpg` / `feature-email.jpg` / `feature-trestle.jpg` | Feature-linked images | ~560×398 (supply 2×) |
| `assets/images/cta-house.jpg` | Bottom CTA cliffside house | 1440×823 |
| `assets/images/logo-1.png` … `logo-7.png` | Partner/brokerage logos | Varying — see current files |
| `assets/images/social-1.png` … `social-10.png` | Social post templates (social-media.html strip) | 275×344 (supplied at 2× = 550×688) |
| `assets/video/product-demo.mp4` | Product demo video | 1144×700, H.264 + AAC |

The SellyAgent logo (`Selly-Logo.svg`) is inlined in `index.html` (header + footer) with `fill="currentColor"` so the nav color flip works automatically.

Note: audible autoplay is blocked by most browsers until the user interacts with the page — the video falls back to muted autoplay and the corner button unmutes at 50% volume.

The contact form (`contact.html`) validates client-side and shows a success message only — wire the real submission (Formspree, Cloudflare Worker, etc.) inside `handleContactSubmit` in `assets/js/main.js`.
