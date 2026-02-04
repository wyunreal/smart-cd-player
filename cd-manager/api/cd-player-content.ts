"use server";

import { DEFINITIONS_COUNT } from "./constants";
import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Cd, CdSlot } from "./types";

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const FILE_PATH = `${DATA_DIR}/player-content.json`;
const readFile = async (): Promise<CdSlot[][]> =>
  readJsonFromFile(FILE_PATH) || [[], [], []];

export const getPlayerContent = async (
  playerIndex: number,
): Promise<CdSlot[]> => {
  if (playerIndex < 0 || playerIndex >= DEFINITIONS_COUNT) {
    throw new Error("Invalid player index");
  }
  return (await readFile())[playerIndex];
};

export const addCdToPlayer = async (
  playerRemote: number,
  cd: Cd,
  slot: number,
): Promise<void> => {
  if (playerRemote < 1 || playerRemote > DEFINITIONS_COUNT) {
    throw new Error("Invalid player index");
  }
  const playerContent = await readFile();
  const existingSlotIndex = playerContent[playerRemote - 1].findIndex(
    (s) => s.slot === slot,
  );
  if (existingSlotIndex !== -1) {
    playerContent[playerRemote - 1][existingSlotIndex] = { slot, cdId: cd.id };
  } else {
    playerContent[playerRemote - 1].push({ slot, cdId: cd.id });
  }
  playerContent[playerRemote - 1].sort((a, b) => a.slot - b.slot);
  return writeJsonToFile(FILE_PATH, playerContent);
};

export const removeCdFromPlayer = async (cdId: number): Promise<void> => {
  const playerContent = await readFile();
  const playerContentIndex = playerContent.findIndex((slots) =>
    slots.some((slot) => slot.cdId === cdId),
  );
  if (playerContentIndex === -1) {
    throw new Error("CD not found in any player");
  }
  const slotIndex = playerContent[playerContentIndex].findIndex(
    (slot) => slot.cdId === cdId,
  );
  if (slotIndex === -1) {
    throw new Error("CD not found in the player");
  }
  playerContent[playerContentIndex].splice(slotIndex, 1);
  return writeJsonToFile(FILE_PATH, playerContent);
};
