import type { Cd, Track } from "@/api/types";

/**
 * Resolve the track the CD player is showing.
 *
 * Multi-disc releases are stored with a continuous track numbering (Discogs
 * positions like "2-03" end up as number 21 on a disc whose first track is 1),
 * while the player displays the track number within the disc. Filter the tracks
 * that belong to that disc and use the displayed number as its position inside
 * that list.
 */
export const getTrackForDisc = (
  cd: Cd | null | undefined,
  displayedTrack: number | null | undefined,
): Track | null => {
  if (!cd || displayedTrack == null || displayedTrack < 1) return null;

  const allTracks = cd.tracks ?? [];
  if (allTracks.length === 0) return null;

  const discNumber = cd.diskNumber ?? 1;
  const discTracks = allTracks.filter(
    (track) => (track.cd ?? 1) === discNumber,
  );
  const tracks = discTracks.length > 0 ? discTracks : allTracks;

  return (
    tracks[displayedTrack - 1] ??
    tracks.find((track) => track.number === displayedTrack) ??
    null
  );
};
