// Player definitions

export const enum PlayerCommand {
  PowerSwitch,
  Play,
  Pause,
  Stop,
  NextTrack,
  PreviousTrack,
  FastForward,
  FastBackward,
  NextDisk,
  PreviousDisk,
  DiskSelect,
  TrackSelect,
  Number0,
  Number1,
  Number2,
  Number3,
  Number4,
  Number5,
  Number6,
  Number7,
  Number8,
  Number9,
  Enter,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  PlayModeContinue,
  PlayModeShuffle,
  PlayModeProgram,
  PlayModeRepeat,
}

export type PlayerDefinition = {
  active: boolean;
  remoteIndex: number;
  capacity: number;
  playerApiBaseUrl?: string;
  irCommandsUrl?: string;
  irSendCommandUrl?: string;
  irDeviceName?: string;
  /**
   * Key of the stream in composite-video-parser's config.json (`streams.<id>`),
   * which is also the key returned by GET /display. There is no default: when
   * empty, the player has no display readings.
   */
  streamId?: string;
};

// Display state exposed by composite-video-parser

export type DisplayMode = "off" | "stopped" | "playing" | "paused";

export type StreamStatus = "ok" | "starting" | "stale" | "error";

export type DisplayState = {
  status: StreamStatus;
  error?: string;
  mode: DisplayMode;
  disc: number | null;
  track: number | null;
  minutes: number | null;
  seconds: number | null;
  timestamp: number;
};

// Player content

export type CdSlot = {
  slot: number;
  cdId: number;
};

// Cd collection

export type CdKey = {
  cdid: string;
  artist: string;
  album: string;
};

export type CdInputData = {
  artist: string;
  album: string;
  year?: number;
  genre: string;
};

export type Track = {
  number: number;
  cd: number;
  title: string;
  duration?: string;
};

export type CdBasicInfo = {
  title: string;
  artist: string;
  year?: number;
  genre: string;
  genres?: string[];
  styles?: string[];
  tracks: Track[];
};

export type Art = {
  uri: string;
  uri150: string;
  width: number;
  height: number;
  type: string;
};

export type AlbumArt = {
  album?: Art;
  artist?: Art;
  cd?: Art;
  allImages?: Array<Art>;
};

export type CdFormat = {
  name: string;
  qty: string;
  descriptions?: string[];
};

export type Cd = CdBasicInfo & {
  id: number;
  barCode?: string;
  art?: AlbumArt;
  diskAmount?: number;
  diskNumber?: number;
  formats?: CdFormat[];
};

export type DiscogsSearchResult = {
  cds: Cd[];
  cd?: Cd;
  rateLimit?: {
    limit: number;
    remaining: number;
  };
};

export type ArtistPicturesResult = {
  artistId: number;
  artistName: string;
  images: Art[];
  rateLimit?: {
    limit: number;
    remaining: number;
  };
};
