"use server";

import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Art, Cd, CdInputData } from "./types";
import { downloadImage } from "./file-storage";
import { getNextCdId, saveNextCdId } from "./db-metadata";

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const FILE_PATH = `${DATA_DIR}/cd-collection.json`;

const allocateCdId = (
  nextId: number,
  existingIds: Set<number>,
): { allocatedId: number; nextId: number } => {
  while (existingIds.has(nextId)) {
    nextId++;
  }
  return { allocatedId: nextId, nextId: nextId + 1 };
};

const readFile = async (): Promise<Cd[]> => {
  const data = await readJsonFromFile<Cd[]>(FILE_PATH);
  return data || [];
};

export const getCdCollection: () => Promise<Cd[]> = async () => {
  return await readFile();
};

export const addCd = async (cds: Cd[]): Promise<number[]> => {
  const data = await getCdCollection();
  const existingIds = new Set(data.map((cd) => cd.id));
  const maxId = data.length > 0 ? Math.max(...data.map((cd) => cd.id)) : 0;
  let nextId = await getNextCdId(maxId);

  for (let i = 0; i < cds.length; i++) {
    const { allocatedId: newId, nextId: updatedNextId } = allocateCdId(nextId, existingIds);
    existingIds.add(newId);
    nextId = updatedNextId;
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
  await writeJsonToFile<Cd[]>(FILE_PATH, [...data, ...cds]);
  await saveNextCdId(nextId);
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

const isExternalUrl = (uri: string) => uri.startsWith("http");

const downloadArtImages = async (
  art: Art | undefined,
  cdId: number,
  type: "album" | "artist" | "cd",
) => {
  if (!art?.uri || !isExternalUrl(art.uri)) return;

  const ext = art.uri.split(".").pop() || "jpg";
  const filename = `${cdId}-${type}.${ext}`;
  const filename150 = `${cdId}-${type}-150.${ext}`;

  await downloadImage(art.uri, filename);
  art.uri = `/api/images/${filename}`;

  if (art.uri150 && isExternalUrl(art.uri150)) {
    await downloadImage(art.uri150, filename150);
    art.uri150 = `/api/images/${filename150}`;
  }
};

export const migrateImages = async (): Promise<number> => {
  const cds = await getCdCollection();
  let migratedCount = 0;

  for (const cd of cds) {
    if (!cd.art) continue;

    const hasExternal = [cd.art.album, cd.art.artist, cd.art.cd].some(
      (art) => art?.uri && isExternalUrl(art.uri),
    );
    if (!hasExternal) continue;

    try {
      await downloadArtImages(cd.art.album, cd.id, "album");
      await downloadArtImages(cd.art.artist, cd.id, "artist");
      await downloadArtImages(cd.art.cd, cd.id, "cd");
      migratedCount++;
    } catch (error) {
      console.error(`Failed to migrate images for CD ${cd.id} (${cd.title}):`, error);
    }
  }

  await writeJsonToFile<Cd[]>(FILE_PATH, cds);
  return migratedCount;
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
