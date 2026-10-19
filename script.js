// The Ascent: scrolling down the page climbs a pixel-art mountain.

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SUMMIT_M = 8000;

// A new mountain range on every load. ?seed=123 picks a specific one.
const SEED = Number(new URLSearchParams(location.search).get("seed")) || Math.floor(Math.random() * 1e9);

// Sky colours along the climb: day -> sunset -> dusk -> night.
const SKY = [
  { at: 0, top: [56, 132, 255], bottom: [173, 226, 255] },
  { at: 0.45, top: [99, 102, 241], bottom: [253, 186, 116] },
  { at: 0.7, top: [49, 46, 129], bottom: [219, 39, 119] },
  { at: 0.9, top: [5, 8, 22], bottom: [30, 27, 75] },
  { at: 1, top: [5, 8, 22], bottom: [30, 27, 75] },
];

// Mountain ranges, back to front. `speed` is how far each sinks as you climb.
// `features` is roughly how many big bumps span the screen; ridged noise gives sharp peaks.
// `haze` fades distant ranges toward the sky colour, like real atmosphere.
const LAYERS = [
  { base: 0.55, amp: 0.3, features: 3, octaves: 5, ridged: true, haze: 0.45, color: [148, 163, 184], snow: 0.62, speed: 0.12 },
  { base: 0.66, amp: 0.2, features: 4, octaves: 5, ridged: true, haze: 0.25, color: [86, 104, 130], speed: 0.25 },
  { base: 0.78, amp: 0.14, features: 5, octaves: 4, haze: 0.08, color: [47, 93, 80], trees: true, speed: 0.45 },
  { base: 0.9, amp: 0.1, features: 7, octaves: 4, haze: 0, color: [22, 58, 48], trees: true, speed: 0.7 },
];

// 4x4 Bayer matrix for ordered dithering, as thresholds in 0..1.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));
const SKY_LEVELS = 7;

const canvas = $("#sky");
const ctx = canvas.getContext("2d");
let W = 0;
let H = 0;
let ridges = [];
let trees = [];
let stars = [];
let flock = [];
let flakes = [];
let meteors = [];
let pointer = null;
let progress = 0;
let night = 0;
let dirty = true;
let skyImage = null;
let skyFor = -1;
let sky = SKY[0];

// Small seeded PRNG so a given seed always draws the same mountains.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 1D value noise: random heights at whole numbers, smoothly blended in between.
function valueNoise(rnd, length) {
  const pts = Array.from({ length: length + 2 }, rnd);
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    return pts[i] + (pts[i + 1] - pts[i]) * s;
  };
}

// Fractal noise (fBm): stack octaves of noise, each twice as detailed and half as strong.
// Ridged noise folds each octave (1 - |2n - 1|) so the tops come to sharp peaks.
function ridge(n, rnd, { features, octaves, ridged }) {
  const noises = Array.from({ length: octaves }, (_, o) => valueNoise(rnd, features * 2 ** o + 1));
  const out = [];
  for (let x = 0; x < n; x++) {
    const u = (x / n) * features;
    let v = 0;
    let amp = 1;
    let total = 0;
    for (let o = 0; o < octaves; o++) {
      let s = noises[o](u * 2 ** o);
      if (ridged) s = (1 - Math.abs(s * 2 - 1)) ** 2;
      v += s * amp;
      total += amp;
      amp *= 0.5;
    }
    out.push(v / total);
  }
  const min = Math.min(...out);
  const max = Math.max(...out);
  return out.map((v) => (v - min) / (max - min || 1));
}

function disc(cx, cy, r) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

function skyAt(p) {
  let i = 0;
  while (i < SKY.length - 2 && p > SKY[i + 1].at) i++;
  const a = SKY[i];
  const b = SKY[i + 1];
  const t = clamp((p - a.at) / (b.at - a.at));
  return { top: mix(a.top, b.top, t), bottom: mix(a.bottom, b.bottom, t) };
}

