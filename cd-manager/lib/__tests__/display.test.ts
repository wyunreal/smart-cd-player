import type { DisplayState, PlayerDefinition } from "@/api/types";
import {
  createDisplayDebounceState,
  debounceDisplayStreams,
  DISPLAY_ERROR_THRESHOLD,
  getMissingStreams,
  getPlayerDisplayState,
  getPlayerStreamId,
  normalizeDisplayResponse,
  selectDisplayError,
  selectNowPlaying,
} from "../display";

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
    const legacy: Omit<DisplayState, "status"> = {
      mode: "playing",
      disc: 1,
      track: 2,
      minutes: 3,
      seconds: 4,
      timestamp: 123,
    };

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
    expect(getPlayerStreamId(definition("salon"))).toBe("salon");
    expect(getPlayerStreamId(definition(" salon "))).toBe("salon");
  });

  it("does not fall back to the player position", () => {
    expect(getPlayerStreamId(definition())).toBeNull();
    expect(getPlayerStreamId(definition("   "))).toBeNull();
    expect(getPlayerStreamId(undefined)).toBeNull();
  });
});

describe("getPlayerDisplayState", () => {
  it("returns null when the player has no stream id", () => {
    expect(getPlayerDisplayState(null, { "player-1": reading })).toBeNull();
  });

  it("returns the reading published by the parser", () => {
    expect(getPlayerDisplayState("player-1", { "player-1": reading })).toEqual(
      reading,
    );
  });

  it("returns an error with the player and stream to verify", () => {
    const state = getPlayerDisplayState("salon", { "player-1": reading }, 2);

    expect(state?.status).toBe("error");
    expect(state?.error).toContain("Player 2");
    expect(state?.error).toContain('"salon"');
    expect(state?.error).toContain("Check");
  });
});

describe("selectNowPlaying", () => {
  const player = (
    remoteIndex: number,
    streamId?: string,
    active = true,
  ): PlayerDefinition => ({
    active,
    remoteIndex,
    capacity: 3,
    streamId: streamId ?? `stream-${remoteIndex}`,
  });

  const state = (mode: DisplayState["mode"]): DisplayState => ({
    ...reading,
    mode,
  });

  const definitions = [player(1), player(2), player(3)];

  it("shows the only playing player", () => {
    const streams = {
      "stream-1": state("stopped"),
      "stream-2": state("playing"),
    };

    expect(selectNowPlaying(definitions, streams)).toEqual({
      player: 2,
      streamId: "stream-2",
      displayState: streams["stream-2"],
    });
  });

  it("prefers playing over paused", () => {
    const streams = {
      "stream-1": state("paused"),
      "stream-2": state("playing"),
      "stream-3": state("paused"),
    };

    expect(selectNowPlaying(definitions, streams)?.player).toBe(2);
  });

  it("uses the lower player on a playing tie", () => {
    const streams = {
      "stream-1": state("playing"),
      "stream-3": state("playing"),
    };

    expect(selectNowPlaying(definitions, streams)?.player).toBe(1);
  });

  it("shows the only paused player when nothing is playing", () => {
    const streams = {
      "stream-1": state("stopped"),
      "stream-3": state("paused"),
    };

    expect(selectNowPlaying(definitions, streams)?.player).toBe(3);
  });

  it("uses the lower player on a paused tie", () => {
    const streams = {
      "stream-2": state("paused"),
      "stream-3": state("paused"),
    };

    expect(selectNowPlaying(definitions, streams)?.player).toBe(2);
  });

  it("returns null when every player is off or stopped", () => {
    const streams = {
      "stream-1": state("off"),
      "stream-2": state("stopped"),
    };

    expect(selectNowPlaying(definitions, streams)).toBeNull();
  });

  it("ignores inactive players and players without readings", () => {
    const streams = {
      "stream-1": state("stopped"),
      "stream-3": state("playing"),
    };

    expect(
      selectNowPlaying(
        [player(1), player(2, undefined, false), player(3)],
        streams,
      )?.player,
    ).toBe(3);

    expect(selectNowPlaying([player(1)], {})).toBeNull();
  });
});

