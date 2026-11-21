// Vice Diagonal — cover renderer.
// Draws the whole poster on a 2D canvas: a sunset title band on top
// (sun disc, code-drawn palms, halftone sky) and three diagonal photo
// panels below it, separated by white gutters, with giant tilted lettering.

export const LAYOUTS = ["slash", "chevron", "stack"];

export const GRADES = {
  "vice-sunset": {
    sky: ["#ff9a3d", "#ff5e62", "#c13b8a", "#5b2a86"],
    sun: "#ffd166",
    overlay: "rgba(255, 94, 98, 0.16)",
    tint: null,
  },
  "neon-night": {
    sky: ["#2b1055", "#7597de", "#ff2e88", "#1b1035"],
    sun: "#22d3ee",
    overlay: "rgba(123, 47, 247, 0.22)",
    tint: null,
  },
  "palm-gold": {
    sky: ["#ffe259", "#ffa751", "#e2703a", "#7a3b12"],
    sun: "#fff3b0",
    overlay: "rgba(255, 183, 77, 0.18)",
    tint: null,
  },
  "ocean-drive": {
    sky: ["#7ef0d4", "#22d3ee", "#ff8fb3", "#7b2ff7"],
    sun: "#fff7ae",
    overlay: "rgba(34, 211, 238, 0.14)",
    tint: null,
  },
  noir: {
    sky: ["#e8e8e8", "#9a9a9a", "#4a4a4a", "#111111"],
    sun: "#ffffff",
    overlay: "rgba(0, 0, 0, 0.10)",
    tint: "grayscale(1) contrast(1.25)",
  },
};

export const TITLE_STYLES = ["white-block", "sunset-gradient", "neon-outline"];

// Deterministic pseudo-random numbers so every render looks identical.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function drawSun(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Retro slats cut across the lower half of the disc.
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.globalCompositeOperation = "destination-out";
  let y = cy + r * 0.05;
  let gap = r * 0.10;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, gap * 0.45);
    y += gap;
    gap *= 1.35;
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, h, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.strokeStyle = "#1a0b2e";
  ctx.fillStyle = "#1a0b2e";
  ctx.lineWidth = Math.max(3, h * 0.035);
  ctx.lineCap = "round";
  // Curved trunk.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(h * 0.06, -h * 0.55, h * 0.16, -h * 0.92);
  ctx.stroke();
  const topX = h * 0.16;
  const topY = -h * 0.92;
  // Five to seven drooping fronds.
  const fronds = 6;
  for (let i = 0; i < fronds; i++) {
    const a = -Math.PI * (0.08 + (0.84 * i) / (fronds - 1));
    const len = h * (0.42 + 0.10 * Math.sin(i * 2.3));
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + h * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.55,
      topY + Math.sin(a) * len * 0.55 - h * 0.10,
      ex,
      ey,
    );
    ctx.lineWidth = Math.max(2, h * 0.018);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHalftone(ctx, w, h, color) {
  const rand = rng(20261121);
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(14, w / 64);
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const fade = 1 - y / h;
      if (rand() < 0.28 * fade + 0.05) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, step * 0.07 * fade + 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawTitleBand(ctx, state, w, bandH, grade) {
  const g = ctx.createLinearGradient(0, 0, 0, bandH);
  grade.sky.forEach((c, i) => g.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, bandH);

  drawHalftone(ctx, w, bandH, "rgba(255,255,255,0.35)");

  // Sun disc, right of centre, sinking toward the band's bottom edge.
  drawSun(ctx, w * 0.68, bandH * 0.62, bandH * 0.34, grade.sun);

  // Palm silhouettes framing the band, clear of the title zone.
  drawPalm(ctx, w * 0.06, bandH * 0.98, bandH * 0.85, -0.10);
  drawPalm(ctx, w * 0.94, bandH * 0.98, bandH * 0.70, 0.14);
  drawPalm(ctx, w * 0.16, bandH * 1.0, bandH * 0.45, 0.08);

  // Giant tilted title + subtitle, sitting on the band's lower third.
  const title = (state.title || "VICE DIAGONAL").toUpperCase();
  const sub = (state.subtitle || "").toUpperCase();
  const size = Math.min(w * 0.115, bandH * 0.52);
  ctx.save();
  ctx.translate(w * 0.04, bandH * 0.88);
  ctx.transform(1, 0, -0.105, 1, 0, 0); // skew -6deg
  ctx.font = "italic 700 " + size + "px 'Liberation Sans', Arial, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = size * 0.06;
  ctx.shadowOffsetY = size * 0.04;

  if (state.titleStyle === "sunset-gradient") {
    const tg = ctx.createLinearGradient(0, -size, 0, size * 0.1);
    tg.addColorStop(0, "#ffd166");
    tg.addColorStop(0.5, "#ff6b4a");
    tg.addColorStop(1, "#ff2e88");
    ctx.fillStyle = tg;
    ctx.strokeStyle = "rgba(20,5,30,0.85)";
    ctx.lineWidth = size * 0.045;
    ctx.strokeText(title, 0, 0);
    ctx.fillText(title, 0, 0);
  } else if (state.titleStyle === "neon-outline") {
    ctx.fillStyle = "rgba(10,5,25,0.25)";
    ctx.fillText(title, 0, 0);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = size * 0.035;
    ctx.strokeText(title, 0, 0);
    ctx.strokeStyle = "#ff2e88";
    ctx.lineWidth = size * 0.012;
    ctx.strokeText(title, 0, 0);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(20,5,30,0.9)";
    ctx.lineWidth = size * 0.05;
    ctx.strokeText(title, 0, 0);
    ctx.fillText(title, 0, 0);
  }
  ctx.restore();

  if (sub) {
    ctx.save();
    ctx.font = "700 " + Math.max(12, size * 0.24) + "px 'Liberation Sans', Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    const tw = ctx.measureText(sub).width;
    ctx.fillText(sub, w - tw - w * 0.04, bandH * 0.16);
    ctx.restore();
  }
}

// Clip polygons for the three panels. Each entry is [x, y, w, h, slant]
// where slant shifts the top edge sideways relative to the bottom edge.
export function layoutPanels(layout, w, h, gutter) {
  const third = w / 3;
  if (layout === "chevron") {
    const s = third * 0.22;
    return [
      { x: 0, y: 0, w: third, h, slant: s },
      { x: third, y: 0, w: third, h, slant: 0 },
      { x: third * 2, y: 0, w: third, h, slant: -s },
    ];
  }
  if (layout === "stack") {
    const s = third * 0.16;
    const step = h * 0.10;
    return [
      { x: 0, y: 0, w: third, h: h - step * 2, slant: s },
      { x: third, y: step, w: third, h: h - step * 2, slant: s },
      { x: third * 2, y: step * 2, w: third, h: h - step * 2, slant: s },
    ];
  }
  // slash: every panel leans the same way.
  const s = third * 0.24;
  return [
    { x: 0, y: 0, w: third, h, slant: s },
    { x: third, y: 0, w: third, h, slant: s },
    { x: third * 2, y: 0, w: third, h, slant: s },
  ];
}

function coverDrawImage(ctx, img, panel, pan, clip) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = Math.max(0.5, pan.zoom || 1);
  const scale = Math.max(clip.w / iw, clip.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = clip.x + (clip.w - dw) / 2 + (pan.panX || 0) * clip.w * 0.4;
  const dy = clip.y + (clip.h - dh) / 2 + (pan.panY || 0) * clip.h * 0.4;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function applyGrade(ctx, grade, clip) {
  if (!grade.overlay) return;
  ctx.save();
  ctx.fillStyle = grade.overlay;
  ctx.fillRect(clip.x, clip.y, clip.w, clip.h);
  ctx.restore();
}

function addGrain(ctx, w, h) {
  const rand = rng(777);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000000";
  for (let i = 0; i < w * h / 900; i++) {
    ctx.fillRect(rand() * w, rand() * h, 1.4, 1.4);
  }
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < w * h / 1400; i++) {
    ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2);
  }
  ctx.restore();
}

