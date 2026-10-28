import fs from "fs";
import path from "path";
import type { Art } from "../types";
import {
  imageUriForFileName,
  isProcessedFileName,
  processedFileName,
  processedThumbFileName,
  rawFileNameFromUri,
} from "./naming";

export type ResolveProcessedArtOptions = {
  /** Directory where the raw and processed images live. */
  imagesDir: string;
  /** Pipeline version to resolve. Defaults to the current version. */
  version?: number;
  /** Forces resolution off, regardless of the environment. */
  enabled?: boolean;
};

/**
 * Global kill switch. Setting `USE_PROCESSED_IMAGES=false` makes every read
 * fall back to the raw originals without deleting anything.
 */
export const areProcessedImagesEnabled = (): boolean => {
  const value = process.env.USE_PROCESSED_IMAGES;
  if (value === undefined) return true;
  return !["false", "0", "off", "no"].includes(value.trim().toLowerCase());
};

const isSafeFileName = (fileName: string): boolean =>
  fileName.length > 0 &&
  path.basename(fileName) === fileName &&
  !fileName.includes("..");

/**
 * Returns a copy of the artwork pointing at the processed variants when they
 * exist on disk, or the original artwork otherwise.
 *
 * The raw files are never referenced back or rewritten here: removing the
 * `processed-v*` files instantly restores the raw behaviour.
 */
export const resolveProcessedArt = (
  art: Art,
  options: ResolveProcessedArtOptions,
): Art => {
  if (options.enabled === false || !areProcessedImagesEnabled()) return art;

  const rawFileName = rawFileNameFromUri(art.uri);
  if (!rawFileName || isProcessedFileName(rawFileName)) return art;

  const largeFileName = processedFileName(rawFileName, options.version);
  if (!isSafeFileName(largeFileName)) return art;

  if (!fs.existsSync(path.join(options.imagesDir, largeFileName))) return art;

  const thumbFileName = processedThumbFileName(rawFileName, options.version);
  const hasThumb =
    isSafeFileName(thumbFileName) &&
    fs.existsSync(path.join(options.imagesDir, thumbFileName));

  return {
    ...art,
    uri: imageUriForFileName(largeFileName),
    uri150: hasThumb ? imageUriForFileName(thumbFileName) : art.uri150,
  };
};