describe("selectDisplayError", () => {
  const definitions: PlayerDefinition[] = [1, 2, 3].map((remoteIndex) => ({
    active: true,
    remoteIndex,
    capacity: 3,
    streamId: `stream-${remoteIndex}`,
  }));

  it("returns the first player reporting a parser error", () => {
    const streams = {
      "stream-1": reading,
      "stream-2": { ...reading, status: "error" as const, error: "no frame" },
      "stream-3": { ...reading, status: "error" as const, error: "no device" },
    };

    expect(selectDisplayError(definitions, streams)).toEqual({
      player: 2,
      streamId: "stream-2",
      displayState: streams["stream-2"],
    });
  });

  it("returns null when there are no parser errors", () => {
    expect(selectDisplayError(definitions, { "stream-1": reading })).toBeNull();
  });
});

describe("getMissingStreams", () => {
  const definition = (
    remoteIndex: number,
    streamId: string | undefined,
    active = true,
  ): PlayerDefinition => ({
    active,
    remoteIndex,
    capacity: 3,
    streamId,
  });

  it("lists player ids and streams absent from /display", () => {
    expect(
      getMissingStreams(
        [
          definition(1, "player-1"),
          definition(2, "salon"),
          definition(3, undefined),
          definition(4, "off-player", false),
        ],
        { "player-1": reading },
      ),
    ).toEqual([{ player: 2, streamId: "salon" }]);
  });
});

describe("debounceDisplayStreams", () => {
  const streamId = "player-1";
  const errorReading: DisplayState = {
    ...reading,
    status: "error",
    mode: "off",
    disc: null,
    track: null,
    minutes: null,
    seconds: null,
    error: "boom",
  };

  it("keeps the last successful reading while errors are transient", () => {
    let state = createDisplayDebounceState();
    let result = debounceDisplayStreams(
      { [streamId]: reading },
      [streamId],
      state,
      1000,
    );
    state = result.state;

    for (let i = 1; i < DISPLAY_ERROR_THRESHOLD; i += 1) {
      result = debounceDisplayStreams(
        { [streamId]: errorReading },
        [streamId],
        state,
        1000 + i,
      );
      state = result.state;
      expect(result.streams[streamId]).toEqual(reading);
    }

    result = debounceDisplayStreams(
      { [streamId]: errorReading },
      [streamId],
      state,
      2000,
    );
    expect(result.streams[streamId]).toEqual(errorReading);
  });

  it("resets the error streak on the next successful reading", () => {
    let state = createDisplayDebounceState();
    let result = debounceDisplayStreams(
      { [streamId]: reading },
      [streamId],
      state,
      1000,
    );
    state = result.state;

    for (let i = 1; i < DISPLAY_ERROR_THRESHOLD; i += 1) {
      result = debounceDisplayStreams(
        { [streamId]: errorReading },
        [streamId],
        state,
        1000 + i,
      );
      state = result.state;
    }

    const recovered = { ...reading, timestamp: 2000 };
    result = debounceDisplayStreams(
      { [streamId]: recovered },
      [streamId],
      state,
      2000,
    );
    expect(result.streams[streamId]).toEqual(recovered);
    expect(result.state.errorStreaks[streamId]).toBe(0);
  });

  it("reports an empty starting reading before the first success", () => {
    let state = createDisplayDebounceState();
    for (let i = 1; i < DISPLAY_ERROR_THRESHOLD; i += 1) {
      const result = debounceDisplayStreams(
        { [streamId]: errorReading },
        [streamId],
        state,
        3000 + i,
      );
      state = result.state;
      expect(result.streams[streamId]).toEqual({
        status: "starting",
        mode: "off",
        disc: null,
        track: null,
        minutes: null,
        seconds: null,
        timestamp: 3000 + i,
      });
    }

    const result = debounceDisplayStreams(
      { [streamId]: errorReading },
      [streamId],
      state,
      4000,
    );
    expect(result.streams[streamId]).toEqual(errorReading);
  });

  it("keeps the last success for a missing stream until the threshold", () => {
    let state = createDisplayDebounceState();
    let result = debounceDisplayStreams(
      { [streamId]: reading },
      [streamId],
      state,
      1000,
    );
    state = result.state;

    for (let i = 1; i < DISPLAY_ERROR_THRESHOLD; i += 1) {
      result = debounceDisplayStreams({}, [streamId], state, 1000 + i);
      state = result.state;
      expect(result.streams[streamId]).toEqual(reading);
    }

    result = debounceDisplayStreams({}, [streamId], state, 2000);
    expect(result.streams[streamId]).toBeUndefined();
  });
});
