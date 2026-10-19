#!/usr/bin/env node
/**
 * Regenerate test/fixtures/frame-all-digits.png for the selected stream.
 *
 * Composites real glyph samples from source-digits/ onto the rect positions of
 * the stream's geometry in config.json, so the parser's end-to-end test keeps
 * matching the configured geometry after a capture/player change.
 *
 * The digits below must match EXPECTED_DIGITS in test/digit-detector.test.ts
 * (DISC 129, TRACK 12, _1.05) and the rect order in the stream's
 * geometry.rects map.
 *
 * Usage:
 *   node digit-classifier/train/make_fixture.mjs --stream player-1
 *   node digit-classifier/train/make_fixture.mjs --stream player-2 --base f.png
 *   FRAME_STREAM=player-1 FRAME_URL=http://<host>:30002/frame \
 *     node digit-classifier/train/make_fixture.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

const PLAN = [
  ["disc_1", 1], ["disc_2", 2], ["disc_3", 9],
  ["track_1", 1], ["track_2", 2],
  ["time_1", null], ["time_2", 1], ["time_3", 0], ["time_4", 5],
];

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function loadBase() {
  const file = arg("base", null);
  if (file) return readFile(file);

  const url = arg("url", process.env.FRAME_URL ?? "http://localhost:3100/frame");
  console.log(`fetching base frame from ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`frame request failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const config = JSON.parse(
  await readFile(path.join(projectRoot, "config.json"), "utf8"),
);
const streamId = arg(
  "stream",
  process.env.FRAME_STREAM ?? Object.keys(config.streams)[0],
);
const stream = config.streams?.[streamId];
if (!stream) {
  throw new Error(
    `unknown stream "${streamId}"; available: ${Object.keys(config.streams ?? {})}`,
  );
}
const rects = stream.geometry.rects;

const composites = [];
for (const [name, digit] of PLAN) {
  const label = digit === null ? "blank" : String(digit);
  const rect = rects[name];
  if (!rect) throw new Error(`stream "${streamId}" has no rect "${name}"`);
  const sample = path.join(
    projectRoot, "digit-classifier", "source-digits", label, `${label}_0000.png`,
  );
  composites.push({ input: sample, left: rect.x, top: rect.y });
}

const out = path.resolve(
  arg("out", path.join(projectRoot, "test", "fixtures", "frame-all-digits.png")),
);
await sharp(await loadBase())
  .composite(composites)
  .removeAlpha()
  .png()
  .toFile(out);
console.log(
  `stream ${streamId}: wrote ${out} (${PLAN.map(([n, d]) => `${n}=${d ?? "blank"}`).join(" ")})`,
);
