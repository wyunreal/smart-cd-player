import { fileExists, readJsonFromFile, writeJsonToFile } from "./json-storage";
import { PlayerDefinition } from "./types";

export const DEFINITIONS_COUNT = 3;
export const VALID_CAPACITY = [50, 100, 200, 300, 400];

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const FILE_PATH = `${DATA_DIR}/player-definitions.json`;
const readFile = async () => readJsonFromFile(FILE_PATH) || [];

export const getPlayerDefinitions = async (): Promise<PlayerDefinition[]> => {
  if (await fileExists(FILE_PATH)) {
    return await readFile();
  } else {
    return Array.from({ length: DEFINITIONS_COUNT }, (_, i) => ({
      remoteIndex: i + 1,
      capacity: VALID_CAPACITY[0],
      active: true,
    }));
  }
};

export const savePlayerDefinitions = async (
  definitions: PlayerDefinition[],
) => {
  writeJsonToFile(FILE_PATH, definitions);
};
