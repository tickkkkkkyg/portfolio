# Personal Site

A single-page personal portfolio built with plain HTML, CSS, and JavaScript.
No build step, no dependencies — open `index.html` and it works.

## Preview

The site is already being served at **http://localhost:5100**

To restart the server later:

```bash
cd personal-site
python3 -m http.server 5100 --bind 0.0.0.0
```

## Files

```
personal-site/
├── index.html          # all page content and markup
└── assets/
    ├── styles.css      # design system + layout + responsive rules
    └── main.js         # nav, reveal animations, counters, form validation
```

## Make it yours

1. **Content** — edit the placeholder text in `index.html`. Search for
   `Your Name`, `Your City`, `Your Company`, `Project One`, `you@example.com`.
2. **Colors** — the whole site is themed from the `:root` variables at the top
   of `assets/styles.css`. Change `--accent`, `--accent-2` and `--accent-3`
   to rebrand everything at once.
3. **Project images** — drop an image in `assets/` and replace the
   `.card__media` placeholder div with `<img src="assets/your-image.jpg" alt="…">`.
4. **Form** — the contact form validates but doesn't send anywhere. Wire it up
   with a service like Formspree, Netlify Forms, or a Cloudflare Worker.

## Features included

- Responsive layout (mobile, tablet, desktop)
- Sticky nav with scroll progress bar and active-section highlighting
- Animated hero, count-up stats, and scroll-reveal sections
- Working mobile menu
- Form validation with error states
- Keyboard accessible with visible focus rings
- Respects `prefers-reduced-motion`

## Deploy

It is a plain static site, so any of these work with no configuration:

- **GitHub Pages** — push the folder to a repo, enable Pages
- **Netlify / Vercel** — drag the folder in
- **Cloudflare Pages** — connect the repo, no build command needed