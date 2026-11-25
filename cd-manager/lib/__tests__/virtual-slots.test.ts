import type { Cd, PlayerDefinition } from "@/api/types";
import {
  buildVirtualLayouts,
  buildVisibleSlots,
  findVisibleSlotByCdId,
  getPlayerSlotForVirtualNumber,
  getVirtualNumber,
  groupVisibleSlotsByArtist,
  type SlotContent,
} from "../virtual-slots";

const cd = (id: number, artist = "Artist"): Cd => ({
  id,
  title: `CD ${id}`,
  artist,
  genre: "Rock",
  tracks: [],
});

const definition = (
  remoteIndex: number,
  capacity: number,
  active = true,
): PlayerDefinition => ({
  remoteIndex,
  capacity,
  active,
});

describe("buildVirtualLayouts", () => {
  it("accumulates the full capacity in remoteIndex order", () => {
    expect(
      buildVirtualLayouts([
        definition(3, 4),
        definition(1, 3),
        definition(2, 2),
      ]),
    ).toEqual([
      { remoteIndex: 1, playerIndex: 0, capacity: 3, offset: 0 },
      { remoteIndex: 2, playerIndex: 1, capacity: 2, offset: 3 },
      { remoteIndex: 3, playerIndex: 2, capacity: 4, offset: 5 },
    ]);
  });

  it("keeps inactive players in the layout so offsets stay stable", () => {
    expect(buildVirtualLayouts([definition(1, 2), definition(2, 3, false)])).toEqual([
      { remoteIndex: 1, playerIndex: 0, capacity: 2, offset: 0 },
      { remoteIndex: 2, playerIndex: 1, capacity: 3, offset: 2 },
    ]);
  });

  it("ignores players without capacity", () => {
    expect(buildVirtualLayouts([definition(1, 0)])).toEqual([]);
  });
});

describe("buildVisibleSlots", () => {
  const layouts = buildVirtualLayouts([
    definition(1, 3),
    definition(2, 2),
    definition(3, 4),
  ]);

  it("includes only slots with a CD and keeps capacity-based numbers", () => {
    const content: SlotContent[][] = [
      [
        { slot: 1, cd: cd(1) },
        { slot: 3, cd: cd(3) },
      ],
      [{ slot: 1, cd: cd(4) }],
      [],
    ];

    expect(buildVisibleSlots(content, layouts)).toEqual([
      {
        index: 0,
        number: 1,
        playerRemoteIndex: 1,
        playerIndex: 0,
        slot: 1,
        cd: cd(1),
        isFirstOfPlayer: true,
      },
      {
        index: 1,
        number: 3,
        playerRemoteIndex: 1,
        playerIndex: 0,
        slot: 3,
        cd: cd(3),
        isFirstOfPlayer: false,
      },
      {
        index: 2,
        number: 4,
        playerRemoteIndex: 2,
        playerIndex: 1,
        slot: 1,
        cd: cd(4),
        isFirstOfPlayer: true,
      },
    ]);
  });

  it("ignores gaps, null CDs, duplicate slots and out-of-capacity slots", () => {
    const content: SlotContent[][] = [
      [
        { slot: 2, cd: null },
        { slot: 4, cd: cd(4) },
        { slot: 3, cd: cd(3) },
        { slot: 1, cd: cd(1) },
        { slot: 1, cd: cd(99) },
      ],
    ];

    expect(buildVisibleSlots(content, layouts).map((slot) => slot.number)).toEqual([
      1, 3,
    ]);
    expect(buildVisibleSlots(content, layouts)[1].cd?.id).toBe(3);
  });

  it("reserves the capacity of empty players for the following players", () => {
    const content: SlotContent[][] = [[], [], [{ slot: 1, cd: cd(20) }]];

    expect(buildVisibleSlots(content, layouts)).toMatchObject([
      {
        index: 0,
        number: 6,
        playerRemoteIndex: 3,
        slot: 1,
        isFirstOfPlayer: true,
      },
    ]);
  });
});

describe("virtual number resolution", () => {
  const layouts = buildVirtualLayouts([
    definition(1, 50),
    definition(2, 100),
    definition(3, 200),
  ]);

  it("resolves a physical slot to its virtual number", () => {
    expect(getVirtualNumber(layouts, 1, 1)).toBe(1);
    expect(getVirtualNumber(layouts, 2, 1)).toBe(51);
    expect(getVirtualNumber(layouts, 3, 200)).toBe(350);
  });

  it("returns null for unknown players or slots outside capacity", () => {
    expect(getVirtualNumber(layouts, 4, 1)).toBeNull();
    expect(getVirtualNumber(layouts, 1, 0)).toBeNull();
    expect(getVirtualNumber(layouts, 1, 51)).toBeNull();
  });

  it("resolves a virtual number back to player and physical slot", () => {
    expect(getPlayerSlotForVirtualNumber(layouts, 1)).toEqual({
      remoteIndex: 1,
      playerIndex: 0,
      slot: 1,
    });
    expect(getPlayerSlotForVirtualNumber(layouts, 51)).toEqual({
      remoteIndex: 2,
      playerIndex: 1,
      slot: 1,
    });
    expect(getPlayerSlotForVirtualNumber(layouts, 150)).toEqual({
      remoteIndex: 2,
      playerIndex: 1,
      slot: 100,
    });
  });

  it("rejects numbers outside every player range", () => {
    expect(getPlayerSlotForVirtualNumber(layouts, 0)).toBeNull();
    expect(getPlayerSlotForVirtualNumber(layouts, 351)).toBeNull();
    expect(getPlayerSlotForVirtualNumber(layouts, 1.5)).toBeNull();
  });
});

describe("visible slot lookup", () => {
  const layouts = buildVirtualLayouts([definition(1, 3), definition(2, 3)]);
  const visibleSlots = buildVisibleSlots(
    [
      [{ slot: 2, cd: cd(10, "A") }],
      [
        { slot: 1, cd: cd(11, "A") },
        { slot: 3, cd: cd(12, "B") },
      ],
    ],
    layouts,
  );

  it("finds a slot by CD id", () => {
    expect(findVisibleSlotByCdId(visibleSlots, 11)?.number).toBe(4);
    expect(findVisibleSlotByCdId(visibleSlots, 999)).toBeNull();
  });

  it("groups visible slots by artist across players", () => {
    const grouped = groupVisibleSlotsByArtist(visibleSlots);

    expect(grouped.A.map((slot) => slot.number)).toEqual([2, 4]);
    expect(grouped.B.map((slot) => slot.number)).toEqual([6]);
  });
});
