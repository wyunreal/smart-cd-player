import { AlbumArt, Cd, DiscogsSearchResult, Track } from "../types";
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
 * Selects which releases to use for building tracks.
 * 1. If any release has format "CD", filter to only CD-format releases.
 * 2. If there is only one release (after filtering), use it directly.
 * 3. Among remaining releases, prefer multi-disc releases if any exist.
 * 4. Group by track count and pick the group with the highest number of tracks.
 */
const selectReleasesForTracks = (
  cds: Cd[],
  expectedTrackCount?: number,
): Cd[] => {
  // Discard unofficial releases
  const officialOnly = cds.filter(
    (cd) =>
      !cd.formats?.some(
        (f) =>
          f.descriptions?.includes("Unofficial Release") ||
          f.descriptions?.includes("Unofficial"),
      ),
  );
  // If all are unofficial, keep them all
  const candidates = officialOnly.length > 0 ? officialOnly : cds;

  if (candidates.length <= 1) {
    return candidates;
  }

  // Step 0: If expected track count is provided, filter by it
  if (expectedTrackCount !== undefined) {
    const matching = candidates.filter(
      (cd) => cd.tracks.length === expectedTrackCount,
    );
    if (matching.length > 0) {
      return matching;
    }
  }

  // Step 1: Filter by CD format if any release has it
  const cdFormatReleases = candidates.filter((cd) =>
    cd.formats?.some((f) => f.name.toUpperCase() === "CD"),
  );
  let pool = cdFormatReleases.length > 0 ? cdFormatReleases : candidates;

  if (pool.length <= 1) {
    return pool;
  }

  // Step 2: Prefer multi-disc releases (tracks with cd > 1)
  const multiDiscCds = pool.filter((cd) =>
    cd.tracks.some((track) => track.cd && track.cd > 1),
  );

  pool = multiDiscCds.length > 0 ? multiDiscCds : pool;

  if (pool.length <= 1) {
    return pool;
  }

  // Step 3: Group by track count
  const groups = new Map<number, Cd[]>();
  for (const cd of pool) {
    const count = cd.tracks.length;
    const group = groups.get(count) || [];
    group.push(cd);
    groups.set(count, group);
  }

  // Pick the group with the highest track count
  let bestCount = 0;
  let bestGroup: Cd[] = [];
  for (const [count, group] of groups) {
    if (count > bestCount) {
      bestCount = count;
      bestGroup = group;
    }
  }

  return bestGroup;
};

/**
 * Calculates the consensus CD from a Discogs search result
 * by finding the most frequent value for each field across all CDs.
 * Track selection uses the release-grouping algorithm:
 * releases are grouped by track count, and the group with the most tracks is used.
 */
const calculateConsensusCd = (
  result: DiscogsSearchResult,
  expectedTrackCount?: number,
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

  // Select releases for track building using the grouping algorithm
  const selectedReleases = selectReleasesForTracks(
    result.cds,
    expectedTrackCount,
  );

  console.log(
    "Selected releases for tracks:",
    JSON.stringify(selectedReleases, null, 2),
  );

  // Track count is strictly the count from the selected releases (never more)
  const trackCount =
    selectedReleases.length > 0 ? selectedReleases[0].tracks.length : 0;

  // Build consensus tracks from the selected releases
  const consensusTracks: Track[] = [];

  for (let i = 0; i < trackCount; i++) {
    const trackNumbers = selectedReleases
      .map((cd) => cd.tracks[i]?.number)
      .filter((num): num is number => num !== undefined);

    const trackTitles = selectedReleases
      .map((cd) => cd.tracks[i]?.title)
      .filter((title): title is string => title !== undefined);

    const trackCds = selectedReleases
      .map((cd) => cd.tracks[i]?.cd)
      .filter((cdNum): cdNum is number => cdNum !== undefined);

    // Find duration from any selected release that has it for this track
    const trackDurations = selectedReleases
      .map((cd) => cd.tracks[i]?.duration)
      .filter((d): d is string => d !== undefined && d !== "");

    const consensusNumber = getMostFrequent(trackNumbers) || i + 1;
    const consensusTitle = getMostFrequent(trackTitles) || `Track ${i + 1}`;
    const consensusCd = getMostFrequent(trackCds) || 1;
    const consensusDuration = getMostFrequent(trackDurations) || undefined;

    consensusTracks.push({
      number: consensusNumber,
      title: consensusTitle,
      cd: consensusCd,
      ...(consensusDuration ? { duration: consensusDuration } : {}),
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
  expectedTrackCount?: number,
): Promise<DiscogsSearchResult> => {
  const searchResult = await searchDiscogsByBarcode(barcode);
  const result = calculateConsensusCd(searchResult, expectedTrackCount);
  return result.cd
    ? { ...result, cd: { ...result.cd, barCode: barcode } }
    : result;
};

export const getArtistPicturesByName = getDiscogsArtistPicturesByName;

// Exported for testing purposes only
export const _internal = {
  selectReleasesForTracks,
  calculateConsensusCd,
  getMostFrequent,
};
