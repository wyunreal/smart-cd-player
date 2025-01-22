import { readJsonFromFile } from "./json-storage";
import { CdSlot } from "./types";

const FILE_PATH = "data/player-content.json";
const readFile = async (): Promise<CdSlot[][]> =>
  readJsonFromFile(FILE_PATH) || [[], [], []];

export const getPlayerContent = async (
  playerIndex: number
): Promise<CdSlot[]> => {
  if (playerIndex < 0 || playerIndex > 2) {
    throw new Error("Invalid player index");
  }
  return (await readFile())[playerIndex];
};
