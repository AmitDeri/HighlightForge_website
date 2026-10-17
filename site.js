// HighlightForge website effects. The page reads fine without this file; every effect respects reduced motion.
(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // header hairline once the page scrolls
  const header = document.querySelector("header.top");
  const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mobile menu
  const menuBtn = document.querySelector(".menu-btn");
  const menu = document.getElementById("menu");
  if (menuBtn && menu) {
    const setOpen = (open) => { menu.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
    menuBtn.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  // headline words come in one by one
  const headline = document.querySelector(".headline");
  if (headline) {
    headline.querySelectorAll(".w").forEach((w, i) => w.style.setProperty("--d", `${0.08 * i}s`));
    requestAnimationFrame(() => requestAnimationFrame(() => headline.classList.add("in")));
  }

  // stagger siblings, then reveal on scroll
  document.querySelectorAll(".steps, .bento, .styles, .plans, .faq").forEach((group) => {
    [...group.children].forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 6) * 0.07}s`));
  });
  const hero = document.querySelector(".hero");
  hero && hero.querySelectorAll(".reveal").forEach((el, i) => el.style.setProperty("--d", `${0.35 + i * 0.1}s`));
  const reveals = document.querySelectorAll(".reveal, .stage");
  if ("IntersectionObserver" in window && !still) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // the app screenshot: tilted back, flattens as it scrolls up
  const stage = document.querySelector("[data-tilt]");
  const frame = stage && stage.querySelector(".frame");
  if (frame && !still) {
    let ticking = false;
    const tilt = () => {
      ticking = false;
      const r = stage.getBoundingClientRect();
      const p = Math.min(Math.max(1 - (r.top - innerHeight * 0.15) / (innerHeight * 0.75), 0), 1);
      frame.style.setProperty("--tilt", `${(1 - p) * 18}deg`);
      frame.style.setProperty("--zoom", `${0.94 + p * 0.06}`);
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(tilt); } }, { passive: true });
    addEventListener("resize", tilt);
    tilt();
  }

  // stream timeline: highlight markers light up as a scan line passes, then the short video fills
  const timeline = document.querySelector("[data-timeline]");
  if (timeline) {
    const marks = timeline.querySelector(".tl-marks");
    const kinds = ["k", "k", "f", "k", "t", "r", "f", "k", "t", "k", "r", "f", "k", "t", "k", "f", "k", "r", "k", "t", "f", "k"];
    let seed = 7;
    const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const items = kinds.map((kind, i) => {
      const at = Math.min(97, (i + 0.25 + rand() * 0.6) * (97 / kinds.length) + 1);
      const el = document.createElement("i");
      el.className = kind;
      el.style.left = `${at}%`;
      marks.appendChild(el);
      return { el, at };
    });
    const play = () => {
      timeline.classList.add("played");
      if (still) { items.forEach((m) => m.el.classList.add("on")); return; }
      const scan = timeline.querySelector(".tl-scan");
      const start = performance.now(), dur = 2200;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1), at = p * 100;
        scan.style.opacity = p < 1 ? "1" : "0";
        scan.style.transform = `translateX(${(at / 100) * scan.parentElement.clientWidth}px)`;
        items.forEach((m) => { if (m.at <= at) m.el.classList.add("on"); });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); setTimeout(play, 300); }
      }, { threshold: 0.45 });
      io.observe(timeline);
    } else play();
  }

  // cursor spotlight on cards
  document.querySelectorAll(".glow").forEach((card) => card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  // FAQ: smooth open and close
  if (!still) document.querySelectorAll(".faq details").forEach((d) => {
    const body = d.querySelector("summary + div");
    d.querySelector("summary").addEventListener("click", (e) => {
      e.preventDefault();
      if (d.dataset.busy) return;
      d.dataset.busy = "1";
      const opening = !d.open;
      if (opening) d.open = true;
      const h = body.scrollHeight;
      const anim = body.animate({ height: opening ? ["0px", `${h}px`] : [`${h}px`, "0px"], opacity: opening ? [0, 1] : [1, 0] },
        { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
      anim.onfinish = () => { if (!opening) d.open = false; delete d.dataset.busy; };
    });
  });

  // mark the current section in the nav
  const navLinks = [...document.querySelectorAll('nav.links a[href^="#"]')];
  if (navLinks.length && "IntersectionObserver" in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      const a = byId.get(e.target.id);
      if (a && e.isIntersecting) { navLinks.forEach((l) => l.removeAttribute("aria-current")); a.setAttribute("aria-current", "true"); }
    }), { rootMargin: "-45% 0px -50% 0px" });
    byId.forEach((_, id) => { const s = document.getElementById(id); s && spy.observe(s); });
  }
})();
