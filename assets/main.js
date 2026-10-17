/* =========================================================
   Portfolio — interactions
   Motion follows the animation-motion skill: transform/opacity only,
   named transitions, reduced-motion aware.
   ========================================================= */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduceMotionMQ.matches;

  const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
  const EASE_IN  = "cubic-bezier(0.55, 0, 1, 0.45)";

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Custom cursor ---------- */
  const cursor = $(".cursor");
  const cursorDot = $(".cursor-dot");
  if (cursor && cursorDot && !reduceMotion) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    function cursorLoop() {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      cursorDot.style.transform = `translate(${mx}px, ${my}px)`;
      requestAnimationFrame(cursorLoop);
    }
    requestAnimationFrame(cursorLoop);

    $$("a, button, [data-magnetic]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!reduceMotion) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.animate(
          [{ transform: el.style.transform }, { transform: "translate(0,0)" }],
          { duration: 320, easing: EASE_OUT },
        );
        el.style.transform = "";
      });
    });
  }

  /* ---------- Card tilt ---------- */
  if (!reduceMotion) {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.animate(
          [{ transform: card.style.transform }, { transform: "translateY(0)" }],
          { duration: 320, easing: EASE_OUT },
        );
        card.style.transform = "";
      });
    });
  }

  /* ---------- Sticky nav state ---------- */
  const nav = $("#nav");
  const toTop = $("#toTop");
  const progress = $(".scroll-progress");

  function onScroll() {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("is-stuck", y > 12);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    if (progress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
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
    });
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$("a", links).forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealables = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.classList.add("is-in"));
  } else {
    // Respect CSS scroll-driven animations: skip IO where supported
    const supportsScrollTimeline = CSS.supports("animation-timeline", "view()");
    if (!supportsScrollTimeline) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("is-in");
          io.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
      revealables.forEach((el) => io.observe(el));
    } else {
      // scroll-driven handles it; just mark observed for safety
      revealables.forEach((el) => el.classList.add("is-in"));
    }
  }

  /* ---------- Hero stats count-up ---------- */
  const counters = $$(".stat__num[data-count]");
  if (counters.length) {
    const runCount = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      if (reduceMotion) { el.textContent = target; return; }
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        statObserver.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => statObserver.observe(el));
  }

  /* ---------- Active nav link (scroll spy) ---------- */
  const sections = $$("main section[id]");
  const navLinks = $$("#navLinks a");
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + id)
        );
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Typewriter ---------- */
  const tw = $(".typewriter");
  if (tw) {
    const words = (tw.dataset.words || "").split(",").map((w) => w.trim()).filter(Boolean);
    if (words.length) {
      let wi = 0, ci = 0, deleting = false;
      const tick = () => {
        const word = words[wi];
        if (!deleting) {
          ci++;
          tw.textContent = word.slice(0, ci);
          if (ci === word.length) { deleting = true; setTimeout(tick, 1600); return; }
          setTimeout(tick, 60);
        } else {
          ci--;
          tw.textContent = word.slice(0, ci);
          if (ci === 0) {
            deleting = false;
            wi = (wi + 1) % words.length;
            setTimeout(tick, 300);
            return;
          }
          setTimeout(tick, 30);
        }
      };
      if (reduceMotion) {
        tw.textContent = words[0];
      } else {
        tick();
      }
    }
  }

  /* ---------- Hero particle network ---------- */
  const canvas = $(".hero__canvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles = [];
    const COUNT = 60;
    let mx = -9999, my = -9999;

    function resize() {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.4 + 0.6,
      });
    }

    const hero = $(".hero");
    if (hero) {
      hero.addEventListener("mousemove", (e) => {
        const r = hero.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
      });
      hero.addEventListener("mouseleave", () => { mx = -9999; my = -9999; });
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      // update
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        // mouse attraction
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && dist > 0) {
          p.x += dx * 0.008;
          p.y += dy * 0.008;
        }
      }
      // lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 110) {
            ctx.strokeStyle = `rgba(79, 60, 201, ${0.18 * (1 - d / 110)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // dots
      for (const p of particles) {
        ctx.fillStyle = "rgba(79, 60, 201, 0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Contact form ---------- */
  const form = $("#contactForm");
  const note = $("#formNote");
  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      $$(".field", form).forEach((f) => f.classList.remove("is-error"));
      note.classList.remove("is-error");
      const required = $$("[required]", form);
      let firstBad = null;
      required.forEach((input) => {
        const value = input.value.trim();
        const valid = input.type === "email"
          ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          : value.length > 0;
        if (!valid) {
          input.closest(".field").classList.add("is-error");
          if (!firstBad) firstBad = input;
        }
      });
      if (firstBad) {
        note.textContent = "Please fill in all fields correctly.";
        note.classList.add("is-error");
        firstBad.focus();
        return;
      }
      note.textContent = "Thanks — this demo form isn't wired up yet.";
      form.reset();
    });
  }

  /* ---------- Reduced motion runtime ---------- */
  reduceMotionMQ.addEventListener("change", (e) => {
    reduceMotion = e.matches;
  });
})();
