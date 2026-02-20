"use server";

import { readJsonFromFile, writeJsonToFile } from "./json-storage";

const DATA_DIR = process.env.DATA_DIR || "../data/db";
const METADATA_PATH = `${DATA_DIR}/db-metadata.json`;

interface DbMetadata {
  nextCdId: number;
}

const readMetadata = async (): Promise<DbMetadata> => {
  return (await readJsonFromFile<DbMetadata>(METADATA_PATH)) || ({} as DbMetadata);
};

const writeMetadata = async (metadata: DbMetadata): Promise<void> => {
  await writeJsonToFile<DbMetadata>(METADATA_PATH, metadata);
};

export const getNextCdId = async (fallbackMaxId: number): Promise<number> => {
  const metadata = await readMetadata();
  if (metadata.nextCdId != null) {
    return metadata.nextCdId;
  }
  const nextId = fallbackMaxId + 1;
  await writeMetadata({ ...metadata, nextCdId: nextId });
  return nextId;
};

export const saveNextCdId = async (nextCdId: number): Promise<void> => {
  const metadata = await readMetadata();
  metadata.nextCdId = nextCdId;
  await writeMetadata(metadata);
};
