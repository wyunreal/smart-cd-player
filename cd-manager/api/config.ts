import { readJsonFromFile } from "./json-storage";

const FILE_PATH = "data/config.json";
const readFile = async () => readJsonFromFile(FILE_PATH) || {};

export const getGnuDbSeed = async () => {
  const data = await readFile();
  return data.gnudbSeed || "";
};
