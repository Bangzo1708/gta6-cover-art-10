// Vice Diagonal — GTA 6 Cover Art Studio (make.fun entrypoint).
// Validates the app and screenshots, copies them into the output directory
// (never deleting the output directory itself — it may be a mount point),
// and writes dossier.json via the kit's buildDossier helper.
import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDossier } from "./vendor/makefun-app.ts";

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const repoDir = new URL(".", import.meta.url).pathname;

const indexPath = join(repoDir, "app", "index.html");
if (!existsSync(indexPath)) {
  throw new Error("missing app/index.html");
}

const shotDir = join(repoDir, "screenshots");
const shots = existsSync(shotDir) ? readdirSync(shotDir).filter((f) => /\.jpe?g$/i.test(f)) : [];
if (shots.length < 3) {
  throw new Error("need at least 3 screenshots, found " + shots.length);
}

// Create the output directory if needed, then clear only its CONTENTS,
// one child at a time. The directory itself is never removed: on the
// grader it is a mount point and removing it fails with EBUSY.
mkdirSync(outputDir, { recursive: true });
for (const child of readdirSync(outputDir)) {
  rmSync(join(outputDir, child), { recursive: true, force: true });
}

cpSync(join(repoDir, "app"), join(outputDir, "app"), { recursive: true });
cpSync(shotDir, join(outputDir, "screenshots"), { recursive: true });

const dossierPath = join(outputDir, "dossier.json");
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log("Wrote " + dossierPath);
