"use server";

import fs from "fs";
import { readJsonFromFile, writeJsonToFile } from "./json-storage";
import { Art, Cd, CdInputData } from "./types";
import { downloadImage, FILES_DIR, saveProcessedImage } from "./file-storage";
import { getNextCdId, saveNextCdId } from "./db-metadata";
import { resolveProcessedArt } from "./image-processing/resolve";
import { normalizeArt } from "./image-processing/normalize";
import {
  processedFileName,
  processedThumbFileName,
} from "./image-processing/naming";

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

/**
 * Returns the artwork pointing at the processed variants when they exist.
 * The collection file always keeps the raw URIs, so removing the processed
 * files (or setting USE_PROCESSED_IMAGES=false) restores the raw behaviour
 * without touching the database.
 */
const withProcessedArtwork = (cd: Cd): Cd => {
  if (!cd.art) return cd;

  return {
    ...cd,
    art: {
      ...cd.art,
      album: cd.art.album
        ? resolveProcessedArt(cd.art.album, { imagesDir: FILES_DIR })
        : cd.art.album,
      artist: cd.art.artist
        ? resolveProcessedArt(cd.art.artist, { imagesDir: FILES_DIR })
        : cd.art.artist,
      cd: cd.art.cd
        ? resolveProcessedArt(cd.art.cd, { imagesDir: FILES_DIR })
        : cd.art.cd,
    },
  };
};

export const getCdCollection: () => Promise<Cd[]> = async () => {
  const data = await readFile();
  return data.map(withProcessedArtwork);
};

export const addCd = async (cds: Cd[]): Promise<number[]> => {
  // Writers must always start from the raw database, never from the resolved
  // view, otherwise the processed URIs would be persisted permanently.
  const data = await readFile();
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

          // Keep the raw file untouched and generate the two processed
          // variants next to it. If processing fails, the app falls back to
          // the raw image, so the CD can still be added.
          downloadPromises.push(
            downloadImage(`${art.uri}`, filename).then(async (rawPath) => {
              try {
                const input = await fs.promises.readFile(rawPath);
                const processed = await normalizeArt(input, type);

                await saveProcessedImage(
                  processed.large.buffer,
                  processedFileName(filename),
                );
                await saveProcessedImage(
                  processed.thumb.buffer,
                  processedThumbFileName(filename),
                );
              } catch (error) {
                console.warn(
                  `Failed to process ${filename}; falling back to the raw image`,
                  error,
                );
              }
            }),
          );

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
  const cds = await readFile();
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
  const data = await readFile();
  const index = data.findIndex((cd) => cd.id === cdId);
  if (index === -1) {
    throw new Error(`CD with id ${cdId} not found`);
  }
  data.splice(index, 1);
  writeJsonToFile<Cd[]>(FILE_PATH, data);
};