function addVignette(ctx, w, h) {
  const g = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function renderCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES["vice-sunset"];
  const bandH = Math.round(h * 0.34);
  const gutter = Math.max(6, Math.round(w * 0.008));

  // White gutters show through between the panels.
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(0, bandH, w, h - bandH);

  drawTitleBand(ctx, state, w, bandH, grade);

  const panels = layoutPanels(state.layout || "slash", w, h - bandH, gutter);
  const photos = state.photos || [];
  const pans = state.panels || [{}, {}, {}];

  panels.forEach((p, i) => {
    const clip = {
      x: p.x + (i === 0 ? 0 : gutter / 2),
      y: bandH + p.y,
      w: i === 0 ? p.w - gutter / 2 : p.w - gutter,
      h: p.h,
    };
    // Diagonal cut: top edge shifted by the panel slant.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(clip.x + p.slant, clip.y);
    ctx.lineTo(clip.x + clip.w + p.slant, clip.y);
    ctx.lineTo(clip.x + clip.w, clip.y + clip.h);
    ctx.lineTo(clip.x, clip.y + clip.h);
    ctx.closePath();
    ctx.clip();
    const img = photos[i];
    if (img && img.complete && (img.naturalWidth || img.width)) {
      if (grade.tint) ctx.filter = grade.tint;
      coverDrawImage(ctx, img, p, pans[i] || {}, clip);
      ctx.filter = "none";
      applyGrade(ctx, grade, clip);
    } else {
      const pg = ctx.createLinearGradient(clip.x, clip.y, clip.x + clip.w, clip.y + clip.h);
      pg.addColorStop(0, "#3a2a6e");
      pg.addColorStop(1, "#ff2e88");
      ctx.fillStyle = pg;
      ctx.fillRect(clip.x, clip.y, clip.w, clip.h);
    }
    ctx.restore();
  });

  addGrain(ctx, w, h);
  addVignette(ctx, w, h);
}

// Render to an offscreen canvas and download it as a PNG.
export function exportCover(state, w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  renderCover(ctx, state, w, h);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vice-diagonal-" + w + "x" + h + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, "image/png");
}
