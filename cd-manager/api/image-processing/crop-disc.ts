import sharp from "sharp";
import {
  DETECT_MAX_SIZE,
  DISC_CROP_MARGIN_RATIO,
  DISC_MIN_CONFIDENCE,
  LARGE_MAX_SIZE,
  MAX_INPUT_PIXELS,
  WEBP_QUALITY,
} from "./constants";
import { detectDisc } from "./detect-disc";
import { orientedSize } from "./dimensions";

export type DiscCropInfo = {
  /** Detected centre in the oriented source image. */
  cx: number;
  cy: number;
  /** Detected outer radius in the oriented source image. */
  r: number;
  confidence: number;
  /** False when the circle could not be trusted and a centre crop was used. */
  detected: boolean;
};

export type DiscCropResult = {
  /** Encoded WebP with the disc centred and the outer circle inscribed. */
  buffer: Buffer;
  width: number;
  height: number;
  disc: DiscCropInfo;
};

const createPipeline = (input: Buffer) =>
  sharp(input, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  });

/**
 * Crops the source to the square that circumscribes the CD's outer circle, so
 * the disc centre lands exactly at the centre of the output and the disc can
 * spin without orbiting.
 *
 * If the circle cannot be detected reliably, falls back to a centred square
 * crop and reports `disc.detected = false` so the caller can flag it.
 */
export const cropToDisc = async (input: Buffer): Promise<DiscCropResult> => {
  const metadata = await createPipeline(input).metadata();
  const size = orientedSize(metadata);

  if (!size || size.width < 8 || size.height < 8) {
    throw new Error("Image has no valid dimensions");
  }

  const sourceWidth = size.width;
  const sourceHeight = size.height;

  const detection = await createPipeline(input)
    .rotate()
    .resize({
      width: DETECT_MAX_SIZE,
      height: DETECT_MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (detection.info.channels !== 1) {
    throw new Error("Unexpected channel count in disc detection image");
  }

  const detected = detectDisc({
    data: detection.data,
    width: detection.info.width,
    height: detection.info.height,
  });

  const scaleX = sourceWidth / detection.info.width;
  const scaleY = sourceHeight / detection.info.height;
  const scale = (scaleX + scaleY) / 2;
  const isDetected = detected.confidence >= DISC_MIN_CONFIDENCE;

  let left: number;
  let top: number;
  let cropSize: number;
  let disc: DiscCropInfo;

  if (isDetected) {
    const radius = detected.r * scale;
    const margin = radius * DISC_CROP_MARGIN_RATIO;

    cropSize = Math.max(2, Math.round((radius + margin) * 2));
    left = Math.round(detected.cx * scaleX - cropSize / 2);
    top = Math.round(detected.cy * scaleY - cropSize / 2);

    disc = {
      cx: detected.cx * scaleX,
      cy: detected.cy * scaleY,
      r: radius,
      confidence: detected.confidence,
      detected: true,
    };
  } else {
    cropSize = Math.max(2, Math.round(Math.min(sourceWidth, sourceHeight) * 0.98));
    left = Math.round((sourceWidth - cropSize) / 2);
    top = Math.round((sourceHeight - cropSize) / 2);

    disc = {
      cx: sourceWidth / 2,
      cy: sourceHeight / 2,
      r: cropSize / 2,
      confidence: detected.confidence,
      detected: false,
    };
  }

  // A photo may cut the disc slightly at the edges. Pad with transparency
  // instead of failing the extract. Sharp applies extract before extend, so
  // padding needs its own pass.
  const padding = Math.max(
    0,
    -left,
    -top,
    left + cropSize - sourceWidth,
    top + cropSize - sourceHeight,
  );

  let pipeline: sharp.Sharp;

  if (padding > 0) {
    const padded = await createPipeline(input)
      .rotate()
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    pipeline = sharp(padded, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
    });
  } else {
    pipeline = createPipeline(input).rotate();
  }

  const outputSize = Math.min(LARGE_MAX_SIZE, cropSize);

  const encoded = await pipeline
    .extract({
      left: left + padding,
      top: top + padding,
      width: cropSize,
      height: cropSize,
    })
    .resize({ width: outputSize, height: outputSize, fit: "fill" })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: encoded.data,
    width: encoded.info.width,
    height: encoded.info.height,
    disc,
  };
};
