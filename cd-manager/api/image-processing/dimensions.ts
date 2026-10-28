import type { Metadata } from "sharp";

export type ImageSize = {
  width: number;
  height: number;
};

/**
 * Returns the image dimensions after applying the EXIF orientation, which is
 * what sharp produces after `rotate()`.
 */
export const orientedSize = (metadata: Metadata): ImageSize | null => {
  if (!metadata.width || !metadata.height) return null;

  const orientation = metadata.orientation ?? 1;
  const swapsAxes = orientation >= 5 && orientation <= 8;

  return swapsAxes
    ? { width: metadata.height, height: metadata.width }
    : { width: metadata.width, height: metadata.height };
};
