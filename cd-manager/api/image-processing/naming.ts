import {
  PROCESSED_FILE_PREFIX,
  PROCESSING_VERSION,
  THUMB_SIZE,
} from "./constants";

const IMAGE_ROUTE_PREFIX = "/api/images/";

const PROCESSED_FILE_PATTERN = /^processed-v(\d+)-.+\.webp$/;

const hasUnsafePathCharacters = (value: string): boolean =>
  value.length === 0 ||
  value.includes("/") ||
  value.includes("\\") ||
  value.includes("..");

/**
 * `12-cd.jpg` -> `processed-v1-12-cd.jpg.webp`
 *
 * The raw filename is kept verbatim (including its original extension) so the
 * mapping raw -> processed is deterministic and cannot collide between files.
 */
export const processedFileName = (
  rawFileName: string,
  version: number = PROCESSING_VERSION,
): string => `${PROCESSED_FILE_PREFIX}-v${version}-${rawFileName}.webp`;

/** `12-cd.jpg` -> `processed-v1-12-cd.jpg-150.webp` */
export const processedThumbFileName = (
  rawFileName: string,
  version: number = PROCESSING_VERSION,
): string =>
  `${PROCESSED_FILE_PREFIX}-v${version}-${rawFileName}-${THUMB_SIZE}.webp`;

export const isProcessedFileName = (fileName: string): boolean =>
  PROCESSED_FILE_PATTERN.test(fileName);

export const processedVersionFromFileName = (
  fileName: string,
): number | null => {
  const match = fileName.match(PROCESSED_FILE_PATTERN);
  if (!match) return null;
  const version = Number.parseInt(match[1], 10);
  return Number.isFinite(version) ? version : null;
};

/**
 * Extracts the stored filename from a local image URI.
 * Returns null for external URLs (not downloaded yet) and unsafe names.
 */
export const rawFileNameFromUri = (uri: string): string | null => {
  if (!uri) return null;

  const pathname = uri.split("?")[0].split("#")[0];
  if (!pathname.startsWith(IMAGE_ROUTE_PREFIX)) return null;

  const encodedName = pathname.slice(IMAGE_ROUTE_PREFIX.length);
  let fileName: string;
  try {
    fileName = decodeURIComponent(encodedName);
  } catch {
    return null;
  }

  return hasUnsafePathCharacters(fileName) ? null : fileName;
};

export const imageUriForFileName = (fileName: string): string =>
  `${IMAGE_ROUTE_PREFIX}${encodeURIComponent(fileName)}`;
