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

  /* ---------- Page-load entrance ----------
     One orchestrated beat: hero elements rise in sequence,
     paced generously so the page settles rather than snaps. */
  function playEntrance(root) {
    const items = $$("[data-enter]", root).filter((el) => !el.dataset.enterDone);
    if (!items.length) return;

    const show = (el) => {
      el.classList.add("is-in");
      el.dataset.enterDone = "1";
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(show);
      return;
    }

    items.forEach((el, i) => {
      el.style.setProperty("--enter-delay", i * 130 + "ms");
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    items.forEach((el) => io.observe(el));
  }
  /* Reveal is owned by JS so the fallback is always available and the
     scroll-driven enhancement never leaves anything stuck invisible. */
  function playReveal() {
    const items = $$("[data-reveal]");
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
  playEntrance(document);
  playReveal();

  /* ---------- Scroll reveal ---------- */
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
