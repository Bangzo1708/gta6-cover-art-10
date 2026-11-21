// Vice Diagonal — editor.
// Owns the app state, the preview canvas, photo loading, drag-to-pan,
// scroll-to-zoom, undo/redo, controls and PNG export. Imports the
// renderer from cover.js. Exposes window.__vice for screenshots.

import { renderCover, exportCover, LAYOUTS, GRADES, TITLE_STYLES } from "./cover.js";

const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");
const label = document.getElementById("panelLabel");

const SAMPLES = ["samples/boulevard.jpg", "samples/pier.jpg", "samples/boulevard.jpg"];

const state = {
  photos: [null, null, null],
  layout: "slash",
  grade: "vice-sunset",
  titleStyle: "sunset-gradient",
  title: "VICE DIAGONAL",
  subtitle: "LEONIDA NIGHTS",
  panels: [
    { panX: 0, panY: 0, zoom: 1 },
    { panX: 0, panY: 0, zoom: 1 },
    { panX: 0, panY: 0, zoom: 1 },
  ],
  selectedPanel: 0,
};

const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    titleStyle: state.titleStyle,
    title: state.title,
    subtitle: state.subtitle,
    panels: state.panels,
  });
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  state.layout = s.layout;
  state.grade = s.grade;
  state.titleStyle = s.titleStyle;
  state.title = s.title;
  state.subtitle = s.subtitle;
  state.panels = s.panels;
  syncControls();
  render();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
}

function render() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  renderCover(ctx, state, w, h);
  if (document.body.classList.contains("cover-only")) return;
  // Highlight the selected panel with a thin accent frame.
  const third = w / 3;
  const x = state.selectedPanel * third;
  ctx.save();
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 3, h * 0.34 + 3, third - 6, h * 0.66 - 6);
  ctx.restore();
  label.textContent =
    "Panel " + (state.selectedPanel + 1) + " selected — drag to move, scroll to zoom";
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (let i = 0; i < 3; i++) {
    try {
      state.photos[i] = await loadImage(SAMPLES[i]);
    } catch (e) {
      state.photos[i] = null;
    }
  }
  render();
}

function loadFile(file, index) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  loadImage(url).then((img) => {
    pushUndo();
    state.photos[index] = img;
    state.selectedPanel = index;
    render();
  });
}

function onePhotoForAll() {
  const src = state.photos[state.selectedPanel] || state.photos[0];
  if (!src) return;
  pushUndo();
  state.photos = [src, src, src];
  render();
}

function surprise() {
  pushUndo();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layout = pick(LAYOUTS);
  state.grade = pick(Object.keys(GRADES));
  state.titleStyle = pick(TITLE_STYLES);
  syncControls();
  render();
}

function syncControls() {
  document.getElementById("layout").value = state.layout;
  document.getElementById("grade").value = state.grade;
  document.getElementById("titleStyle").value = state.titleStyle;
  document.getElementById("title").value = state.title;
  document.getElementById("subtitle").value = state.subtitle;
}

function bindControls() {
  document.getElementById("file0").addEventListener("change", (e) => loadFile(e.target.files[0], 0));
  document.getElementById("file1").addEventListener("change", (e) => loadFile(e.target.files[0], 1));
  document.getElementById("file2").addEventListener("change", (e) => loadFile(e.target.files[0], 2));
  document.getElementById("onePhoto").addEventListener("click", onePhotoForAll);
  document.getElementById("layout").addEventListener("change", (e) => {
    pushUndo();
    state.layout = e.target.value;
    render();
  });
  document.getElementById("grade").addEventListener("change", (e) => {
    pushUndo();
    state.grade = e.target.value;
    render();
  });
  document.getElementById("titleStyle").addEventListener("change", (e) => {
    pushUndo();
    state.titleStyle = e.target.value;
    render();
  });
  document.getElementById("title").addEventListener("input", (e) => {
    state.title = e.target.value;
    render();
  });
  document.getElementById("subtitle").addEventListener("input", (e) => {
    state.subtitle = e.target.value;
    render();
  });
  document.getElementById("undo").addEventListener("click", undo);
  document.getElementById("redo").addEventListener("click", redo);
  document.getElementById("surprise").addEventListener("click", surprise);
  document.querySelectorAll("[data-export]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [w, h] = btn.dataset.export.split("x").map(Number);
      exportCover(state, w, h);
    });
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
  });
}

function panelAt(clientX) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(2, Math.floor(x * 3)));
}

function bindCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let moved = false;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - lastX) / rect.width;
    const dy = (e.clientY - lastY) / rect.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.002) moved = true;
    const p = state.panels[state.selectedPanel];
    p.panX += dx * 1.6;
    p.panY += dy * 1.6;
    p.panX = Math.max(-1, Math.min(1, p.panX));
    p.panY = Math.max(-1, Math.min(1, p.panY));
    lastX = e.clientX;
    lastY = e.clientY;
    render();
  });
  canvas.addEventListener("pointerup", (e) => {
    if (dragging && !moved) {
      state.selectedPanel = panelAt(e.clientX);
      render();
    } else if (moved) {
      pushUndo();
    }
    dragging = false;
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = state.panels[state.selectedPanel];
    p.zoom *= e.deltaY < 0 ? 1.1 : 0.9;
    p.zoom = Math.max(0.6, Math.min(3, p.zoom));
    render();
  }, { passive: false });
}

// Cover-only view for screenshots: hide the editor, render the cover
// full-viewport at the current window size.
function maybeCoverView() {
  const q = new URLSearchParams(location.search);
  if (q.get("view") !== "cover") return false;
  document.body.classList.add("cover-only");
  const fit = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  };
  window.addEventListener("resize", fit);
  fit();
  return true;
}

window.__vice = {
  state,
  render,
  applyShot(name) {
    const shots = {
      cover: { layout: "slash", grade: "vice-sunset", titleStyle: "sunset-gradient", title: "VICE DIAGONAL", subtitle: "LEONIDA NIGHTS" },
      editor: { layout: "slash", grade: "vice-sunset", titleStyle: "sunset-gradient", title: "VICE DIAGONAL", subtitle: "LEONIDA NIGHTS" },
      portrait: { layout: "chevron", grade: "neon-night", titleStyle: "neon-outline", title: "NEON NIGHTS", subtitle: "OCEAN DRIVE" },
      square: { layout: "stack", grade: "palm-gold", titleStyle: "white-block", title: "PALM GOLD", subtitle: "VICE DIAGONAL" },
    };
    const s = shots[name];
    if (!s) return false;
    Object.assign(state, s);
    syncControls();
    render();
    return true;
  },
};

bindControls();
bindCanvas();
const coverView = maybeCoverView();
loadSamples().then(() => {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot");
  if (shot) window.__vice.applyShot(shot);
  if (coverView) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  render();
  window.__viceReady = true;
});
