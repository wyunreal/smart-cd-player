import { fileExists, readJsonFromFile } from "./json-storage";
import { PlayerDefinition } from "./types";

const FILE_PATH = "data/player-definitions.json";
const readFile = async () => readJsonFromFile(FILE_PATH) || [];

export const getPlayerDefinitions = async (): Promise<PlayerDefinition[]> => {
  if (await fileExists(FILE_PATH)) {
    return await readFile();
  } else {
    return [
      { remoteIndex: 1, capacity: 200, active: true },
      { remoteIndex: 2, capacity: 200, active: true },
      { remoteIndex: 3, capacity: 200, active: true },
    ];
  }
};
