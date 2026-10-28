import type { Cd, Track } from "@/api/types";
import {
  getTrackForDisc,
  getTracksForDisc,
  parseTrackDuration,
} from "../tracks";

const makeCd = (tracks: Track[], overrides: Partial<Cd> = {}): Cd => ({
  id: 1,
  title: "Album",
  artist: "Artist",
  genre: "Genre",
  tracks,
  ...overrides,
});

const track = (number: number, cd = 1, title = `Track ${number}`): Track => ({
  number,
  cd,
  title,
});

describe("getTrackForDisc", () => {
  it("returns null without cd or displayed track", () => {
    expect(getTrackForDisc(null, 1)).toBeNull();
    expect(getTrackForDisc(makeCd([track(1)]), null)).toBeNull();
    expect(getTrackForDisc(makeCd([track(1)]), 0)).toBeNull();
  });

  it("resolves a single-disc track by its number", () => {
    const cd = makeCd([track(1), track(2), track(3)]);

    expect(getTrackForDisc(cd, 2)?.title).toBe("Track 2");
  });

  it("maps the displayed track to the disc position on multi-disc releases", () => {
    const cd = makeCd([track(21, 2), track(22, 2), track(23, 2)], {
      diskNumber: 2,
      diskAmount: 6,
    });

    expect(getTrackForDisc(cd, 1)?.title).toBe("Track 21");
    expect(getTrackForDisc(cd, 3)?.title).toBe("Track 23");
  });

  it("filters by disc when the cd holds tracks from several discs", () => {
    const cd = makeCd(
      [track(1, 1), track(2, 1), track(3, 2), track(4, 2)],
      { diskNumber: 2, diskAmount: 2 },
    );

    expect(getTrackForDisc(cd, 1)?.title).toBe("Track 3");
    expect(getTrackForDisc(cd, 2)?.title).toBe("Track 4");
  });

  it("falls back to the absolute number when tracks lack a disc number", () => {
    const cd = makeCd(
      [
        { number: 21, title: "First" },
        { number: 22, title: "Second" },
      ] as Track[],
      { diskNumber: 2 },
    );

    expect(getTrackForDisc(cd, 1)?.title).toBe("First");
  });

  it("returns null when the displayed track is out of range", () => {
    const cd = makeCd([track(1), track(2)]);

    expect(getTrackForDisc(cd, 9)).toBeNull();
  });
});

describe("getTracksForDisc", () => {
  it("returns an empty list without cd or tracks", () => {
    expect(getTracksForDisc(null)).toEqual([]);
    expect(getTracksForDisc(makeCd([]))).toEqual([]);
  });

  it("keeps only the tracks of the current disc", () => {
    const cd = makeCd(
      [track(1, 1), track(2, 1), track(3, 2), track(4, 2)],
      { diskNumber: 2, diskAmount: 2 },
    );

    expect(getTracksForDisc(cd).map(({ title }) => title)).toEqual([
      "Track 3",
      "Track 4",
    ]);
  });

  it("falls back to all tracks when none carry a disc number", () => {
    const cd = makeCd(
      [
        { number: 21, title: "First" },
        { number: 22, title: "Second" },
      ] as Track[],
      { diskNumber: 2 },
    );

    expect(getTracksForDisc(cd)).toHaveLength(2);
  });
});

describe("parseTrackDuration", () => {
  it("parses minutes and seconds", () => {
    expect(parseTrackDuration("4:44")).toBe(284);
    expect(parseTrackDuration("0:05")).toBe(5);
  });

  it("returns null for missing or malformed values", () => {
    expect(parseTrackDuration(undefined)).toBeNull();
    expect(parseTrackDuration("")).toBeNull();
    expect(parseTrackDuration("4:44:01")).toBeNull();
    expect(parseTrackDuration("ab:cd")).toBeNull();
  });
});
