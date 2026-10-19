import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import { DigitClassifier } from "digit-classifier";

import {
  createDigitDetector,
  detectWithRetry,
  type DetectionResult,
  type DigitDetector,
} from "../src/digit-detector.js";
import { toRectConfigs, type Config } from "../src/config.js";
import type { DigitStream } from "../src/digit-stream.js";
import {
  createHttpServer,
  toDisplayState,
  type DigitState,
} from "../src/server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// From dist/test/ go up two levels to reach the project root
const projectRoot = path.resolve(__dirname, "../..");

const FRAME_PATH = path.resolve(
  projectRoot,
  "test/fixtures/frame-all-digits.png",
);
const CONFIG_PATH = path.resolve(projectRoot, "config.json");

// Frame shows: DISC 129  TRACK 12  _1.05  (_ = blank tens of minutes)
const EXPECTED_DIGITS: (number | null)[] = [1, 2, 9, 1, 2, null, 1, 0, 5];

const makeResult = (confidence: number): DetectionResult[] => [
  { name: "digit_1", digit: 1, confidence },
];

const noopDelay = async (): Promise<void> => {};

describe("detectWithRetry", () => {
  it("returns first detection when all digits are confident", async () => {
    const firstResult = makeResult(0.95);
    let detectCalls = 0;
    let captureFrameCalls = 0;

    const mockDetector: DigitDetector = {
      detect: async () => {
        detectCalls++;
        return firstResult;
      },
    };
    const captureFrame = async (): Promise<Buffer> => {
      captureFrameCalls++;
      return Buffer.alloc(0);
    };

    const result = await detectWithRetry(
      Buffer.alloc(0),
      mockDetector,
      captureFrame,
      1,
      1,
      0.85,
      noopDelay,
    );

    assert.equal(detectCalls, 1, "should detect only once");
    assert.equal(captureFrameCalls, 0, "should not capture a new frame");
    assert.deepEqual(result, firstResult);
  });

  it("retries when any digit has low confidence", async () => {
    const lowResult = makeResult(0.5);
    const highResult = makeResult(0.95);
    let detectCalls = 0;

    const mockDetector: DigitDetector = {
      detect: async () => {
        detectCalls++;
        return detectCalls === 1 ? lowResult : highResult;
      },
    };
    let captureFrameCalled = false;
    const captureFrame = async (): Promise<Buffer> => {
      captureFrameCalled = true;
      return Buffer.alloc(0);
    };

    const result = await detectWithRetry(
      Buffer.alloc(0),
      mockDetector,
      captureFrame,
      1,
      1,
      0.85,
      noopDelay,
    );

    assert.equal(detectCalls, 2, "should detect twice");
    assert.ok(captureFrameCalled, "should capture a new frame");
    assert.deepEqual(result, highResult);
  });

  it("returns retry result even if still low confidence (no loop)", async () => {
    const lowResult = makeResult(0.3);
    let detectCalls = 0;

    const mockDetector: DigitDetector = {
      detect: async () => {
        detectCalls++;
        return lowResult;
      },
    };
    let captureFrameCalls = 0;
    const captureFrame = async (): Promise<Buffer> => {
      captureFrameCalls++;
      return Buffer.alloc(0);
    };

    const result = await detectWithRetry(
      Buffer.alloc(0),
      mockDetector,
      captureFrame,
      1,
      1,
      0.85,
      noopDelay,
    );

    assert.equal(
      detectCalls,
      2,
      "should detect exactly twice (no further retries)",
    );
    assert.equal(captureFrameCalls, 1, "should capture exactly once");
    assert.deepEqual(result, lowResult);
  });

  it("invokes retryDelay before capturing the new frame", async () => {
    const events: string[] = [];

    const mockDetector: DigitDetector = {
      detect: async () => {
        events.push("detect");
        return makeResult(0.3);
      },
    };
    const captureFrame = async (): Promise<Buffer> => {
      events.push("capture");
      return Buffer.alloc(0);
    };
    const retryDelay = async (): Promise<void> => {
      events.push("delay");
    };

    await detectWithRetry(
      Buffer.alloc(0),
      mockDetector,
      captureFrame,
      1,
      1,
      0.85,
      retryDelay,
    );

    assert.deepEqual(events, ["detect", "delay", "capture", "detect"]);
  });
});