// Sky gradient snapped to a few colour levels, with ordered dithering between them.
function buildSky(p) {
  sky = skyAt(p);
  const levels = Array.from({ length: SKY_LEVELS }, (_, k) => mix(sky.top, sky.bottom, k / (SKY_LEVELS - 1)));
  const data = skyImage.data;
  for (let y = 0; y < H; y++) {
    const v = (y / (H - 1)) * (SKY_LEVELS - 1);
    const k = Math.floor(v);
    const frac = v - k;
    for (let x = 0; x < W; x++) {
      const c = levels[Math.min(SKY_LEVELS - 1, frac > BAYER[y & 3][x & 3] ? k + 1 : k)];
      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
  skyFor = p;
}

// ---------- Boids ----------

function makeFlock(rnd) {
  return Array.from({ length: 14 }, () => ({
    x: rnd() * W,
    y: H * (0.1 + rnd() * 0.25),
    vx: 0.5 + rnd() * 0.4,
    vy: (rnd() - 0.5) * 0.3,
    flap: Math.floor(rnd() * 6),
  }));
}

// Classic boids: steer apart when crowded, match neighbours' heading, drift toward the group.
function stepFlock() {
  const top = H * 0.08;
  const bottom = H * 0.42;
  for (const b of flock) {
    let n = 0;
    let ax = 0;
    let ay = 0;
    let cx = 0;
    let cy = 0;
    let sx = 0;
    let sy = 0;
    for (const o of flock) {
      if (o === b) continue;
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > 400) continue;
      n++;
      ax += o.vx;
      ay += o.vy;
      cx += dx;
      cy += dy;
      if (d2 < 16) {
        sx -= dx;
        sy -= dy;
      }
    }
    if (n) {
      b.vx += (ax / n - b.vx) * 0.05 + (cx / n) * 0.003;
      b.vy += (ay / n - b.vy) * 0.05 + (cy / n) * 0.003;
    }
    b.vx += sx * 0.03 + 0.01; // plus a light tailwind
    b.vy += sy * 0.03;
    if (b.y < top) b.vy += 0.03;
    if (b.y > bottom) b.vy -= 0.03;

    // Scatter away from the cursor.
    if (pointer) {
      const dx = b.x - pointer.x;
      const dy = b.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 30 && d > 0) {
        b.vx += (dx / d) * 0.25;
        b.vy += (dy / d) * 0.25;
      }
    }

    const speed = Math.hypot(b.vx, b.vy);
    const target = clamp(speed, 0.4, 1.6);
    b.vx *= target / (speed || 1);
    b.vy *= target / (speed || 1);
    b.x += b.vx;
    b.y += b.vy;
    if (b.x > W + 4) b.x = -4;
    if (b.x < -4) b.x = W + 4;
    b.flap = (b.flap + 1) % 6;
  }
}

function drawFlock(alpha) {
  ctx.fillStyle = `rgba(30,41,59,${alpha})`;
  for (const b of flock) {
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    const wing = b.flap < 3 ? y - 1 : y;
    ctx.fillRect(x, y, 1, 1);
    ctx.fillRect(x - 1, wing, 1, 1);
    ctx.fillRect(x + 1, wing, 1, 1);
  }
}

// ---------- Shooting stars ----------

function stepMeteors() {
  if (night > 0.5 && Math.random() < 0.015) {
    meteors.push({
      x: W * (0.3 + Math.random() * 0.7),
      y: Math.random() * H * 0.3,
      vx: -(2 + Math.random() * 1.5),
      vy: 1 + Math.random(),
      life: 14,
    });
  }
  for (const m of meteors) {
    m.x += m.vx;
    m.y += m.vy;
    m.life--;
  }
  meteors = meteors.filter((m) => m.life > 0);
}

function drawMeteors() {
  for (const m of meteors) {
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = `rgba(248,250,252,${(1 - k / 6) * (m.life / 14) * night})`;
      ctx.fillRect(Math.round(m.x - m.vx * k * 0.5), Math.round(m.y - m.vy * k * 0.5), 1, 1);
    }
  }
}

