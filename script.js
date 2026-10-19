// Renders the page from CONTENT (content.js) and wires up the interactive bits.

const $ = (sel) => document.querySelector(sel);

const ICONS = {
  github:
    '<svg viewBox="0 0 24 24"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.1 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24"><path d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5ZM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0Z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24"><path d="M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm10 7.2L2.8 6h18.4L12 11.2Zm0 2.3L2 7.8V18h20V7.8l-10 5.7Z"/></svg>',
  external:
    '<svg viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H5v12h12v-6h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
  resume:
    '<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12v2h8v-2H8Zm0 4v2h8v-2H8Z"/></svg>',
};

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function socialLinks() {
  const { github, linkedin, email } = CONTENT.links;
  return [
    github && { href: github, label: "GitHub", icon: ICONS.github },
    linkedin && { href: linkedin, label: "LinkedIn", icon: ICONS.linkedin },
    email && { href: `mailto:${email}`, label: "Email", icon: ICONS.email },
  ].filter(Boolean);
}

function render() {
  document.title = CONTENT.name;
  $("#hero-name").textContent = CONTENT.name;
  $("#hero-tagline").textContent = CONTENT.tagline;
  $("#footer-name").textContent = CONTENT.name;
  $("#year").textContent = new Date().getFullYear();

  const links = socialLinks();
  const actions = links.map(
    (l, i) =>
      `<a class="btn${i === 0 ? " btn-primary" : ""}" href="${esc(l.href)}" target="_blank" rel="noopener">${l.icon}${l.label}</a>`
  );
  if (CONTENT.resumeUrl) {
    actions.push(
      `<a class="btn" href="${esc(CONTENT.resumeUrl)}" target="_blank" rel="noopener">${ICONS.resume}Resume</a>`
    );
  }
  $("#hero-actions").innerHTML = actions.join("");
  $("#footer-links").innerHTML = links
    .map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener" aria-label="${l.label}">${l.icon}</a>`)
    .join("");

  $("#about-text").innerHTML = CONTENT.about.map((p) => `<p>${esc(p)}</p>`).join("");
  $("#skills").innerHTML = CONTENT.skills.map((s) => `<li>${esc(s)}</li>`).join("");

  const timelineItem = (item) => `
    <li class="timeline-item reveal">
      <div class="card">
        <div class="card-head">
          <h3>${esc(item.title)}</h3>
          <span class="card-date">${esc(item.date)}</span>
        </div>
        <p class="card-org">${esc(item.org)}</p>
        <ul>${item.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      </div>
    </li>`;
  $("#education-list").innerHTML = CONTENT.education.map(timelineItem).join("");
  $("#experience-list").innerHTML = CONTENT.experience.map(timelineItem).join("");

  $("#project-grid").innerHTML = CONTENT.projects
    .map(
      (p) => `
    <article class="card project-card reveal" data-tags="${esc(p.tags.join("|"))}">
      <div class="project-top">
        <span class="folder" aria-hidden="true">📁</span>
        <div class="project-links">
          ${p.repo ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener" aria-label="Source code">${ICONS.github}</a>` : ""}
          ${p.demo ? `<a href="${esc(p.demo)}" target="_blank" rel="noopener" aria-label="Live demo">${ICONS.external}</a>` : ""}
        </div>
      </div>
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>
      <ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    </article>`
    )
    .join("");

  const allTags = ["All", ...new Set(CONTENT.projects.flatMap((p) => p.tags))];
  $("#project-filters").innerHTML = allTags
    .map((t, i) => `<button type="button" class="filter-btn${i === 0 ? " active" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`)
    .join("");

  // Hobbies with a link render as a clickable card.
  $("#hobby-grid").innerHTML = CONTENT.hobbies
    .map((h) => {
      const body = `
      <span class="hobby-icon" aria-hidden="true">${h.icon}</span>
      <h3>${esc(h.name)}</h3>
      <p>${esc(h.description)}</p>`;
      return h.link
        ? `<a class="card hobby-card reveal" href="${esc(h.link)}" target="_blank" rel="noopener">${body}
      <span class="hobby-link">${esc(h.linkLabel || "Visit")} ↗</span></a>`
        : `<div class="card hobby-card reveal">${body}</div>`;
    })
    .join("");
}

function setupTypewriter() {
  const el = $("#typewriter");
  const roles = CONTENT.roles;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = roles[0];
    return;
  }
  let role = 0;
  let chars = 0;
  let deleting = false;
  const tick = () => {
    const word = roles[role];
    chars += deleting ? -1 : 1;
    el.textContent = word.slice(0, chars);
    let delay = deleting ? 40 : 90;
    if (!deleting && chars === word.length) {
      deleting = true;
      delay = 1800;
    } else if (deleting && chars === 0) {
      deleting = false;
      role = (role + 1) % roles.length;
      delay = 400;
    }
    setTimeout(tick, delay);
  };
  tick();
}

function setupTheme() {
  $(".theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
  });
}

function setupScrollEffects() {
  const nav = $(".nav");
  const progress = $(".scroll-progress");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--progress", max > 0 ? scrollY / max : 0);
    nav.classList.toggle("scrolled", scrollY > 20);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Fade sections in as they enter the viewport.
  const revealer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          revealer.unobserve(e.target);
        }
      }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    revealer.observe(el);
  });

  // Highlight the nav link for the section currently on screen.
  const links = document.querySelectorAll(".nav-links a");
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
        }
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("section[id]").forEach((s) => spy.observe(s));
}

function setupPointerEffects() {
  if (!matchMedia("(hover: hover)").matches) return;
  const glow = $(".cursor-glow");
  addEventListener("pointermove", (e) => {
    glow.style.setProperty("--x", `${e.clientX}px`);
    glow.style.setProperty("--y", `${e.clientY}px`);
  });

  // 3D tilt + spotlight on project cards.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      if (!reduced) {
        card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
      }
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function setupProjectFilters() {
  $("#project-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.toggle("active", b === btn));
    const tag = btn.dataset.tag;
    document.querySelectorAll(".project-card").forEach((card) => {
      const show = tag === "All" || card.dataset.tags.split("|").includes(tag);
      card.classList.toggle("hidden", !show);
    });
  });
}

render();
setupTypewriter();
setupTheme();
setupScrollEffects();
setupPointerEffects();
setupProjectFilters();
