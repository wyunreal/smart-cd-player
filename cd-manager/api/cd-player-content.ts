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
  playerRemote: number,
  cd: Cd,
  slot: number,
): Promise<void> => {
  if (playerRemote < 1 || playerRemote > DEFINITIONS_COUNT) {
    throw new Error("Invalid player index");
  }
  const playerContent = await readFile();
  playerContent[playerRemote - 1][slot - 1] = { slot, cdId: cd.id };
  return writeJsonToFile(FILE_PATH, playerContent);
};
