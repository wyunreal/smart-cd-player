import {
  Client,
  SearchResults,
  Release,
  SearchResult,
  Track as DiscogsTrack,
  Image,
  Artist as DiscogsArtist,
} from "disconnect";
import { Art, ArtistPicturesResult, DiscogsSearchResult } from "../types";

const MAX_ARTIST_PICTURES_AMOUNT = 24;

const getDiscogsClient = () => {
  const userToken = process.env.DISCOGS_USER_TOKEN;
  const consumerKey = process.env.DISCOGS_CONSUMER_KEY;
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET;

  if (userToken) {
    return new Client("SmartCDPlayer/1.0", { userToken });
  } else if (consumerKey && consumerSecret) {
    return new Client("SmartCDPlayer/1.0", { consumerKey, consumerSecret });
  } else {
    throw new Error(
      "Discogs authentication required. Pass DISCOGS_USER_TOKEN or DISCOGS_CONSUMER_KEY/DISCOGS_CONSUMER_SECRET in env vars",
    );
  }
};

const DISCOGS_TIMEOUT = 10000; // 10 seconds timeout

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Discogs API request timeout")),
        timeoutMs,
      ),
    ),
  ]);
};

const searchByBarCode = async (
  barcode: string,
): Promise<DiscogsSearchResult> => {
  try {
    const dis = getDiscogsClient();
    const db = dis.database();

    let rateLimit: { limit: number; remaining: number } | undefined;

    const searchResults = await withTimeout(
      new Promise<SearchResults>((resolve, reject) => {
        db.search(
          {
            barcode: barcode,
            type: "release",
          },
          (err, data, rateLimitInfo) => {
            if (err) {
              // Check if error is rate limit related
              const errorMessage = err.message || String(err);
              if (
                errorMessage.includes("rate limit") ||
                errorMessage.includes("429")
              ) {
                reject(
                  new Error(`Discogs API rate limit exceeded: ${errorMessage}`),
                );
              } else {
                reject(err);
              }
            } else {
              if (rateLimitInfo) {
                rateLimit = rateLimitInfo;
              }
              resolve(data);
            }
          },
        );
      }),
      DISCOGS_TIMEOUT,
    );

    if (!searchResults.results || searchResults.results.length === 0) {
      return { cds: [], rateLimit };
    }

    const cdPromises = searchResults.results.map(
      async (result: SearchResult) => {
        try {
          const release = await withTimeout(
            new Promise<Release>((resolve, reject) => {
              db.getRelease(result.id, (err, data, rateLimitInfo) => {
                if (err) {
                  // Check if error is rate limit related
                  const errorMessage = err.message || String(err);
                  if (
                    errorMessage.includes("rate limit") ||
                    errorMessage.includes("429")
                  ) {
                    reject(
                      new Error(
                        `Discogs API rate limit exceeded: ${errorMessage}`,
                      ),
                    );
                  } else {
                    reject(err);
                  }
                } else {
                  if (rateLimitInfo) {
                    rateLimit = rateLimitInfo;
                  }
                  resolve(data);
                }
              });
            }),
            DISCOGS_TIMEOUT,
          );

          const artist =
            release.artists && release.artists.length > 0
              ? release.artists[0].name
              : "Unknown Artist";

          // Remove artist name from title if included
          let albumTitle = release.title;
          if (albumTitle.includes(" - ")) {
            const parts = albumTitle.split(" - ");
            albumTitle = parts.length > 1 ? parts[1] : parts[0];
          }

          const genre =
            release.styles && release.styles.length > 0
              ? release.styles[0]
              : release.genres && release.genres.length > 0
                ? release.genres[0]
                : "Unknown";

          const genres = release.genres || [];
          const styles = release.styles || [];

          // Matches "1-01", "2-03" and also "CD1-1", "Cd2-3", "cd1-01"
          const multiDiscPattern = /^(?:cd)?(\d+)[-–](\d+)$/i;

          const parsedTracks =
            release.tracklist?.map((track: DiscogsTrack) => {
              const match =
                typeof track.position === "string"
                  ? track.position.match(multiDiscPattern)
                  : null;
              return {
                position: track.position,
                isMultiDisc: !!match,
                cdNumber: match ? parseInt(match[1], 10) : 1,
                title: track.title,
                duration: track.duration || undefined,
              };
            }) || [];

          // If any track has multi-disc format, filter out tracks that don't
          const hasMultiDisc = parsedTracks.some((t) => t.isMultiDisc);
          let filteredTracks = hasMultiDisc
            ? parsedTracks.filter((t) => t.isMultiDisc)
            : parsedTracks;

          // For non-multi-disc: if some tracks have duration, discard those without
          if (!hasMultiDisc) {
            const hasSomeDuration = filteredTracks.some((t) => t.duration);
            if (hasSomeDuration) {
              filteredTracks = filteredTracks.filter((t) => t.duration);
            }
          }

          const tracks = filteredTracks.map((t, index) => ({
            number: index + 1,
            cd: t.cdNumber,
            title: t.title,
            duration: t.duration,
          }));

          const primaryImage = release.images?.find(
            (img: Image) => img.type === "primary",
          );
          const firstImage = release.images?.[0];

          const albumImage = primaryImage || firstImage;

          return {
            id: 0,
            title: albumTitle,
            artist: artist,
            year: release.year,
            genre: genre,
            genres: genres,
            styles: styles,
            tracks: tracks,
            formats: release.formats?.map((f) => ({
              name: f.name,
              qty: f.qty,
              descriptions: f.descriptions,
            })),
            art: albumImage
              ? {
                  album: albumImage,
                  allImages:
                    release.images?.map((img: Image) => ({
                      uri: img.uri,
                      uri150: img.uri150,
                      width: img.width,
                      height: img.height,
                      type: img.type,
                    })) || [],
                }
              : undefined,
          };
        } catch (error) {
          // Check if it's a rate limit error and propagate it
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes("rate limit") ||
            errorMessage.includes("429")
          ) {
            throw error; // Re-throw rate limit errors
          }
          // For other errors, return null to skip this release
          return null;
        }
      },
    );

    const results = await Promise.all(cdPromises);
    const cds = results.filter((cd) => cd !== null);

    return { cds, rateLimit };
  } catch (error) {
    throw new Error(`Error fetching data from Discogs: ${error}`);
  }
};

