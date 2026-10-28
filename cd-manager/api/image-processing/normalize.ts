import sharp from "sharp";
import {
  ARTIST_MAX_SIZE,
  LARGE_MAX_SIZE,
  MAX_INPUT_PIXELS,
  THUMB_SIZE,
  THUMB_WEBP_QUALITY,
  WEBP_QUALITY,
} from "./constants";
import { cropToDisc, type DiscCropInfo } from "./crop-disc";
import { orientedSize } from "./dimensions";

export type ArtKind = "cd" | "album" | "artist";

export type ProcessedVariant = {
  buffer: Buffer;
  width: number;
  height: number;
};

export type ProcessedArtwork = {
  large: ProcessedVariant;
  thumb: ProcessedVariant;
  /** Only present for `cd` artwork. */
  disc?: DiscCropInfo;
};

const ART_KINDS: readonly ArtKind[] = ["cd", "album", "artist"];

export const isArtKind = (value: string): value is ArtKind =>
  (ART_KINDS as readonly string[]).includes(value);

const createPipeline = (input: Buffer) =>
  sharp(input, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  });

const encodeWebp = async (
  pipeline: sharp.Sharp,
  quality: number,
): Promise<ProcessedVariant> => {
  const encoded = await pipeline
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: encoded.data,
    width: encoded.info.width,
    height: encoded.info.height,
  };
};

/**
 * Thumbnails are always derived from the processed large image so they show
 * exactly the same crop. They are allowed to be enlarged to keep the layout
 * consistent even when the source is tiny.
 */
const createThumbnail = async (large: Buffer): Promise<ProcessedVariant> =>
  encodeWebp(
    sharp(large).resize({
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      fit: "cover",
      position: "centre",
    }),
    THUMB_WEBP_QUALITY,
  );

const requireSize = async (input: Buffer) => {
  const metadata = await createPipeline(input).metadata();
  const size = orientedSize(metadata);

  if (!size || size.width < 1 || size.height < 1) {
    throw new Error("Image has no valid dimensions");
  }

  return size;
};

const normalizeAlbum = async (input: Buffer): Promise<ProcessedVariant> => {
  const size = await requireSize(input);
  const side = Math.max(
    1,
    Math.min(LARGE_MAX_SIZE, size.width, size.height),
  );

  return encodeWebp(
    createPipeline(input).rotate().resize({
      width: side,
      height: side,
      fit: "cover",
      position: "centre",
    }),
    WEBP_QUALITY,
  );
};

const normalizeArtist = async (input: Buffer): Promise<ProcessedVariant> => {
  const size = await requireSize(input);
  const longestEdge = Math.max(size.width, size.height);
  const scale = Math.min(1, ARTIST_MAX_SIZE / longestEdge);

  const width = Math.max(1, Math.round(size.width * scale));
  const height = Math.max(1, Math.round(size.height * scale));

  return encodeWebp(
    createPipeline(input).rotate().resize({
      width,
      height,
      fit: "fill",
    }),
    WEBP_QUALITY,
  );
};

/**
 * Normalizes and optimizes an artwork image for the web.
 *
 * - `cd`: crops to the detected outer disc circle (centred) and encodes WebP.
 * - `album`: square cover crop, capped at LARGE_MAX_SIZE.
 * - `artist`: keeps the aspect ratio, capped at ARTIST_MAX_SIZE.
 *
 * Metadata (EXIF/XMP/ICC) is stripped, EXIF orientation is applied, and no
 * variant is upscaled except the 150px thumbnail.
 */
export const normalizeArt = async (
  input: Buffer,
  kind: ArtKind,
): Promise<ProcessedArtwork> => {
  if (kind === "cd") {
    const cropped = await cropToDisc(input);
    const thumb = await createThumbnail(cropped.buffer);

    return {
      large: {
        buffer: cropped.buffer,
        width: cropped.width,
        height: cropped.height,
      },
      thumb,
      disc: cropped.disc,
    };
  }

  const large =
    kind === "album"
      ? await normalizeAlbum(input)
      : await normalizeArtist(input);
  const thumb = await createThumbnail(large.buffer);

  return { large, thumb };
};
