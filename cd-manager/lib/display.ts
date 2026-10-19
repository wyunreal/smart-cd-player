import type { DisplayState, PlayerDefinition } from "@/api/types";

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
 * Resolve the parser stream id for a player. Defaults to player-<remoteIndex>
 * when the definition does not override it.
 */
export const getPlayerStreamId = (
  definition: PlayerDefinition | null | undefined,
  remoteIndex: number | null,
): string | null => {
  if (definition?.streamId) return definition.streamId;
  if (remoteIndex !== null) return `player-${remoteIndex}`;
  return null;
};
