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
};

export type Track = { number: number; cd: number; title: string };

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

export type Cd = CdBasicInfo & {
  id: number;
  barCode?: string;
  art?: AlbumArt;
  diskAmount?: number;
  diskNumber?: number;
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
