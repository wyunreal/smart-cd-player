/**
 * Version of the image processing pipeline. It is part of every processed
 * filename, so bumping it invalidates all previously processed images and
 * makes the app fall back to the raw originals until they are regenerated.
 */
export const PROCESSING_VERSION = 1;

/** Prefix shared by every generated image. Raw files never use it. */
export const PROCESSED_FILE_PREFIX = "processed";

/** Maximum size (long edge for artists, square side for album/disc). */
export const LARGE_MAX_SIZE = 1000;

/** Thumbnail size used for `art.uri150`. */
export const THUMB_SIZE = 150;

/** Maximum long edge for artist pictures (kept uncropped). */
export const ARTIST_MAX_SIZE = 1200;

export const WEBP_QUALITY = 82;
export const THUMB_WEBP_QUALITY = 80;

/** Decompression-bomb guard for sharp. */
export const MAX_INPUT_PIXELS = 100_000_000;

/** Long edge used to run the disc detection. */
export const DETECT_MAX_SIZE = 512;

/** Minimum confidence to trust a detected disc circle. */
export const DISC_MIN_CONFIDENCE = 0.55;

/** Extra margin around the detected disc, as a ratio of its radius. */
export const DISC_CROP_MARGIN_RATIO = 0.01;

/** The disc is expected to cover at least this share of the short edge. */
export const MIN_DISC_RADIUS_RATIO = 0.26;

/** ...and at most this share (a disc scan usually touches the frame). */
export const MAX_DISC_RADIUS_RATIO = 0.52;
