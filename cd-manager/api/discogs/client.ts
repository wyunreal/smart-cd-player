import { Client } from "disconnect";
import { Art, ArtistPicturesResult, Cd, DiscogsSearchResult } from "../types";

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
      new Promise<any>((resolve, reject) => {
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

    const cdPromises = searchResults.results.map(async (result: any) => {
      try {
        const release = await withTimeout(
          new Promise<any>((resolve, reject) => {
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

        const tracks =
          release.tracklist?.map((track: any, index: number) => ({
            number: index + 1,
            title: track.title,
          })) || [];

        const primaryImage = release.images?.find(
          (img: any) => img.type === "primary",
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
          art: albumImage
            ? {
                album: albumImage,
                allImages:
                  release.images?.map((img: any) => ({
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
    });

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
      new Promise<any>((resolve, reject) => {
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

    // Get full artist details including images
    const artistDetails = await withTimeout(
      new Promise<any>((resolve, reject) => {
        db.getArtist(artistId, (err, data, rateLimitInfo) => {
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
        });
      }),
      DISCOGS_TIMEOUT,
    );

    const images: Art[] =
      artistDetails.images
        ?.slice(0, MAX_ARTIST_PICTURES_AMOUNT)
        .map((img: any) => ({
          uri: img.uri,
          uri150: img.uri150,
          width: img.width,
          height: img.height,
          type: img.type,
        })) || [];

    return {
      artistId: artistDetails.id,
      artistName: artistDetails.name,
      images,
      rateLimit,
    };
  } catch (error) {
    throw new Error(`Error fetching artist pictures from Discogs: ${error}`);
  }
};

export { searchByBarCode, getArtistPicturesByName };
