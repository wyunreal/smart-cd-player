export type CdKey = {
  cdid: string;
  artist: string;
  album: string;
};

export type CdBasicInfo = {
  title: string;
  artist: string;
  year: string;
  genre: string;
  tracks: { number: number; title: string }[];
};

export type Cd = CdBasicInfo & {
  id: string;
  art: {
    albumSmall: string;
    albumBig: string;
    artistSmall: string;
    artistBig: string;
  };
};

export type CdInUse = Cd & {
  position: number;
};