// ---------- Summit snowfall ----------

function stepSnow(time) {
  const target = Math.round(120 * clamp((progress - 0.72) / 0.25) * (W / 240));
  while (flakes.length < target) {
    flakes.push({ x: Math.random() * W, y: Math.random() * H, vy: 0.3 + Math.random() * 0.5, phase: Math.random() * 6 });
  }
  for (const f of flakes) {
    f.y += f.vy;
    f.x += Math.sin(time / 600 + f.phase) * 0.3;
    if (f.y > H) {
      f.y = -1;
      f.x = Math.random() * W;
    }
  }
  if (flakes.length > target) flakes.length = target;
}

function drawSnow() {
  ctx.fillStyle = "rgba(248,250,252,0.9)";
  for (const f of flakes) ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
}

// ---------- Scene ----------

function draw(time) {
  const p = progress;
  const t = reduced ? 0 : time;
  if (skyFor !== p) buildSky(p);
  ctx.putImageData(skyImage, 0, 0);

  night = clamp((p - 0.6) / 0.25);
  if (night > 0) {
    ctx.fillStyle = `rgba(248,250,252,${night})`;
    for (const s of stars) {
      if (!reduced && Math.floor(t / 450 + s.tw * 20) % 9 === 0) continue;
      ctx.fillRect(s.x, s.y, 1, 1);
      if (s.big) {
        ctx.fillRect(s.x - 1, s.y, 3, 1);
        ctx.fillRect(s.x, s.y - 1, 1, 3);
      }
    }
    drawMeteors();
    ctx.globalAlpha = night;
    ctx.fillStyle = "#f1f5f9";
    disc(W * 0.2, H * 0.14, Math.round(W / 40));
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(Math.round(W * 0.2) - 2, Math.round(H * 0.14), 2, 2);
    ctx.globalAlpha = 1;
  }

  // The sun sets behind the mountains as you climb.
  const sun = 1 - clamp((p - 0.4) / 0.25);
  if (sun > 0) {
    ctx.globalAlpha = sun;
    ctx.fillStyle = rgb(mix([255, 236, 153], [251, 113, 33], clamp(p / 0.5)));
    disc(W * 0.74, H * (0.16 + p * 0.8), Math.round(W / 30));
    ctx.globalAlpha = 1;
  }

  // Birds head home as night falls.
  const birds = 1 - clamp(night / 0.6);
  if (birds > 0 && !reduced) drawFlock(birds);

  LAYERS.forEach((layer, li) => {
    const sink = reduced ? 0 : p * H * layer.speed;
    const hazed = mix(layer.color, mix(sky.top, sky.bottom, layer.base), layer.haze);
    const col = mix(hazed, [12, 18, 40], night * 0.55);
    const yAt = (x) => Math.round(H * layer.base - ridges[li][x] * H * layer.amp + sink);

    ctx.fillStyle = rgb(col);
    for (let x = 0; x < W; x++) {
      const y = yAt(x);
      ctx.fillRect(x, y, 1, H - y);
    }

    if (layer.snow) {
      // A cool blue-white that stays distinct from the rock as the sky changes.
      ctx.fillStyle = rgb(mix(mix([214, 226, 240], sky.top, layer.haze * 0.4), [120, 135, 160], night * 0.5));
      for (let x = 0; x < W; x++) {
        const v = ridges[li][x];
        if (v > layer.snow) ctx.fillRect(x, yAt(x), 1, Math.round((v - layer.snow) * 24) + 1);
      }
    }

    if (layer.trees) {
      ctx.fillStyle = rgb(mix(col, [0, 0, 0], 0.35));
      for (const x of trees[li]) {
        const y = yAt(x);
        ctx.fillRect(x, y - 3, 1, 3);
        ctx.fillRect(x - 1, y - 1, 3, 1);
      }
    }
  });

  if (flakes.length) drawSnow();
}

// Everything that moves on its own steps at 20fps, for a choppy retro feel.
function step(time) {
  if (night < 0.6) stepFlock();
  stepMeteors();
  stepSnow(time);
}

