import { readJsonFromFile } from "./json-storage";
import { PlayerDefinition } from "./types";

const FILE_PATH = "data/player-definitions.json";
const readFile = async () => readJsonFromFile(FILE_PATH) || [];

export const getPlayerDefinitions = async (): Promise<PlayerDefinition[]> => {
  const a = await readFile();
  console.log(a);
  return a;
};
