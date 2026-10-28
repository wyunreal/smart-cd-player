/**
 * @jest-environment node
 */

import sharp from "sharp";
import { normalizeArt } from "../normalize";

jest.setTimeout(30_000);

const discSvg = (
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
): Buffer =>
  Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f0f0f0"/>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="#333333"/>
      <circle cx="${cx}" cy="${cy}" r="${Math.round(radius * 0.12)}" fill="#dddddd"/>
    </svg>
  `);

const darkBoundingBox = async (buffer: Buffer) => {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] < 128) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  return { minX, minY, maxX, maxY, width: info.width, height: info.height };
};

describe("normalizeArt", () => {
  it("centres the CD outer circle in a square crop", async () => {
    // The disc is deliberately off-centre in the source.
    const source = discSvg(600, 600, 330, 280, 190);
    const result = await normalizeArt(source, "cd");

    expect(result.disc?.detected).toBe(true);
    expect(result.disc?.confidence).toBeGreaterThan(0.8);

    expect(result.large.width).toBe(result.large.height);
    expect(result.large.width).toBeGreaterThanOrEqual(380);
    expect(result.large.width).toBeLessThanOrEqual(390);

    expect(result.thumb.width).toBe(150);
    expect(result.thumb.height).toBe(150);

    const box = await darkBoundingBox(result.large.buffer);
    const centreX = (box.minX + box.maxX) / 2;
    const centreY = (box.minY + box.maxY) / 2;

    expect(Math.abs(centreX - box.width / 2)).toBeLessThanOrEqual(3);
    expect(Math.abs(centreY - box.height / 2)).toBeLessThanOrEqual(3);

    // The disc should reach close to all four edges (only the 1% margin).
    expect(box.minX).toBeLessThanOrEqual(4);
    expect(box.minY).toBeLessThanOrEqual(4);
    expect(box.maxX).toBeGreaterThanOrEqual(box.width - 5);
    expect(box.maxY).toBeGreaterThanOrEqual(box.height - 5);

    const metadata = await sharp(result.large.buffer).metadata();
    expect(metadata.format).toBe("webp");
  });

  it("falls back to a centred square crop when no disc is found", async () => {
    const source = Buffer.from(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#ccc"/></svg>',
    );

    const result = await normalizeArt(source, "cd");

    expect(result.disc?.detected).toBe(false);
    expect(result.large.width).toBe(result.large.height);
    expect(result.large.width).toBe(294);
  });

  it("pads a disc that is cut by the source frame", async () => {
    const source = discSvg(500, 500, 300, 250, 230);
    const result = await normalizeArt(source, "cd");

    expect(result.disc?.detected).toBe(true);
    expect(result.large.width).toBe(result.large.height);
    expect(result.large.width).toBeGreaterThan(460);

    const metadata = await sharp(result.large.buffer).metadata();
    expect(metadata.hasAlpha).toBe(true);
  });

  it("detects the disc on a transparent PNG", async () => {
    const source = Buffer.from(`
      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
        <circle cx="250" cy="250" r="190" fill="#222222"/>
      </svg>
    `);
    const png = await sharp(source).png().toBuffer();
    const result = await normalizeArt(png, "cd");

    expect(result.disc?.detected).toBe(true);
    expect(result.large.width).toBe(result.large.height);
  });

  it("square-crops album art and does not upscale it", async () => {
    const source = Buffer.from(
      '<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="400" fill="#123456"/></svg>',
    );

    const result = await normalizeArt(source, "album");

    expect(result.large.width).toBe(400);
    expect(result.large.height).toBe(400);
    expect(result.thumb.width).toBe(150);

    const smallSource = Buffer.from(
      '<svg width="200" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="180" fill="#123456"/></svg>',
    );
    const small = await normalizeArt(smallSource, "album");
    expect(small.large.width).toBe(180);
  });

  it("keeps the artist aspect ratio and caps the long edge", async () => {
    const source = Buffer.from(
      '<svg width="2000" height="1000" xmlns="http://www.w3.org/2000/svg"><rect width="2000" height="1000" fill="#654321"/></svg>',
    );

    const result = await normalizeArt(source, "artist");

    expect(result.large.width).toBe(1200);
    expect(result.large.height).toBe(600);
    expect(result.thumb.width).toBe(150);
    expect(result.thumb.height).toBe(150);
  });

  it("applies the EXIF orientation before computing dimensions", async () => {
    const source = await sharp({
      create: {
        width: 400,
        height: 200,
        channels: 3,
        background: "#445566",
      },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const result = await normalizeArt(source, "artist");

    expect(result.large.width).toBe(200);
    expect(result.large.height).toBe(400);

    const metadata = await sharp(result.large.buffer).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.orientation).toBeUndefined();
  });
});
