"use server";

import { DEFINITIONS_COUNT, VALID_CAPACITY } from "./constants";
import { fileExists, readJsonFromFile, writeJsonToFile } from "./json-storage";
import { PlayerDefinition } from "./types";

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const FILE_PATH = `${DATA_DIR}/player-definitions.json`;
const readFile = async (): Promise<PlayerDefinition[]> => {
  const data = await readJsonFromFile<PlayerDefinition[]>(FILE_PATH);
  return data || [];
};

export const getPlayerDefinitions = async (): Promise<PlayerDefinition[]> => {
  if (await fileExists(FILE_PATH)) {
    return await readFile();
  } else {
    return Array.from({ length: DEFINITIONS_COUNT }, (_, i) => ({
      remoteIndex: i + 1,
      capacity: VALID_CAPACITY[0],
      active: true,
      irCommandsUrl: "",
      irSendCommandUrl: "",
    }));
  }
};

export const savePlayerDefinitions = async (
  definitions: PlayerDefinition[],
) => {
  writeJsonToFile<PlayerDefinition[]>(FILE_PATH, definitions);
};
