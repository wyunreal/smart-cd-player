import type {
  DisplayMode,
  DisplayState,
  PlayerDefinition,
} from "@/api/types";

const isDisplayState = (value: unknown): value is DisplayState => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.mode === "string";
};

/**
 * The parser returns a map keyed by stream id. This also accepts the old
 * single-reading shape during a rolling deployment.
 */
export const normalizeDisplayResponse = (
  data: unknown,
): Record<string, DisplayState> => {
  if (!data || typeof data !== "object") return {};

  if (isDisplayState(data)) {
    return { "player-1": { ...data, status: data.status ?? "ok" } };
  }

  const result: Record<string, DisplayState> = {};
  for (const [streamId, reading] of Object.entries(
    data as Record<string, unknown>,
  )) {
    if (isDisplayState(reading)) {
      result[streamId] = { ...reading, status: reading.status ?? "ok" };
    }
  }
  return result;
};

/**
 * Resolve the parser stream id for a player. The id comes only from the player
 * configuration: there is no positional fallback. A player without a stream id
 * does not support display readings.
 */
export const getPlayerStreamId = (
  definition: PlayerDefinition | null | undefined,
): string | null => {
  const configured = definition?.streamId?.trim();
  return configured || null;
};

const buildErrorState = (message: string): DisplayState => ({
  status: "error",
  mode: "off",
  disc: null,
  track: null,
  minutes: null,
  seconds: null,
  timestamp: 0,
  error: message,
});

export type MissingStream = {
  player: number | null;
  streamId: string;
};

const describeMissingStream = ({ player, streamId }: MissingStream): string =>
  player === null
    ? `the stream "${streamId}"`
    : `Player ${player} (stream "${streamId}")`;

const missingStreamsMessage = (missing: MissingStream[]): string => {
  const list = missing.map(describeMissingStream).join(", ");
  return `No display state received for ${list}. Check that the stream ID is assigned to the correct player and exists under "streams" in composite-video-parser/config.json, with its capture active (GET /streams).`;
};

/**
 * Stream ids configured for active players that the parser does not return.
 */
export const getMissingStreams = (
  definitions: PlayerDefinition[],
  streams: Record<string, DisplayState>,
): MissingStream[] =>
  definitions
    .filter((definition) => definition.active)
    .map((definition): MissingStream | null => {
      const streamId = getPlayerStreamId(definition);
      if (!streamId || streams[streamId]) return null;
      return { player: definition.remoteIndex, streamId };
    })
    .filter((missing): missing is MissingStream => missing !== null);

export const buildMissingStreamsError = (
  missing: MissingStream[],
): DisplayState => buildErrorState(missingStreamsMessage(missing));

/**
 * Pick the reading for a stream id from the /display map. When the stream id is
 * configured but the parser does not return it, surface an error instead of
 * silently showing nothing.
 */
export const getPlayerDisplayState = (
  streamId: string | null,
  streams: Record<string, DisplayState>,
  player: number | null = null,
): DisplayState | null => {
  if (!streamId) return null;

  const reading = streams[streamId];
  if (reading) return reading;

  return buildMissingStreamsError([{ player, streamId }]);
};

export type NowPlayingSelection = {
  player: number;
  streamId: string;
  displayState: DisplayState;
};

const liveModes: ReadonlySet<DisplayMode> = new Set(["playing", "paused"]);

/**
 * Pick the single player that the "currently playing" view should show:
 * playing beats paused, and ties are resolved by lower remoteIndex.
 * Returns null when every player is off/stopped.
 */
export const selectNowPlaying = (
  definitions: PlayerDefinition[],
  streams: Record<string, DisplayState>,
): NowPlayingSelection | null => {
  const candidates = definitions
    .filter((definition) => definition.active)
    .map((definition) => {
      const streamId = getPlayerStreamId(definition);
      if (!streamId) return null;
      const displayState = streams[streamId];
      if (!displayState || !liveModes.has(displayState.mode)) return null;
      return {
        player: definition.remoteIndex,
        streamId,
        displayState,
      };
    })
    .filter(
      (candidate): candidate is NowPlayingSelection => candidate !== null,
    )
    .sort((a, b) => a.player - b.player);

  return (
    candidates.find(({ displayState }) => displayState.mode === "playing") ??
    candidates[0] ??
    null
  );
};

/**
 * First player whose reading reports a parser error. Used only when nobody is
 * playing or paused, so the error is visible instead of silently hiding the
 * card.
 */
export const selectDisplayError = (
  definitions: PlayerDefinition[],
  streams: Record<string, DisplayState>,
): NowPlayingSelection | null => {
  const errored = definitions
    .filter((definition) => definition.active)
    .map((definition) => {
      const streamId = getPlayerStreamId(definition);
      if (!streamId) return null;
      const displayState = streams[streamId];
      if (!displayState || displayState.status !== "error") return null;
      return {
        player: definition.remoteIndex,
        streamId,
        displayState,
      };
    })
    .filter(
      (candidate): candidate is NowPlayingSelection => candidate !== null,
    )
    .sort((a, b) => a.player - b.player);

  return errored[0] ?? null;
};

/** Number of consecutive failing /display readings before an error surfaces. */
export const DISPLAY_ERROR_THRESHOLD = 10;

export type DisplayDebounceState = {
  /** Last successful reading per stream, used while errors are transient. */
  lastGood: Record<string, DisplayState>;
  /** Consecutive failed readings per stream. */
  errorStreaks: Record<string, number>;
};

export const createDisplayDebounceState = (): DisplayDebounceState => ({
  lastGood: {},
  errorStreaks: {},
});

/**
 * Keep the last successful reading while /display fails transiently. A real
 * error (or a stream that disappears) only surfaces after
 * DISPLAY_ERROR_THRESHOLD consecutive failures for that stream.
 */
export const debounceDisplayStreams = (
  next: Record<string, DisplayState>,
  streamIds: string[],
  previous: DisplayDebounceState,
  now: number = Date.now(),
): {
  streams: Record<string, DisplayState>;
  state: DisplayDebounceState;
} => {
  const lastGood = { ...previous.lastGood };
  const errorStreaks = { ...previous.errorStreaks };
  const streams: Record<string, DisplayState> = {};

  const ids = new Set([
    ...streamIds,
    ...Object.keys(next),
    ...Object.keys(lastGood),
  ]);

  for (const id of ids) {
    const reading = next[id];

    if (reading && reading.status !== "error") {
      errorStreaks[id] = 0;
      lastGood[id] = reading;
      streams[id] = reading;
      continue;
    }

    const streak = (errorStreaks[id] ?? 0) + 1;
    errorStreaks[id] = streak;

    if (streak < DISPLAY_ERROR_THRESHOLD) {
      // Report the data from the last successful call. Only when there has
      // never been a successful reading fall back to an empty starting state.
      streams[id] = lastGood[id] ?? {
        status: "starting",
        mode: "off",
        disc: null,
        track: null,
        minutes: null,
        seconds: null,
        timestamp: now,
      };
      continue;
    }

    if (reading) {
      streams[id] = reading;
    }
    // A stream missing from the response stays omitted after the threshold,
    // so getMissingStreams can report it.
  }

  return { streams, state: { lastGood, errorStreaks } };
};