describe("DigitDetector (end-to-end)", () => {
  let config: Config;
  let classifier: DigitClassifier;
  let detector: DigitDetector;
  let rawFrame: Buffer;
  let frameWidth: number;
  let frameHeight: number;
  let rects: ReturnType<typeof toRectConfigs>;

  before(async () => {
    // Load config
    config = JSON.parse(await readFile(CONFIG_PATH, "utf-8")) as Config;
    const streamConfig = config.streams["player-1"];

    // Load classifier
    classifier = new DigitClassifier({
      modelPath: path.resolve(
        projectRoot,
        "digit-classifier/model/digit_classifier.onnx",
      ),
      metadataPath: path.resolve(
        projectRoot,
        "digit-classifier/model/metadata.json",
      ),
    });
    await classifier.initialize();

    // Load test frame and convert to raw RGB
    const image = sharp(FRAME_PATH);
    const metadata = await image.metadata();
    frameWidth = metadata.width!;
    frameHeight = metadata.height!;

    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    rawFrame = data;

    rects = toRectConfigs(streamConfig.geometry.rects);
    detector = createDigitDetector(classifier, rects);
  });

  after(async () => {
    await classifier.dispose();
  });

  it("should detect the expected digits from the frame", async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);

    assert.equal(results.length, rects.length);

    for (let i = 0; i < results.length; i++) {
      assert.equal(
        results[i].digit,
        EXPECTED_DIGITS[i],
        `Rect "${rects[i].name}": expected digit ${EXPECTED_DIGITS[i]}, got ${results[i].digit}`,
      );
      assert.ok(
        results[i].confidence > 0.5,
        `Rect "${rects[i].name}": confidence ${results[i].confidence} too low`,
      );
    }
  });

  it("should return a result for each configured rect", async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);

    const names = results.map((r) => r.name);
    for (const rect of rects) {
      assert.ok(
        names.includes(rect.name),
        `Missing result for rect "${rect.name}"`,
      );
    }
  });

  const makeStream = (
    id: string,
    state: DigitState,
    frame: Buffer | null,
  ): DigitStream => ({
    id,
    capture: {
      id: `capture-${id}`,
      device: `/dev/${id}`,
      width: frameWidth,
      height: frameHeight,
      fps: 2,
    },
    width: frameWidth,
    height: frameHeight,
    start: async () => {},
    stop: async () => {},
    getState: () => state,
    waitForFreshState: async () => state,
    waitForFrame: async () => frame,
    getLastFrame: () => frame,
    getLastFrameAt: () => state.timestamp,
    getLastError: () => null,
  });

  const startServer = async (streams: DigitStream[]) => {
    const server = createHttpServer({
      port: 0,
      streams,
      binarizationThreshold: classifier.binarizationThreshold,
      captureIdleTimeoutMs: 60000,
      staleAfterMs: 60000,
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const addr = server.address() as { port: number };
    return {
      server,
      baseUrl: `http://localhost:${addr.port}`,
    };
  };

  it("GET /display should return readings keyed by stream id", async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);
    const playing: DigitState = {
      digits: results,
      mode: "playing",
      timestamp: Date.now(),
    };
    const off: DigitState = {
      digits: [],
      mode: "off",
      timestamp: Date.now(),
    };

    const { server, baseUrl } = await startServer([
      makeStream("player-1", playing, rawFrame),
      makeStream("player-2", off, rawFrame),
    ]);

    try {
      const res = await fetch(`${baseUrl}/display`);
      assert.equal(res.status, 200);

      const body = (await res.json()) as Record<string, Record<string, unknown>>;
      assert.deepEqual(Object.keys(body), ["player-1", "player-2"]);

      assert.equal(body["player-1"].status, "ok");
      assert.equal(body["player-1"].mode, "playing");
      assert.equal(body["player-1"].disc, 129);
      assert.equal(body["player-1"].track, 12);
      assert.equal(body["player-1"].minutes, 1);
      assert.equal(body["player-1"].seconds, 5);
      assert.equal(typeof body["player-1"].timestamp, "number");

      assert.equal(body["player-2"].status, "ok");
      assert.equal(body["player-2"].mode, "off");
      assert.equal(body["player-2"].disc, null);
    } finally {
      server.close();
    }
  });

  it("GET /display should report both players off while the streams are healthy", async () => {
    const off: DigitState = {
      digits: [],
      mode: "off",
      timestamp: Date.now(),
    };

    const { server, baseUrl } = await startServer([
      makeStream("player-1", off, rawFrame),
      makeStream("player-2", off, rawFrame),
    ]);

    try {
      const res = await fetch(`${baseUrl}/display`);
      assert.equal(res.status, 200);

      const body = (await res.json()) as Record<string, Record<string, unknown>>;
      for (const streamId of ["player-1", "player-2"]) {
        assert.equal(body[streamId].status, "ok");
        assert.equal(body[streamId].mode, "off");
        assert.equal(body[streamId].disc, null);
        assert.equal(body[streamId].track, null);
        assert.equal(body[streamId].minutes, null);
        assert.equal(body[streamId].seconds, null);
      }
    } finally {
      server.close();
    }
  });

  it("GET /frame?id=<id> should return a PNG for the selected stream", async () => {
    const state: DigitState = {
      digits: [],
      mode: "off",
      timestamp: Date.now(),
    };
    const { server, baseUrl } = await startServer([
      makeStream("player-1", state, rawFrame),
      makeStream("player-2", state, rawFrame),
    ]);

    try {
      const res = await fetch(`${baseUrl}/frame?id=player-2`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("content-type"), "image/png");
      const body = Buffer.from(await res.arrayBuffer());
      assert.ok(body.length > 0);
    } finally {
      server.close();
    }
  });

  it("GET /frame without id should require an id when there are many streams", async () => {
    const state: DigitState = {
      digits: [],
      mode: "off",
      timestamp: Date.now(),
    };
    const { server, baseUrl } = await startServer([
      makeStream("player-1", state, rawFrame),
      makeStream("player-2", state, rawFrame),
    ]);

    try {
      const res = await fetch(`${baseUrl}/frame`);
      assert.equal(res.status, 400);
      const body = (await res.json()) as Record<string, unknown>;
      assert.deepEqual(body.availableStreams, ["player-1", "player-2"]);
    } finally {
      server.close();
    }
  });

  it("GET /health should report per-stream health", async () => {
    const state: DigitState = {
      digits: [],
      mode: "off",
      timestamp: Date.now(),
    };
    const { server, baseUrl } = await startServer([
      makeStream("player-1", state, rawFrame),
    ]);

    try {
      await fetch(`${baseUrl}/display`);
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const body = (await res.json()) as Record<string, unknown>;
      assert.equal(body.status, "ok");
      assert.deepEqual(body.streams, { "player-1": "ok" });
    } finally {
      server.close();
    }
  });

  it("GET /display should mark an errored stream and keep reading the other", async () => {
    const results = await detector.detect(rawFrame, frameWidth, frameHeight);
    const okState: DigitState = {
      digits: results,
      mode: "playing",
      timestamp: Date.now(),
    };

    const okStream = makeStream("player-1", okState, rawFrame);
    const errorStream: DigitStream = {
      ...makeStream("player-2", { digits: [], mode: "off", timestamp: 0 }, null),
      getLastError: () => "device not available: /dev/video2",
    };

    const { server, baseUrl } = await startServer([okStream, errorStream]);

    try {
      const res = await fetch(`${baseUrl}/display`);
      assert.equal(res.status, 200);
      const body = (await res.json()) as Record<string, Record<string, unknown>>;
      assert.equal(body["player-1"].status, "ok");
      assert.equal(body["player-2"].status, "error");
      assert.equal(body["player-2"].error, "device not available: /dev/video2");
      assert.equal(body["player-2"].mode, "off");
    } finally {
      server.close();
    }
  });

  it("GET /display should expose a map identical to today's flat reading", () => {
    const state: DigitState = {
      digits: [
        { name: "disc_1", digit: 2, confidence: 1 },
        { name: "track_1", digit: 7, confidence: 1 },
        { name: "time_1", digit: 3, confidence: 1 },
        { name: "time_2", digit: 4, confidence: 1 },
        { name: "time_3", digit: 4, confidence: 1 },
        { name: "time_4", digit: 1, confidence: 1 },
      ],
      mode: "playing",
      timestamp: 123,
    };

    assert.deepEqual(toDisplayState(state), {
      mode: "playing",
      disc: 2,
      track: 7,
      minutes: 34,
      seconds: 41,
      timestamp: 123,
    });
  });
});
