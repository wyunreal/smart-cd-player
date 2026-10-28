/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import type { Art } from "@/api/types";
import { resolveProcessedArt } from "../resolve";
import { processedFileName, processedThumbFileName } from "../naming";

const makeArt = (uri: string): Art => ({
  uri,
  uri150: uri,
  width: 600,
  height: 600,
  type: "primary",
});

let imagesDir: string;

beforeAll(() => {
  imagesDir = fs.mkdtempSync(path.join(os.tmpdir(), "resolve-test-"));
});

afterAll(() => {
  fs.rmSync(imagesDir, { recursive: true, force: true });
});

beforeEach(() => {
  delete process.env.USE_PROCESSED_IMAGES;
});

describe("resolveProcessedArt", () => {
  it("falls back to the raw artwork when no processed file exists", () => {
    const art = makeArt("/api/images/1-cd.jpg");

    expect(resolveProcessedArt(art, { imagesDir })).toEqual(art);
  });

  it("returns the processed variants when they exist", () => {
    const art = makeArt("/api/images/2-cd.jpg");
    const large = processedFileName("2-cd.jpg");
    const thumb = processedThumbFileName("2-cd.jpg");

    fs.writeFileSync(path.join(imagesDir, large), "large");
    fs.writeFileSync(path.join(imagesDir, thumb), "thumb");

    const resolved = resolveProcessedArt(art, { imagesDir });

    expect(resolved.uri).toBe(`/api/images/${large}`);
    expect(resolved.uri150).toBe(`/api/images/${thumb}`);
    expect(resolved.width).toBe(600);
  });

  it("keeps the raw thumbnail if only the large variant exists", () => {
    const art = makeArt("/api/images/3-cd.jpg");
    const large = processedFileName("3-cd.jpg");

    fs.writeFileSync(path.join(imagesDir, large), "large");

    const resolved = resolveProcessedArt(art, { imagesDir });

    expect(resolved.uri).toBe(`/api/images/${large}`);
    expect(resolved.uri150).toBe(art.uri150);
  });

  it("can be disabled through the environment kill switch", () => {
    const art = makeArt("/api/images/4-cd.jpg");
    const large = processedFileName("4-cd.jpg");
    fs.writeFileSync(path.join(imagesDir, large), "large");

    process.env.USE_PROCESSED_IMAGES = "false";

    expect(resolveProcessedArt(art, { imagesDir })).toEqual(art);
  });

  it("ignores processed files from a different pipeline version", () => {
    const art = makeArt("/api/images/5-cd.jpg");
    const largeV2 = processedFileName("5-cd.jpg", 2);
    fs.writeFileSync(path.join(imagesDir, largeV2), "large");

    expect(resolveProcessedArt(art, { imagesDir, version: 1 })).toEqual(art);

    const resolvedV2 = resolveProcessedArt(art, { imagesDir, version: 2 });
    expect(resolvedV2.uri).toBe(`/api/images/${largeV2}`);
  });

  it("ignores art that is not served by the local image route", () => {
    const art = makeArt("https://i.discogs.com/cover.jpg");

    expect(resolveProcessedArt(art, { imagesDir })).toEqual(art);
  });
});

describe("sharp sanity check", () => {
  it("can decode a simple SVG", async () => {
    const svg = Buffer.from(
      '<svg width="10" height="10"><rect width="10" height="10" fill="#fff"/></svg>',
    );

    const metadata = await sharp(svg).metadata();
    expect(metadata.width).toBe(10);
  });
});