const getArtistPicturesByName = async (
  artistName: string,
): Promise<ArtistPicturesResult | null> => {
  try {
    const dis = getDiscogsClient();
    const db = dis.database();

    let rateLimit: { limit: number; remaining: number } | undefined;

    // Search for the artist by name
    const searchResults = await withTimeout(
      new Promise<SearchResults>((resolve, reject) => {
        db.search(
          {
            query: artistName,
            type: "artist",
          },
          (err, data, rateLimitInfo) => {
            if (err) {
              const errorMessage = err.message || String(err);
              if (
                errorMessage.includes("rate limit") ||
                errorMessage.includes("429")
              ) {
                reject(
                  new Error(`Discogs API rate limit exceeded: ${errorMessage}`),
                );
              } else {
                reject(err);
              }
            } else {
              if (rateLimitInfo) {
                rateLimit = rateLimitInfo;
              }
              resolve(data);
            }
          },
        );
      }),
      DISCOGS_TIMEOUT,
    );

    if (!searchResults.results || searchResults.results.length === 0) {
      return null;
    }

    // Get the first artist result
    const artistResult = searchResults.results[0];
    const artistId = artistResult.id;

    // Build a fallback image from search result thumbnail if available
    const fallbackImages: Art[] = artistResult.thumb
      ? [
          {
            uri: artistResult.cover_image || artistResult.thumb,
            uri150: artistResult.thumb,
            width: 150,
            height: 150,
            type: "primary",
          },
        ]
      : [];

    // Check if we have enough rate limit remaining for another call
    if (rateLimit && rateLimit.remaining <= 1) {
      console.warn(
        `Discogs rate limit nearly exhausted (${rateLimit.remaining}/${rateLimit.limit}). Returning fallback images.`,
      );
      return {
        artistId: artistId,
        artistName: artistResult.title,
        images: fallbackImages,
        rateLimit,
      };
    }

    // Get full artist details including images
    let artistDetails: DiscogsArtist | null = null;
    try {
      artistDetails = await withTimeout(
        new Promise<DiscogsArtist | null>((resolve, reject) => {
          db.getArtist(artistId, (err, data, rateLimitInfo) => {
            if (err) {
              const errorMessage = err.message || String(err);
              if (
                errorMessage.includes("rate limit") ||
                errorMessage.includes("429")
              ) {
                // Don't reject, just resolve with null to use fallback
                console.warn(
                  `Discogs rate limit hit on getArtist: ${errorMessage}`,
                );
                resolve(null);
              } else {
                reject(err);
              }
            } else {
              if (rateLimitInfo) {
                rateLimit = rateLimitInfo;
              }
              resolve(data);
            }
          });
        }),
        DISCOGS_TIMEOUT,
      );
    } catch {
      console.warn(`Timeout getting artist details, using fallback images`);
      artistDetails = null;
    }

    // If we couldn't get artist details, return fallback
    if (!artistDetails) {
      return {
        artistId: artistId,
        artistName: artistResult.title,
        images: fallbackImages,
        rateLimit,
      };
    }

    const images: Art[] =
      artistDetails.images
        ?.slice(0, MAX_ARTIST_PICTURES_AMOUNT)
        .map((img: Image) => ({
          uri: img.uri,
          uri150: img.uri150,
          width: img.width,
          height: img.height,
          type: img.type,
        })) || [];

    return {
      artistId: artistDetails.id,
      artistName: artistDetails.name,
      images: images.length > 0 ? images : fallbackImages,
      rateLimit,
    };
  } catch (error) {
    throw new Error(`Error fetching artist pictures from Discogs: ${error}`);
  }
};

export { searchByBarCode, getArtistPicturesByName };