function frame(time) {
  if (!reduced && time - (frame.lastStep || 0) > 50) {
    step(time);
    frame.lastStep = time;
    dirty = true;
  }
  if (dirty) {
    draw(time);
    dirty = false;
  }
  requestAnimationFrame(frame);
}

// ---------- Page layout ----------

const hero = $(".hero");
const heroTitle = $(".hero-title");
const heroRest = $(".hero-rest");
const meter = $(".meter");
const altEls = $$("[data-alt]");

const pageTop = (el) => el.getBoundingClientRect().top + scrollY;

function layout() {
  W = innerWidth < 760 ? 120 : 240;
  H = Math.max(1, Math.round((W * innerHeight) / innerWidth));
  canvas.width = W;
  canvas.height = H;
  skyImage = ctx.createImageData(W, H);
  skyFor = -1;

  const rnd = seeded(SEED);
  ridges = LAYERS.map((layer) => ridge(W, rnd, layer));
  trees = LAYERS.map((layer) => (layer.trees ? [...Array(W).keys()].filter(() => rnd() < 0.15) : []));
  stars = Array.from({ length: 70 }, () => ({
    x: Math.floor(rnd() * W),
    y: Math.floor(rnd() * H * 0.6),
    tw: rnd(),
    big: rnd() < 0.15,
  }));
  flock = makeFlock(rnd);
  flakes = [];
  meteors = [];

  // Label each camp with the altitude the meter shows when you reach it.
  const max = document.documentElement.scrollHeight - innerHeight;
  $$("[data-camp]").forEach((sec) => {
    const at = clamp((pageTop(sec) - innerHeight * 0.4) / max);
    sec.querySelector(".camp-alt").textContent = (Math.round((at * SUMMIT_M) / 100) * 100).toLocaleString();
  });

  update();
  // Resizing the canvas clears it, so paint straight away rather than waiting for the next frame.
  draw(performance.now());
}

function update() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress = max > 0 ? clamp(scrollY / max) : 0;
  dirty = true;

  const alt = String(Math.round(progress * SUMMIT_M)).padStart(4, "0");
  altEls.forEach((el) => (el.textContent = alt));
  meter.style.setProperty("--p", progress);

  if (!reduced) {
    // Stepped (not smooth) so it moves like an old console.
    const hp = Math.round(clamp(scrollY / (hero.offsetHeight - innerHeight)) * 16) / 16;
    heroTitle.style.transform = `translateY(${-hp * 80}px) scale(${1 - hp * 0.45})`;
    heroRest.style.opacity = clamp(1 - hp * 1.8);
  }
}

let ticking = false;
addEventListener(
  "scroll",
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  },
  { passive: true }
);
addEventListener("resize", layout);
addEventListener("pointermove", (e) => {
  pointer = { x: (e.clientX / innerWidth) * W, y: (e.clientY / innerHeight) * H };
});
document.documentElement.addEventListener("mouseleave", () => (pointer = null));

// ---------- Hero dialog ----------

function typeDialog() {
  const el = $("#dialog-text");
  const full = el.textContent.trim().replace(/\s+/g, " ");
  const next = $(".dialog-next");
  el.parentElement.setAttribute("aria-label", full);
  if (reduced) {
    el.textContent = full;
    next.hidden = false;
    return;
  }
  el.textContent = "";
  let i = 0;
  const type = () => {
    el.textContent = full.slice(0, ++i);
    if (i < full.length) setTimeout(type, 28);
    else next.hidden = false;
  };
  setTimeout(type, 400);
}

// ---------- Stepped reveal ----------

const revealer = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        revealer.unobserve(e.target);
      }
    }),
  { threshold: 0.15 }
);
$$(".reveal").forEach((el) => revealer.observe(el));

layout();
requestAnimationFrame(frame);
// Pixel fonts change text widths once loaded, so re-measure, then lift the loading screen.
document.fonts.ready.then(() => {
  layout();
  document.documentElement.classList.remove("loading");
  typeDialog();
});
