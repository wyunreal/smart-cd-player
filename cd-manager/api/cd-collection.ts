"use server";

import fetchAlbum from "./fetch-album";
import { fetchAlbumArt } from "./fetch-album-details";
import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Cd, CdInputData } from "./types";

const FILE_PATH = "data/cd-collection.json";

const readFile = async () => readJsonFromFile(FILE_PATH) || [];

export const getCdCollection: () => Promise<Cd[]> = async () => {
  return await readFile();
};

export const addCd = async (cdData: CdInputData) => {
  let cdDetails: Cd;
  try {
    cdDetails = await fetchAlbum(
      cdData.artist,
      cdData.album,
      cdData.tracksNumber
    );
  } catch (e) {
    cdDetails = {
      id: "0",
      title: cdData.album,
      artist: cdData.artist,
      genre: cdData.genre,
      tracks: Array.from({ length: cdData.tracksNumber }, (_, i) => ({
        number: i + 1,
        title: `Track ${i + 1}`,
      })),
    };
    try {
      const art = await fetchAlbumArt(cdData.artist, cdData.album);
      cdDetails.art = art;
    } catch (e) {}
  }

  const data = await getCdCollection();
  const lastRowId = Number(data[data.length - 1]?.id);
  cdDetails.id = (lastRowId ? lastRowId + 1 : 1).toString();
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
  if (!cdDetails.art) {
    try {
      const art = await fetchAlbumArt(cdData.artist, cdData.album);
      cdDetails.art = art;
    } catch (e) {}
  }

  cdDetails.id = cdId;
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
