"use server";

import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Cd, CdInputData } from "./types";

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const FILE_PATH = `${DATA_DIR}/cd-collection.json`;
const readFile = async () => readJsonFromFile(FILE_PATH) || [];

export const getCdCollection: () => Promise<Cd[]> = async () => {
  return await readFile();
};

export const addCd = async (cdData: Cd): Promise<number> => {
  const data = await getCdCollection();
  const maxId = data.length > 0 ? Math.max(...data.map((cd) => cd.id)) : 0;
  const newId = maxId + 1;
  const cdDetails = {
    ...cdData,
    id: newId,
  };

  writeJsonToFile(FILE_PATH, [...data, cdDetails]);
  return newId;
};

export const editCd = async (cdData: CdInputData, cdId: number) => {
  const cds = await getCdCollection();
  const index = cds.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }
  let cdDetails;

  cdDetails = {
    ...cds[index],
    title: cdData.album,
    artist: cdData.artist,
    genre: cdData.genre,
  };

  if (
    !cdDetails.tracks ||
    cdDetails.tracks.length === 0 ||
    cdData.tracksNumber !== cdDetails.tracks.length
  ) {
    cdDetails.tracks = Array.from({ length: cdData.tracksNumber }, (_, i) => ({
      number: i + 1,
      title: `Track ${i + 1}`,
    }));
  }

  cdDetails.id = cdId;
  cds[index] = cdDetails;
  writeJsonToFile(FILE_PATH, cds);
};

export const deleteCd = async (cdId: number) => {
  const data = await getCdCollection();
  const index = data.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }
  data.splice(index, 1);
  writeJsonToFile(FILE_PATH, data);
};
