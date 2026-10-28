import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isBootSplashFrame, isModePixelStopped } from "../src/digit-stream.js";

const WIDTH = 100;
const HEIGHT = 100;

type Pixel = [number, number, number];

const makeFrame = (paint: (x: number, y: number) => Pixel): Buffer => {
  const frame = Buffer.alloc(WIDTH * HEIGHT * 3);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const offset = (y * WIDTH + x) * 3;
      const [r, g, b] = paint(x, y);
      frame[offset] = r;
      frame[offset + 1] = g;
      frame[offset + 2] = b;
    }
  }
  return frame;
};

const GREEN: Pixel = [0, 128, 0];
const BLACK: Pixel = [0, 0, 0];
const GREY: Pixel = [20, 20, 20];

describe("isBootSplashFrame", () => {
  it("detects the green MegaStorage boot splash", () => {
    const frame = makeFrame((_x, y) =>
      y < 30 || y >= 75 ? GREEN : BLACK,
    );

    assert.equal(isBootSplashFrame(frame, WIDTH, HEIGHT), true);
  });

  it("does not treat a normal screen with a green header as a splash", () => {
    const frame = makeFrame((_x, y) => (y < 10 ? GREEN : GREY));

    assert.equal(isBootSplashFrame(frame, WIDTH, HEIGHT), false);
  });

  it("does not treat a black/off frame as a splash", () => {
    const frame = makeFrame(() => BLACK);

    assert.equal(isBootSplashFrame(frame, WIDTH, HEIGHT), false);
  });

  it("does not read past a short frame", () => {
    assert.equal(
      isBootSplashFrame(Buffer.alloc(3), WIDTH, HEIGHT),
      false,
    );
  });
});


describe("isModePixelStopped", () => {
  const pixel = (r: number, g: number, b: number) =>
    Buffer.from([r, g, b]);

  it("uses the per-stream threshold for the stopped grey bar", () => {
    const grey = pixel(170, 170, 170);

    assert.equal(isModePixelStopped(grey, 1, 0, 0, 150), true);
    assert.equal(isModePixelStopped(grey, 1, 0, 0, 175), false);
  });

  it("does not treat the green playing bar as stopped", () => {
    const green = pixel(0, 155, 57);

    assert.equal(isModePixelStopped(green, 1, 0, 0, 150), false);
  });

  it("does not read past a short frame", () => {
    assert.equal(isModePixelStopped(Buffer.alloc(1), 1, 0, 0, 150), false);
  });
});
