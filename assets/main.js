/* =========================================================
   Bipna Budha — interactions
   Motion is sparse and purposeful: one page-load beat, gentle
   reveal on scroll, working menu and form. Everything degrades
   to fully readable with JS disabled.
   ========================================================= */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionMQ.matches;

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Masthead state ---------- */
  const masthead = $(".masthead");
  const toTop = $("#toTop");

  function onScroll() {
    const y = window.scrollY;
    if (masthead) masthead.classList.toggle("is-stuck", y > 8);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      $(".masthead__links a")?.focus?.();
    });
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $("#menuToggle");
  const menu = $("#menu");
  if (masthead && toggle && menu) {
    const setOpen = (open) => {
      masthead.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };
    toggle.addEventListener("click", () => setOpen(!masthead.classList.contains("is-open")));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && masthead.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    // Close when the layout grows past the mobile breakpoint
    const wide = window.matchMedia("(min-width: 721px)");
    wide.addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Text → character spans ----------
     Wraps every text node in .char spans so the hero title can reveal
     one letter at a time. Safe to run once; idempotent. */
  function splitIntoChars(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach((tn) => {
      const text = tn.textContent;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      [...text].forEach((ch) => {
        const sp = document.createElement("span");
        sp.className = "char";
        sp.textContent = ch === " " ? "\u00A0" : ch;
        sp.style.display = "inline-block";
        frag.appendChild(sp);
      });
      tn.parentNode.replaceChild(frag, tn);
    });
  }

  /* ---------- Cinematic hero entrance ----------
     One orchestrated beat: role line → title letters (staggered) →
     subtitle → actions → stats. Slow and calm, paced like a breath.
     Uses transform + opacity only (animation-motion law 1). */
  async function cinematicIntro(root) {
    if (reduceMotion) {
      $$("[data-enter]", root).forEach((el) => el.classList.add("is-in"));
      return;
    }

    const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

    async function reveal(el, { delay = 0, duration = 520, fromY = 14, stagger = 0 } = {}) {
      if (!el) return;
      const chars = $$(".char", el);
      if (chars.length) {
        // Make the parent visible so the animated child characters can be seen.
        el.style.opacity = '1';
        await Promise.all(
          chars.map((span, i) =>
            span.animate(
              [{ opacity: 0, transform: `translateY(${fromY}px)` },
               { opacity: 1, transform: "none" }],
              {
                duration,
                delay: delay + i * stagger,
                easing: EASE,
                fill: "both",
              }
            ).finished
          )
        );
      } else {
        await el.animate(
          [{ opacity: 0, transform: `translateY(${fromY}px)` },
           { opacity: 1, transform: "none" }],
          { duration, delay, easing: EASE, fill: "both" }
        ).finished;
      }
    }

    const role = $(".hero__role", root);
    const title = $(".hero__name", root);
    const lede = $(".hero__lede", root);
    const actions = $(".hero__actions", root);
    const assurance = $(".hero__assurance", root);

    // Split the hero title into characters (letters inside <em> included)
    if (title) splitIntoChars(title);

    // One orchestrated sequence; each phase overlaps the previous by ~150ms
    await reveal(role, { delay: 60 });            // enters first
    await reveal(title, { delay: 180, stagger: 40 }); // letters cascade
    await reveal(lede, { delay: 320 });           // overlaps title tail
    await reveal(actions, { delay: 460 });        // overlaps lede tail
    await reveal(assurance, { delay: 600 });      // settles last

    // Mark everything done so CSS transitions don't re-trigger
    $$("[data-enter]", root).forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Hero 3D mouse parallax ----------
     Layers drift at different depths following the pointer,
     giving a gentle dimensional feel without WebGL. */
  if (!reduceMotion) {
    const hero = $(".hero");
    if (hero) {
      const layers = $$(".hero__layer", hero);
      if (layers.length) {
        hero.addEventListener("mousemove", (e) => {
          const r = hero.getBoundingClientRect();
          const cx = (e.clientX - r.left) / r.width - 0.5;
          const cy = (e.clientY - r.top) / r.height - 0.5;
          layers.forEach((el) => {
            const z = parseFloat(el.dataset.z || 0);
            const strength = z / 40;
            const x = cx * 12 * strength;
            const y = cy * 12 * strength;
            el.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
          });
        });
        hero.addEventListener("mouseleave", () => {
          layers.forEach((el) => {
            el.style.transform = `translateZ(${el.dataset.z || 0}px)`;
          });
        });
      }
    }
  }

  /* ---------- Card tilt (service rows, principles, journal entries) ----------
     Subtle rotate on pointer over each element, restrained to a few degrees. */
  if (!reduceMotion) {
    const tiltables = $$(".service, .principle, .entry");
    tiltables.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(var(--perspective)) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }
  /* Reveal is owned by JS so the fallback is always available and the
     scroll-driven enhancement never leaves anything stuck invisible. */
  function playReveal() {
    const items = $$("[data-reveal], [data-enter]").filter((el) => !el.closest(".hero"));
    if (!items.length) return;

    const show = (el) => el.classList.add("is-in");

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(show);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    items.forEach((el) => io.observe(el));
  }

  document.documentElement.classList.add("js");

  // Hero gets the orchestrated cinematic beat; everything else reveals on scroll.
  const hero = $(".hero");
  if (hero) cinematicIntro(hero);

  playReveal();

  /* ---------- Scroll reveal ----------
     Handles [data-reveal] and any [data-enter] outside the hero,
     revealed as they scroll into view. */
  const revealables = $$("[data-reveal]");
  if (revealables.length) {
    motionMQ.addEventListener("change", (e) => {
      if (e.matches) revealables.forEach((el) => el.classList.add("is-in"));
    });
  }

  /* ---------- Appointment form ---------- */
  const form = $("#bookingForm");
  const note = $("#formNote");
  if (form && note) {
    const setError = (input, message) => {
      const field = input.closest(".field");
      field.classList.toggle("is-error", Boolean(message));
      const slot = $(".field__error", field);
      if (slot) slot.textContent = message || "";
      input.setAttribute("aria-invalid", message ? "true" : "false");
    };

    const validators = {
      name: (v) => (v.trim() ? "" : "Tell us what to call you."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email so we can reply."),
      message: (v) => (v.trim().length >= 10 ? "" : "A sentence or two is enough."),
    };

    // Clear a field's error as soon as it becomes valid
    Object.keys(validators).forEach((key) => {
      const input = form.elements[key];
      if (!input) return;
      input.addEventListener("blur", () => setError(input, validators[key](input.value)));
      input.addEventListener("input", () => {
        if (input.closest(".field").classList.contains("is-error") && !validators[key](input.value)) {
          setError(input, "");
        }
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.classList.remove("is-error");

      let firstBad = null;
      Object.keys(validators).forEach((key) => {
        const input = form.elements[key];
        if (!input) return;
        const message = validators[key](input.value);
        setError(input, message);
        if (message && !firstBad) firstBad = input;
      });

      if (firstBad) {
        note.textContent = "Check the highlighted fields and send again.";
        note.classList.add("is-error");
        firstBad.focus();
        return;
      }

      const name = form.elements.name.value.trim().split(/\s+/)[0];
      note.textContent = `Thank you, ${name}. This form is a demo — connect it to your clinic inbox to receive requests.`;
      form.reset();
    });
  }

  /* ---------- Reduced-motion changes at runtime ---------- */
  motionMQ.addEventListener("change", (e) => {
    reduceMotion = e.matches;
    if (reduceMotion) {
      $$("[data-enter], [data-reveal]").forEach((el) => el.classList.add("is-in"));
    }
  });
})();
