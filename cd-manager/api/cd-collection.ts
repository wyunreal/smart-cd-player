"use server";

import fetchAlbum from "./fetch-album";
import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Cd, CdInputData } from "./types";

const FILE_PATH = "data/cd-collection.json";

const readFile = async () => readJsonFromFile(FILE_PATH) || [];

export const getCdCollection: () => Promise<Cd[]> = async () => {
  return await readFile();
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
  writeJsonToFile(FILE_PATH, [...data, cdDetails]);
};

export const editCd = async (
  cdData: CdInputData,
  cdId: string,
  fetchCdDetails?: boolean
) => {
  const fetchDetails = fetchCdDetails ?? true;
  const cds = await getCdCollection();
  const index = cds.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }
  let cdDetails;
  if (fetchDetails) {
    try {
      cdDetails = await fetchAlbum(
        cdData.artist,
        cdData.album,
        cdData.tracksNumber
      );
    } catch (e) {
      cdDetails = {
        ...cds[index],
        title: cdData.album,
        artist: cdData.artist,
        genre: cdData.genre,
      };
    }
  } else {
    cdDetails = {
      ...cds[index],
      title: cdData.album,
      artist: cdData.artist,
      genre: cdData.genre,
    };
  }
  if (!cdDetails.tracks || cdDetails.tracks.length === 0) {
    cdDetails.tracks = Array.from({ length: cdData.tracksNumber }, (_, i) => ({
      number: i + 1,
      title: `Track ${i + 1}`,
    }));
  }

  cds[index] = cdDetails;
  writeJsonToFile(FILE_PATH, cds);
};

export const deleteCd = async (cdId: string) => {
  const data = await getCdCollection();
  const index = data.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }
  data.splice(index, 1);
  writeJsonToFile(FILE_PATH, data);
};
