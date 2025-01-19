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
};

export type Cd = CdBasicInfo & {
  id: string;
  art?: AlbumArt;
};

export type CdInUse = Cd & {
  position: number;
};
