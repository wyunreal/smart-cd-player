export type MockTrack = {
  number: number;
  title: string;
  durationSeconds: number;
};

export const MOCK_ALBUM = {
  title: "OK Computer",
  artist: "Radiohead",
  year: 1997,
  genre: "Alternative Rock",
  coverArt: "/mock/ok-computer-cover.jpg",
  discArt: "/mock/ok-computer-cover.jpg",
} as const;

export const MOCK_TRACKS: MockTrack[] = [
  { number: 1, title: "Airbag", durationSeconds: 284 },
  { number: 2, title: "Paranoid Android", durationSeconds: 383 },
  { number: 3, title: "Subterranean Homesick Alien", durationSeconds: 267 },
  { number: 4, title: "Exit Music (For a Film)", durationSeconds: 264 },
  { number: 5, title: "Let Down", durationSeconds: 299 },
  { number: 6, title: "Karma Police", durationSeconds: 261 },
  { number: 7, title: "Fitter Happier", durationSeconds: 117 },
  { number: 8, title: "Electioneering", durationSeconds: 230 },
  { number: 9, title: "Climbing Up the Walls", durationSeconds: 285 },
  { number: 10, title: "No Surprises", durationSeconds: 228 },
  { number: 11, title: "Lucky", durationSeconds: 259 },
  { number: 12, title: "The Tourist", durationSeconds: 324 },
];

export const MOCK_INITIAL_TRACK_INDEX = 1;
export const MOCK_INITIAL_ELAPSED_SECONDS = 116;
export const MOCK_INITIAL_VOLUME = 70;
