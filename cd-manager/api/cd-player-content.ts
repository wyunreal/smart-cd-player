import { DEFINITIONS_COUNT } from "./cd-player-definitions";
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
  playerIndex: number,
  cd: Cd,
  slotIndex: number,
): Promise<void> => {
  if (playerIndex < 0 || playerIndex >= DEFINITIONS_COUNT) {
    throw new Error("Invalid player index");
  }
  const playerContent = await readFile();
  playerContent[playerIndex][slotIndex] = { slot: slotIndex, cdId: cd.id };
  return writeJsonToFile(FILE_PATH, playerContent);
};
