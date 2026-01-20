// Player definitions

export type PlayerDefinition = {
  active: boolean;
  remoteIndex: number;
  capacity: number;
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
  tracksNumber: number;
};

export type CdBasicInfo = {
  title: string;
  artist: string;
  year?: number;
  genre: string;
  tracks: { number: number; title: string }[];
};

export type AlbumArt = {
  albumSmall?: string;
  albumBig?: string;
  artistSmall?: string;
  artistBig?: string;
  allImages?: Array<{
    uri: string;
    uri150: string;
    width: number;
    height: number;
    type: string;
  }>;
};

export type Cd = CdBasicInfo & {
  id: number;
  art?: AlbumArt;
};
