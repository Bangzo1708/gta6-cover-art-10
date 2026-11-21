// Vice Diagonal — screenshot scenes.
// Runs in the browser: each scene is a named preset applied through the
// editor API (window.__vice.applyShot), then the page is captured by the
// headless browser. Scenes mirror shots.json in the repo root.

export const SCENES = [
  {
    name: "cover",
    file: "1-cover.jpg",
    width: 1280,
    height: 720,
    view: "cover",
    layout: "slash",
    grade: "vice-sunset",
    titleStyle: "sunset-gradient",
    title: "VICE DIAGONAL",
    subtitle: "LEONIDA NIGHTS",
    note: "Landscape cover, biggest in the set: multi-panel + title band + giant title at once.",
  },
  {
    name: "editor",
    file: "2-editor.jpg",
    width: 1280,
    height: 720,
    view: "editor",
    layout: "slash",
    grade: "vice-sunset",
    titleStyle: "sunset-gradient",
    title: "VICE DIAGONAL",
    subtitle: "LEONIDA NIGHTS",
    note: "Full editor with sample photos loaded: control cards on the left, live preview on the right.",
  },
  {
    name: "portrait",
    file: "3-cover-portrait.jpg",
    width: 1024,
    height: 1280,
    view: "cover",
    layout: "chevron",
    grade: "neon-night",
    titleStyle: "neon-outline",
    title: "NEON NIGHTS",
    subtitle: "OCEAN DRIVE",
    note: "Portrait cover: Chevron layout, Neon Night grade, neon-outline title.",
  },
  {
    name: "square",
    file: "4-cover-square.jpg",
    width: 1080,
    height: 1080,
    view: "cover",
    layout: "stack",
    grade: "palm-gold",
    titleStyle: "white-block",
    title: "PALM GOLD",
    subtitle: "VICE DIAGONAL",
    note: "Square cover: Stack layout, Palm Gold grade, white-block title.",
  },
];

// Apply a scene by name and wait until the cover has rendered.
export async function applyScene(name) {
  const scene = SCENES.find((s) => s.name === name);
  if (!scene) throw new Error("unknown scene: " + name);
  if (!window.__vice) throw new Error("editor not ready");
  window.__vice.applyShot(scene.name);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return scene;
}

if (typeof window !== "undefined") {
  window.__shots = { SCENES, applyScene };
}
