"use server";

import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Art, Cd, CdInputData } from "./types";
import { downloadImage } from "./file-storage";

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const FILE_PATH = `${DATA_DIR}/cd-collection.json`;
const readFile = async (): Promise<Cd[]> => {
  const data = await readJsonFromFile<Cd[]>(FILE_PATH);
  return data || [];
};

export const getCdCollection: () => Promise<Cd[]> = async () => {
  return await readFile();
};

export const addCd = async (cds: Cd[]): Promise<number[]> => {
  const data = await getCdCollection();
  const maxId = data.length > 0 ? Math.max(...data.map((cd) => cd.id)) : 0;
  for (let i = 0; i < cds.length; i++) {
    const newId = maxId + 1 + i;
    cds[i].id = newId;

    if (cds[i].art) {
      const downloadPromises = [];
      const imageTypes: Array<{
        art: Art | undefined;
        type: "album" | "artist" | "cd";
      }> = [
        { art: cds[i].art?.album, type: "album" },
        { art: cds[i].art?.artist, type: "artist" },
        { art: cds[i].art?.cd, type: "cd" },
      ];

      for (const { art, type } of imageTypes) {
        if (art?.uri) {
          const ext = art.uri.split(".").pop() || "jpg";
          const filename = `${newId}-${type}.${ext}`;
          const filename150 = `${newId}-${type}-150.${ext}`;

          downloadPromises.push(downloadImage(`${art.uri}`, filename));

          if (art.uri150) {
            downloadPromises.push(downloadImage(`${art.uri150}`, filename150));
          }

          art.uri = `/api/images/${filename}`;
          if (art.uri150) {
            art.uri150 = `/api/images/${filename150}`;
          }
        }
      }

      await Promise.all(downloadPromises);
    }
  }
  writeJsonToFile<Cd[]>(FILE_PATH, [...data, ...cds]);
  return cds.map((cd) => cd.id);
};

export const editCd = async (cdData: CdInputData, cdId: number) => {
  const cds = await getCdCollection();
  const index = cds.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }

  const cdDetails = {
    ...cds[index],
    title: cdData.album,
    artist: cdData.artist,
    genre: cdData.genre,
  };

  cdDetails.id = cdId;
  cds[index] = cdDetails;
  writeJsonToFile<Cd[]>(FILE_PATH, cds);
};

export const deleteCd = async (cdId: number) => {
  const data = await getCdCollection();
  const index = data.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }
  data.splice(index, 1);
  writeJsonToFile<Cd[]>(FILE_PATH, data);
};
