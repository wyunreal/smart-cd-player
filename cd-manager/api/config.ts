import { readJsonFromFile } from "./json-storage";

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const FILE_PATH = `${DATA_DIR}/config.json`;
const readFile = async () => readJsonFromFile(FILE_PATH) || {};

export const getGnuDbSeed = async () => {
  const data = await readFile();
  return data.gnudbSeed || "";
};
