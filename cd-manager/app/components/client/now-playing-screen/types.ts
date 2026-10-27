import type { DisplayMode } from "@/api/types";

export type NowPlayingAlbumView = {
  title: string;
  artist: string;
  year: number | null;
  genre: string | null;
  totalTracks: number;
  /** Album cover used in the info panel. */
  coverArt: string;
  /** Artwork printed on the disc face. */
  discArt: string;
};

export type NowPlayingTrackView = {
  number: number;
  title: string;
  artist: string;
  elapsedSeconds: number;
  durationSeconds: number;
};

/** Minimal track entry used by the track list opened from the stacked view. */
export type NowPlayingTrackListItem = {
  number: number;
  title: string;
};

export type NowPlayingViewData = {
  album: NowPlayingAlbumView;
  track: NowPlayingTrackView | null;
  tracks: NowPlayingTrackListItem[];
  mode: DisplayMode;
  volume: number;
  muted: boolean;
};

export type NowPlayingCapabilities = {
  canGoPrevious: boolean;
  canGoNext: boolean;
  canSeek: boolean;
  canControlVolume: boolean;
  canMute: boolean;
};

export type NowPlayingActions = {
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onSelectTrack: (index: number) => void;
  onTogglePower: () => void;
};

/**
 * Everything the view needs. It is intentionally free of any data source so
 * the mock container can be replaced by a connected one later.
 */
export type NowPlayingViewProps = {
  data: NowPlayingViewData;
  actions: NowPlayingActions;
  capabilities: NowPlayingCapabilities;
};
