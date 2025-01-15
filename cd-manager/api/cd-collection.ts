"use server";

import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Cd } from "./types";

const FILE_PATH = "data/cd-collection.json";

const readFile = async () => readJsonFromFile(FILE_PATH) || [];

let cdCollection: Cd[] = [];

export const getCdCollection = async () => {
  const cds = await readFile();
  cdCollection = cds;
  return cdCollection;
};

export const addCd: (cdData: Cd) => Promise<void> = async (cdData: Cd) =>
  new Promise(async (resolve) => {
    const data = await getCdCollection();
    writeJsonToFile(FILE_PATH, [...data, cdData]);
    resolve();
  });

export const editCd: (cdData: Cd) => Promise<void> = async (cdData) =>
  new Promise(async (resolve) => {
    let data = await getCdCollection();
    const index = data.findIndex((cd) => cd.id === cdData.id);
    if (index === -1) {
      throw new Error(`CD with id ${cdData.id} not found`);
    }
    data[index] = cdData;
    writeJsonToFile(FILE_PATH, data);
    resolve();
  });

export const deleteCd: (cdId: string) => Promise<void> = async (cdId: string) =>
  new Promise(async (resolve, reject) => {
    const data = await getCdCollection();
    const index = data.findIndex((cd) => cd.id === cdId);
    if (index === -1) {
      reject(new Error(`CD with id ${cdId} not found`));
    }
    data.splice(index, 1);
    writeJsonToFile(FILE_PATH, data);
    resolve();
  });
