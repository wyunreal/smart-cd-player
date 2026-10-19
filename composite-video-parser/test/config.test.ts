import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  REQUIRED_RECT_NAMES,
  toRectConfigs,
  validateConfig,
  type Config,
} from "../src/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const CONFIG_PATH = path.resolve(projectRoot, "config.json");

describe("config", () => {
  let validConfig: Config;

  before(async () => {
    validConfig = JSON.parse(
      await readFile(CONFIG_PATH, "utf-8"),
    ) as Config;
  });

  const clone = (): Config => structuredClone(validConfig);

  it("accepts the project config", () => {
    assert.doesNotThrow(() => validateConfig(clone()));
  });

  it("converts the rect map to named rects", () => {
    const stream = validConfig.streams["player-1"];
    const rects = toRectConfigs(stream.geometry.rects);

    assert.equal(rects.length, REQUIRED_RECT_NAMES.length);
    assert.deepEqual(
      rects.map((rect) => rect.name),
      [...REQUIRED_RECT_NAMES],
    );
    assert.deepEqual(rects[0], {
      name: "disc_1",
      x: 160,
      y: 50,
      width: 26,
      height: 21,
    });
  });

  it("rejects duplicate capture ids", () => {
    const config = clone();
    config.streams["player-2"] = structuredClone(
      config.streams["player-1"],
    );

    assert.throws(() => validateConfig(config), /Duplicate capture\.id/);
  });

  it("rejects the same device on two streams", () => {
    const config = clone();
    const second = structuredClone(config.streams["player-1"]);
    second.capture.id = "capturadora-b";
    config.streams["player-2"] = second;

    assert.throws(() => validateConfig(config), /already used/);
  });

  it("rejects a capture with both device and url", () => {
    const config = clone();
    config.streams["player-1"].capture.url = "http://localhost/frame";

    assert.throws(
      () => validateConfig(config),
      /exactly one of "device" or "url"/,
    );
  });

  it("rejects a capture with neither device nor url", () => {
    const config = clone();
    delete config.streams["player-1"].capture.device;

    assert.throws(
      () => validateConfig(config),
      /exactly one of "device" or "url"/,
    );
  });

  it("rejects a missing required rect", () => {
    const config = clone();
    delete config.streams["player-1"].geometry.rects["time_4"];

    assert.throws(() => validateConfig(config), /missing "time_4"/);
  });

  it("rejects a rect outside the frame", () => {
    const config = clone();
    config.streams["player-1"].geometry.rects["disc_1"].x = 720;

    assert.throws(() => validateConfig(config), /outside the/);
  });

  it("rejects a pixel outside the frame", () => {
    const config = clone();
    config.streams["player-1"].geometry.powerPixel.x = 720;

    assert.throws(() => validateConfig(config), /outside the/);
  });

  it("rejects invalid stream ids", () => {
    const config = clone();
    const second = structuredClone(config.streams["player-1"]);
    second.capture.id = "capturadora-b";
    second.capture.device = "/dev/video2";
    config.streams["Player_1"] = second;

    assert.throws(() => validateConfig(config), /Invalid stream id/);
  });

  it("rejects invalid staleAfterMs", () => {
    const config = clone();
    config.server.staleAfterMs = 0;

    assert.throws(() => validateConfig(config), /staleAfterMs/);
  });
});
