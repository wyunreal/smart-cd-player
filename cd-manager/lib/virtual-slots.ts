import type { Cd, PlayerDefinition } from "@/api/types";

/**
 * A slot as exposed by the player content datasource. `slot` is always the
 * physical slot inside its player, never an array index.
 */
export type SlotContent = {
  slot: number;
  cd: Cd | null;
};

/**
 * Capacity-based layout of a configured player. Virtual numbers are assigned
 * by accumulating the full capacity of every previous player:
 *
 *   player 1 -> 1..capacity1
 *   player 2 -> capacity1+1..capacity1+capacity2
 *   ...
 *
 * The layout includes inactive players so the numbering stays stable when a
 * player is enabled or disabled.
 */
export type VirtualPlayerLayout = {
  remoteIndex: number;
  playerIndex: number;
  capacity: number;
  /** Number of virtual slots reserved by the players before this one. */
  offset: number;
};

/**
 * A slot shown in the unified player view. Only slots that contain a CD are
 * included, so `index` is the position in the rendered list while `number` is
 * the canonical (possibly sparse) virtual slot number.
 */
export type VirtualSlot = {
  /** Position in the rendered list (carousel/slider). */
  index: number;
  /** Canonical 1-based virtual slot number. */
  number: number;
  playerRemoteIndex: number;
  playerIndex: number;
  /** Physical slot inside the player (1..capacity). */
  slot: number;
  cd: Cd | null;
  /** First visible slot of its player, used for the boundary marker. */
  isFirstOfPlayer: boolean;
};

export const buildVirtualLayouts = (
  definitions: PlayerDefinition[],
): VirtualPlayerLayout[] => {
  const sorted = definitions
    .filter(
      (definition) =>
        Number.isInteger(definition.remoteIndex) &&
        definition.remoteIndex > 0 &&
        Number.isInteger(definition.capacity) &&
        definition.capacity > 0,
    )
    .sort((a, b) => a.remoteIndex - b.remoteIndex);

  let offset = 0;
  return sorted.map((definition) => {
    const layout: VirtualPlayerLayout = {
      remoteIndex: definition.remoteIndex,
      playerIndex: definition.remoteIndex - 1,
      capacity: definition.capacity,
      offset,
    };
    offset += definition.capacity;
    return layout;
  });
};

/**
 * Resolve the canonical virtual number for a physical slot. Returns null when
 * the player is not part of the layout or the slot is outside its capacity.
 */
export const getVirtualNumber = (
  layouts: VirtualPlayerLayout[],
  playerRemoteIndex: number,
  physicalSlot: number,
): number | null => {
  const layout = layouts.find(
    (candidate) => candidate.remoteIndex === playerRemoteIndex,
  );
  if (!layout || physicalSlot < 1 || physicalSlot > layout.capacity) {
    return null;
  }
  return layout.offset + physicalSlot;
};

/**
 * Resolve a canonical virtual number to the player and physical slot it
 * belongs to. This is the inverse of `getVirtualNumber`.
 */
export const getPlayerSlotForVirtualNumber = (
  layouts: VirtualPlayerLayout[],
  virtualNumber: number,
): { remoteIndex: number; playerIndex: number; slot: number } | null => {
  if (!Number.isInteger(virtualNumber) || virtualNumber < 1) return null;

  const layout = layouts.find(
    (candidate) =>
      virtualNumber > candidate.offset &&
      virtualNumber <= candidate.offset + candidate.capacity,
  );
  if (!layout) return null;

  return {
    remoteIndex: layout.remoteIndex,
    playerIndex: layout.playerIndex,
    slot: virtualNumber - layout.offset,
  };
};

/**
 * Build the list rendered by the unified view. It contains only slots with a
 * CD; empty slots (including gaps between used slots) are intentionally
 * omitted. Virtual numbers still reserve the full capacity of every player.
 */
export const buildVisibleSlots = (
  playerContent: SlotContent[][],
  layouts: VirtualPlayerLayout[],
): VirtualSlot[] => {
  const visibleSlots: VirtualSlot[] = [];

  for (const layout of layouts) {
    const content = playerContent[layout.playerIndex] ?? [];
    const slotsByNumber = new Map<number, Cd>();

    for (const item of content) {
      if (
        item.cd &&
        item.slot >= 1 &&
        item.slot <= layout.capacity &&
        !slotsByNumber.has(item.slot)
      ) {
        slotsByNumber.set(item.slot, item.cd);
      }
    }

    const occupied = [...slotsByNumber.entries()].sort(
      ([slotA], [slotB]) => slotA - slotB,
    );

    occupied.forEach(([slot, cd], position) => {
      visibleSlots.push({
        index: visibleSlots.length,
        number: layout.offset + slot,
        playerRemoteIndex: layout.remoteIndex,
        playerIndex: layout.playerIndex,
        slot,
        cd,
        isFirstOfPlayer: position === 0,
      });
    });
  }

  return visibleSlots;
};

export const findVisibleSlotByCdId = (
  visibleSlots: VirtualSlot[],
  cdId: number,
): VirtualSlot | null =>
  visibleSlots.find((slot) => slot.cd?.id === cdId) ?? null;

export const groupVisibleSlotsByArtist = (
  visibleSlots: VirtualSlot[],
): Record<string, VirtualSlot[]> => {
  const byArtist: Record<string, VirtualSlot[]> = {};

  for (const slot of visibleSlots) {
    if (!slot.cd) continue;
    const artist = slot.cd.artist;
    if (!byArtist[artist]) byArtist[artist] = [];
    byArtist[artist].push(slot);
  }

  return byArtist;
};
