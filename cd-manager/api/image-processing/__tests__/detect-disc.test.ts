/**
 * @jest-environment node
 */

import { detectDisc } from "../detect-disc";

const clamp = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

/**
 * Draws a synthetic CD: a grooved dark disc over a light background.
 * The groove modulation simulates real disc texture without adding a second
 * strong circular edge.
 */
const makeDiscImage = ({
  width = 400,
  height = 400,
  cx = width / 2,
  cy = height / 2,
  radius = 160,
  background = 238,
  foreground = 52,
}: {
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  radius?: number;
  background?: number;
  foreground?: number;
}): Buffer => {
  const data = Buffer.alloc(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const distance = Math.hypot(x - cx, y - cy);
      let value = background;

      if (distance <= radius) {
        value = foreground + 18 * Math.sin(distance / 2.4);
        if (distance > radius - 1.5) value = foreground - 10;
      }

      data[y * width + x] = clamp(value);
    }
  }

  return data;
};

describe("detectDisc", () => {
  it("detects a centred disc", () => {
    const width = 400;
    const height = 400;

    const result = detectDisc({
      data: makeDiscImage({ width, height }),
      width,
      height,
    });

    expect(result.cx).toBeCloseTo(width / 2, 0);
    expect(result.cy).toBeCloseTo(height / 2, 0);
    expect(Math.abs(result.r - 160)).toBeLessThanOrEqual(2);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("detects an off-centre disc", () => {
    const width = 500;
    const height = 500;
    const cx = 280;
    const cy = 210;

    const result = detectDisc({
      data: makeDiscImage({ width, height, cx, cy, radius: 190 }),
      width,
      height,
    });

    expect(Math.abs(result.cx - cx)).toBeLessThanOrEqual(2);
    expect(Math.abs(result.cy - cy)).toBeLessThanOrEqual(2);
    expect(Math.abs(result.r - 190)).toBeLessThanOrEqual(2);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("detects a disc in a rectangular image", () => {
    const width = 600;
    const height = 400;
    const cx = 320;
    const cy = 190;

    const result = detectDisc({
      data: makeDiscImage({ width, height, cx, cy, radius: 150 }),
      width,
      height,
    });

    expect(Math.abs(result.cx - cx)).toBeLessThanOrEqual(2);
    expect(Math.abs(result.cy - cy)).toBeLessThanOrEqual(2);
    expect(Math.abs(result.r - 150)).toBeLessThanOrEqual(2);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("is not confident on a flat image", () => {
    const width = 320;
    const height = 320;
    const data = Buffer.alloc(width * height, 180);

    const result = detectDisc({ data, width, height });

    expect(result.confidence).toBeLessThan(0.2);
  });
});
