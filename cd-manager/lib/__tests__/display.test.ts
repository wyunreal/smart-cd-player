import type { DisplayState, PlayerDefinition } from "@/api/types";
import { getPlayerStreamId, normalizeDisplayResponse } from "../display";

const reading: DisplayState = {
  status: "ok",
  mode: "playing",
  disc: 1,
  track: 2,
  minutes: 3,
  seconds: 4,
  timestamp: 123,
};

describe("normalizeDisplayResponse", () => {
  it("returns an empty map for invalid data", () => {
    expect(normalizeDisplayResponse(null)).toEqual({});
    expect(normalizeDisplayResponse("nope")).toEqual({});
    expect(normalizeDisplayResponse([])).toEqual({});
  });

  it("keeps the new map keyed by stream id", () => {
    const data = {
      "player-1": reading,
      "player-2": { ...reading, status: "error" as const, error: "boom" },
    };

    expect(normalizeDisplayResponse(data)).toEqual(data);
  });

  it("accepts the old flat single-reading shape", () => {
    const { status, ...legacy } = reading;

    expect(normalizeDisplayResponse(legacy)).toEqual({
      "player-1": { ...legacy, status: "ok" },
    });
  });

  it("drops entries that are not readings", () => {
    const data = {
      "player-1": reading,
      "player-2": { nope: true },
    };

    expect(normalizeDisplayResponse(data)).toEqual({
      "player-1": reading,
    });
  });
});

describe("getPlayerStreamId", () => {
  const definition = (streamId?: string): PlayerDefinition => ({
    active: true,
    remoteIndex: 2,
    capacity: 3,
    streamId,
  });

  it("uses the configured stream id", () => {
    expect(getPlayerStreamId(definition("salon"), 2)).toBe("salon");
  });

  it("falls back to player-<remoteIndex>", () => {
    expect(getPlayerStreamId(definition(), 2)).toBe("player-2");
  });

  it("returns null without a definition or index", () => {
    expect(getPlayerStreamId(undefined, null)).toBeNull();
  });
});
