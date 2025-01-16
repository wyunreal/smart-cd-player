"use server";

import fetchAlbum from "./fetch-album";
import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Cd, CdInputData } from "./types";

const FILE_PATH = "data/cd-collection.json";

const readFile = async () => readJsonFromFile(FILE_PATH) || [];

let cdCollection: Cd[] = [];

export const getCdCollection = async () => {
  const cds = await readFile();
  cdCollection = cds;
  return cdCollection;
};

export const addCd = async (cdData: CdInputData) => {
  let cdDetails;
  try {
    cdDetails = await fetchAlbum(
      cdData.artist,
      cdData.album,
      cdData.tracksNumber
    );
  } catch (e) {
    cdDetails = {
      title: cdData.album,
      artist: cdData.artist,
      genre: cdData.genre,
      tracks: Array.from({ length: cdData.tracksNumber }, (_, i) => ({
        number: i + 1,
        title: `Track ${i + 1}`,
      })),
    };
  }

  const data = await getCdCollection();
  console.log(cdDetails);
  writeJsonToFile(FILE_PATH, [...data, cdDetails]);
};

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
