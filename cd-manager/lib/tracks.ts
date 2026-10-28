import type { Cd, Track } from "@/api/types";

/**
 * Tracks that belong to the disc currently loaded in the player.
 *
 * Multi-disc releases are stored with a continuous track numbering (Discogs
 * positions like "2-03" end up as number 21 on a disc whose first track is 1),
 * while the player displays the track number within the disc. Fall back to all
 * tracks when the metadata does not carry a disc number.
 */
export const getTracksForDisc = (cd: Cd | null | undefined): Track[] => {
  if (!cd) return [];

  const allTracks = cd.tracks ?? [];
  if (allTracks.length === 0) return [];

  const discNumber = cd.diskNumber ?? 1;
  const discTracks = allTracks.filter(
    (track) => (track.cd ?? 1) === discNumber,
  );

  return discTracks.length > 0 ? discTracks : allTracks;
};

/**
 * Resolve the track the CD player is showing, using the displayed number as
 * the position inside the current disc.
 */
export const getTrackForDisc = (
  cd: Cd | null | undefined,
  displayedTrack: number | null | undefined,
): Track | null => {
  if (displayedTrack == null || displayedTrack < 1) return null;

  const tracks = getTracksForDisc(cd);

  return (
    tracks[displayedTrack - 1] ??
    tracks.find((track) => track.number === displayedTrack) ??
    null
  );
};

/** Parse a Discogs duration ("4:44") into seconds. */
export const parseTrackDuration = (
  duration: string | null | undefined,
): number | null => {
  if (!duration) return null;

  const parts = duration.split(":");
  if (parts.length !== 2) return null;

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;

  return minutes * 60 + seconds;
};
