"use server";

import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Cd } from "./types";

const FILE_PATH = "../data/cd-collection.json";

const readFile = () => (readJsonFromFile(FILE_PATH) || []) as Cd[];

let cdCollection: Cd[] = readFile();

export const getCdCollection = () => cdCollection || readFile();

export const addCd = (cdData: Cd) => {
  const data = getCdCollection();
  writeJsonToFile(FILE_PATH, [...data, cdData]);
};

export const editCd = (cdData: Cd) => {
  const data = getCdCollection();
  const index = data.findIndex((cd) => cd.id === cdData.id);
  if (index === -1) {
    throw new Error(`CD with id ${cdData.id} not found`);
  }
  data[index] = cdData;
  writeJsonToFile(FILE_PATH, data);
};

export const deleteCd = (cdId: string) => {
  const data = getCdCollection();
  const index = data.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }
  data.splice(index, 1);
  writeJsonToFile(FILE_PATH, data);
};
