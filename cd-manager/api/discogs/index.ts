import { AlbumArt, Cd, DiscogsSearchResult } from "../types";
import {
  searchByBarCode as searchDiscogsByBarcode,
  getArtistPicturesByName as getDiscogsArtistPicturesByName,
} from "./client";

/**
 * Finds the most frequent value in an array
 * Ignores empty strings and zeros
 */
const getMostFrequent = <T>(arr: T[]): T | null => {
  // Filter out empty strings and zeros
  const filtered = arr.filter(
    (item) => item !== "" && item !== 0 && item !== null && item !== undefined,
  );

  if (filtered.length === 0) return null;

  const frequency = new Map<T, number>();
  let maxCount = 0;
  let mostFrequent: T | null = null;

  for (const item of filtered) {
    const count = (frequency.get(item) || 0) + 1;
    frequency.set(item, count);

    if (count > maxCount) {
      maxCount = count;
      mostFrequent = item;
    }
  }

  return mostFrequent;
};

/**
 * Calculates the aspect ratio score (closer to 1 = more square)
 * Returns a value between 0 and 1, where 1 is a perfect square
 */
const getSquarenessScore = (width: number, height: number): number => {
  if (width === 0 || height === 0) return 0;
  const ratio = width / height;
  return ratio > 1 ? 1 / ratio : ratio;
};

/**
 * Minimum squareness threshold to consider an image "reasonably square"
 * 0.85 allows aspect ratios roughly between 1:1.18 and 1.18:1
 */
const MIN_SQUARENESS_THRESHOLD = 0.85;

/**
 * Finds the best art from all CDs
 * Prioritizes:
 * 1. Primary images (album covers, not CD photos)
 * 2. Highest resolution among reasonably square images
 * Falls back to most square image if none meet the threshold
 */
const getBestArt = (cds: Cd[]): AlbumArt | undefined => {
  type ImageCandidate = {
    image: {
      uri: string;
      uri150: string;
      width: number;
      height: number;
      type: string;
    };
    allImages: AlbumArt["allImages"];
    squareness: number;
    resolution: number;
    isPrimary: boolean;
  };

  const candidates: ImageCandidate[] = [];

  for (const cd of cds) {
    if (!cd.art?.allImages) continue;

    for (const image of cd.art.allImages) {
      candidates.push({
        image,
        allImages: cd.art.allImages,
        squareness: getSquarenessScore(image.width, image.height),
        resolution: image.width * image.height,
        isPrimary: image.type === "primary",
      });
    }
  }

  if (candidates.length === 0) return undefined;

  // First, try to find primary images that are reasonably square
  const primarySquare = candidates.filter(
    (c) => c.isPrimary && c.squareness >= MIN_SQUARENESS_THRESHOLD,
  );

  // If no primary square images, try any primary image
  const primaryAny = candidates.filter((c) => c.isPrimary);

  // If no primary images, fall back to any reasonably square image
  const squareEnough = candidates.filter(
    (c) => c.squareness >= MIN_SQUARENESS_THRESHOLD,
  );

  // Choose the best candidate from the first non-empty group
  const pool =
    primarySquare.length > 0
      ? primarySquare
      : primaryAny.length > 0
        ? primaryAny
        : squareEnough.length > 0
          ? squareEnough
          : candidates;

  // From the chosen pool, pick the highest resolution
  const best = pool.reduce((a, b) => (a.resolution > b.resolution ? a : b));

  return {
    album: best.image,
    allImages: best.allImages,
  };
};

/**
 * Calculates the consensus CD from a Discogs search result
 * by finding the most frequent value for each field across all CDs
 * Excludes 'art' and 'id' fields
 */
const calculateConsensusCd = (
  result: DiscogsSearchResult,
): DiscogsSearchResult => {
  if (result.cds.length === 0) {
    return result;
  }

  // Extract most frequent values for simple fields
  const titles = result.cds.map((cd) => cd.title);
  const artists = result.cds.map((cd) => cd.artist);
  const years = result.cds
    .map((cd) => cd.year)
    .filter((year): year is number => year !== undefined);
  const genres = result.cds.map((cd) => cd.genre);

  // For genres array - get all genres from all CDs
  const allGenres = result.cds
    .flatMap((cd) => cd.genres || [])
    .filter((g): g is string => g !== undefined);

  // For styles array - get all styles from all CDs
  const allStyles = result.cds
    .flatMap((cd) => cd.styles || [])
    .filter((s): s is string => s !== undefined);

  // For tracks - find consensus tracks at each position
  const maxTracksCount = Math.max(...result.cds.map((cd) => cd.tracks.length));
  const consensusTracks: Array<{ number: number; title: string }> = [];

  for (let i = 0; i < maxTracksCount; i++) {
    const trackNumbers = result.cds
      .map((cd) => cd.tracks[i]?.number)
      .filter((num): num is number => num !== undefined);

    const trackTitles = result.cds
      .map((cd) => cd.tracks[i]?.title)
      .filter((title): title is string => title !== undefined);

    const consensusNumber = getMostFrequent(trackNumbers) || i + 1;
    const consensusTitle = getMostFrequent(trackTitles) || `Track ${i + 1}`;

    consensusTracks.push({
      number: consensusNumber,
      title: consensusTitle,
    });
  }

  // Build the consensus CD
  const consensusCd: Cd = {
    id: 0, // Placeholder ID
    title: getMostFrequent(titles) || "",
    artist: getMostFrequent(artists) || "",
    year: getMostFrequent(years) ?? undefined,
    genre: getMostFrequent(genres) || "",
    genres: allGenres.length > 0 ? [...new Set(allGenres)] : undefined,
    styles: allStyles.length > 0 ? [...new Set(allStyles)] : undefined,
    tracks: consensusTracks,
    art: getBestArt(result.cds),
  };

  // Return the result with the consensus CD
  return {
    ...result,
    cd: consensusCd,
  };
};

export const searchByBarCode = async (
  barcode: string,
): Promise<DiscogsSearchResult> => {
  const searchResult = await searchDiscogsByBarcode(barcode);
  const result = calculateConsensusCd(searchResult);
  return result.cd
    ? { ...result, cd: { ...result.cd, barCode: barcode } }
    : result;
};

export const getArtistPicturesByName = getDiscogsArtistPicturesByName;
