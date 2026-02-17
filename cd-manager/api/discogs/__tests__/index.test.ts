import { Cd, DiscogsSearchResult, Track } from "../../types";
import { _internal } from "../index";

const { selectReleasesForTracks, calculateConsensusCd } = _internal;

// Helper to create a minimal Cd with tracks
const makeCd = (tracks: Track[], overrides: Partial<Cd> = {}): Cd => ({
  id: 0,
  title: "Album",
  artist: "Artist",
  genre: "Rock",
  tracks,
  ...overrides,
});

const makeResult = (cds: Cd[]): DiscogsSearchResult => ({ cds });

describe("selectReleasesForTracks", () => {
  it("returns the single release when there is only one", () => {
    const cd = makeCd([
      { number: 1, cd: 1, title: "Track 1" },
      { number: 2, cd: 1, title: "Track 2" },
    ]);
    const result = selectReleasesForTracks([cd]);
    expect(result).toEqual([cd]);
  });

  it("returns empty array for empty input", () => {
    expect(selectReleasesForTracks([])).toEqual([]);
  });

  it("selects releases with the highest track count when multiple groups exist", () => {
    const cd5a = makeCd(
      Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "5-track A" },
    );
    const cd5b = makeCd(
      Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "5-track B" },
    );
    const cd3 = makeCd(
      Array.from({ length: 3 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "3-track" },
    );

    const result = selectReleasesForTracks([cd5a, cd3, cd5b]);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("5-track A");
    expect(result[1].title).toBe("5-track B");
  });

  it("prefers multi-disc releases over single-disc", () => {
    const singleDisc = makeCd(
      Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "Single disc 10 tracks" },
    );
    const multiDisc = makeCd(
      [
        { number: 1, cd: 1, title: "Disc1 Track1" },
        { number: 2, cd: 1, title: "Disc1 Track2" },
        { number: 3, cd: 2, title: "Disc2 Track1" },
        { number: 4, cd: 2, title: "Disc2 Track2" },
        { number: 5, cd: 2, title: "Disc2 Track3" },
      ],
      { title: "Multi disc 5 tracks" },
    );

    const result = selectReleasesForTracks([singleDisc, multiDisc]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Multi disc 5 tracks");
  });

  it("among multi-disc releases, picks the group with highest track count", () => {
    const multi8 = makeCd(
      Array.from({ length: 8 }, (_, i) => ({
        number: i + 1,
        cd: i < 4 ? 1 : 2,
        title: `Track ${i + 1}`,
      })),
      { title: "Multi 8 tracks" },
    );
    const multi6a = makeCd(
      Array.from({ length: 6 }, (_, i) => ({
        number: i + 1,
        cd: i < 3 ? 1 : 2,
        title: `Track ${i + 1}`,
      })),
      { title: "Multi 6 tracks A" },
    );
    const multi6b = makeCd(
      Array.from({ length: 6 }, (_, i) => ({
        number: i + 1,
        cd: i < 3 ? 1 : 2,
        title: `Track ${i + 1}`,
      })),
      { title: "Multi 6 tracks B" },
    );

    const result = selectReleasesForTracks([multi6a, multi8, multi6b]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Multi 8 tracks");
  });

  it("falls back to single-disc grouping when no multi-disc exists", () => {
    const cd4a = makeCd(
      Array.from({ length: 4 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "4-track A" },
    );
    const cd4b = makeCd(
      Array.from({ length: 4 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "4-track B" },
    );
    const cd2 = makeCd(
      [
        { number: 1, cd: 1, title: "T1" },
        { number: 2, cd: 1, title: "T2" },
      ],
      { title: "2-track" },
    );

    const result = selectReleasesForTracks([cd4a, cd2, cd4b]);
    expect(result).toHaveLength(2);
  });

  it("filters by CD format when some releases have format info", () => {
    const cdRelease = makeCd(
      Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      {
        title: "CD Release",
        formats: [{ name: "CD", qty: "1" }],
      },
    );
    const vinylRelease = makeCd(
      Array.from({ length: 8 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      {
        title: "Vinyl Release",
        formats: [{ name: "Vinyl", qty: "1" }],
      },
    );

    const result = selectReleasesForTracks([cdRelease, vinylRelease]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("CD Release");
  });

  it("uses all releases when none have CD format info", () => {
    const cd5 = makeCd(
      Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "No format A" },
    );
    const cd5b = makeCd(
      Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
      { title: "No format B" },
    );

    const result = selectReleasesForTracks([cd5, cd5b]);
    expect(result).toHaveLength(2);
  });

  it("filters by CD format case-insensitively", () => {
    const cdLower = makeCd([{ number: 1, cd: 1, title: "T1" }], {
      title: "cd lowercase",
      formats: [{ name: "cd", qty: "1" }],
    });
    const vinyl = makeCd(
      [
        { number: 1, cd: 1, title: "T1" },
        { number: 2, cd: 1, title: "T2" },
      ],
      {
        title: "Vinyl",
        formats: [{ name: "Vinyl", qty: "1" }],
      },
    );

    const result = selectReleasesForTracks([cdLower, vinyl]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("cd lowercase");
  });
});

describe("calculateConsensusCd", () => {
  it("returns result unchanged when no CDs exist", () => {
    const result = calculateConsensusCd(makeResult([]));
    expect(result.cds).toEqual([]);
    expect(result.cd).toBeUndefined();
  });

  it("uses single release tracks directly", () => {
    const tracks: Track[] = [
      { number: 1, cd: 1, title: "Hello" },
      { number: 2, cd: 1, title: "World" },
    ];
    const result = calculateConsensusCd(makeResult([makeCd(tracks)]));

    expect(result.cd).toBeDefined();
    expect(result.cd!.tracks).toHaveLength(2);
    expect(result.cd!.tracks[0].title).toBe("Hello");
    expect(result.cd!.tracks[1].title).toBe("World");
  });

  it("never creates more tracks than the selected releases have", () => {
    // Release A has 5 tracks, Release B has 3 tracks, Release C has 5 tracks
    // Should select A and C (5 tracks), not create 5 from mixed sources
    const cdA = makeCd(
      Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `A-Track ${i + 1}`,
      })),
    );
    const cdB = makeCd(
      Array.from({ length: 3 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `B-Track ${i + 1}`,
      })),
    );
    const cdC = makeCd(
      Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `C-Track ${i + 1}`,
      })),
    );

    const result = calculateConsensusCd(makeResult([cdA, cdB, cdC]));

    expect(result.cd!.tracks).toHaveLength(5);
    // Should NOT have 5+3=8 tracks or anything beyond 5
  });

  it("propagates duration from selected releases", () => {
    const cdWithDuration = makeCd([
      { number: 1, cd: 1, title: "Song A", duration: "3:45" },
      { number: 2, cd: 1, title: "Song B", duration: "4:20" },
    ]);
    const cdWithoutDuration = makeCd([
      { number: 1, cd: 1, title: "Song A" },
      { number: 2, cd: 1, title: "Song B" },
    ]);

    const result = calculateConsensusCd(
      makeResult([cdWithDuration, cdWithoutDuration]),
    );

    expect(result.cd!.tracks[0].duration).toBe("3:45");
    expect(result.cd!.tracks[1].duration).toBe("4:20");
  });

  it("does not include duration when no release has it", () => {
    const cd = makeCd([
      { number: 1, cd: 1, title: "Song A" },
      { number: 2, cd: 1, title: "Song B" },
    ]);

    const result = calculateConsensusCd(makeResult([cd]));

    expect(result.cd!.tracks[0].duration).toBeUndefined();
    expect(result.cd!.tracks[1].duration).toBeUndefined();
  });

  it("respects multi-disc track division", () => {
    const multiDisc = makeCd([
      { number: 1, cd: 1, title: "D1-T1" },
      { number: 2, cd: 1, title: "D1-T2" },
      { number: 3, cd: 2, title: "D2-T1" },
      { number: 4, cd: 2, title: "D2-T2" },
    ]);

    const result = calculateConsensusCd(makeResult([multiDisc]));

    expect(result.cd!.tracks).toHaveLength(4);
    expect(result.cd!.tracks[0].cd).toBe(1);
    expect(result.cd!.tracks[1].cd).toBe(1);
    expect(result.cd!.tracks[2].cd).toBe(2);
    expect(result.cd!.tracks[3].cd).toBe(2);
  });

  it("prefers multi-disc releases over single-disc with more tracks", () => {
    // Single disc with 12 tracks
    const singleDisc = makeCd(
      Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        cd: 1,
        title: `Track ${i + 1}`,
      })),
    );
    // Multi disc with 8 tracks total (4 per disc)
    const multiDisc = makeCd([
      { number: 1, cd: 1, title: "D1-One" },
      { number: 2, cd: 1, title: "D1-Two" },
      { number: 3, cd: 1, title: "D1-Three" },
      { number: 4, cd: 1, title: "D1-Four" },
      { number: 5, cd: 2, title: "D2-One" },
      { number: 6, cd: 2, title: "D2-Two" },
      { number: 7, cd: 2, title: "D2-Three" },
      { number: 8, cd: 2, title: "D2-Four" },
    ]);

    const result = calculateConsensusCd(makeResult([singleDisc, multiDisc]));

    // Should use multi-disc (8 tracks), not single-disc (12 tracks)
    expect(result.cd!.tracks).toHaveLength(8);
    expect(result.cd!.tracks[4].cd).toBe(2);
  });

  it("uses consensus title from most frequent among selected releases", () => {
    const cd1 = makeCd(
      [
        { number: 1, cd: 1, title: "Intro" },
        { number: 2, cd: 1, title: "Main" },
      ],
      { title: "Correct Album" },
    );
    const cd2 = makeCd(
      [
        { number: 1, cd: 1, title: "Intro" },
        { number: 2, cd: 1, title: "Main" },
      ],
      { title: "Correct Album" },
    );
    const cd3 = makeCd(
      [
        { number: 1, cd: 1, title: "Intro" },
        { number: 2, cd: 1, title: "Main" },
      ],
      { title: "Wrong Name" },
    );

    const result = calculateConsensusCd(makeResult([cd1, cd2, cd3]));

    expect(result.cd!.title).toBe("Correct Album");
  });

  it("uses consensus track title from most frequent among selected releases", () => {
    const cd1 = makeCd([{ number: 1, cd: 1, title: "Right Title" }]);
    const cd2 = makeCd([{ number: 1, cd: 1, title: "Right Title" }]);
    const cd3 = makeCd([{ number: 1, cd: 1, title: "Wrong Title" }]);

    const result = calculateConsensusCd(makeResult([cd1, cd2, cd3]));

    expect(result.cd!.tracks[0].title).toBe("Right Title");
  });
});
