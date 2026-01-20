import { Client } from "disconnect";
import { Cd, DiscogsSearchResult } from "../types";

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

const searchByBarCode = async (barcode: string): Promise<DiscogsSearchResult> => {
  try {
    const dis = getDiscogsClient();
    const db = dis.database();

    let rateLimit: { limit: number; remaining: number } | undefined;

    const searchResults = await new Promise<any>((resolve, reject) => {
      db.search(
        {
          barcode: barcode,
          type: "release",
        },
        (err, data, rateLimitInfo) => {
          if (err) {
            reject(err);
          } else {
            if (rateLimitInfo) {
              rateLimit = rateLimitInfo;
            }
            resolve(data);
          }
        }
      );
    });

    if (!searchResults.results || searchResults.results.length === 0) {
      return { cds: [], rateLimit };
    }

    const cdPromises = searchResults.results.map(async (result: any) => {
      try {
        const release = await new Promise<any>((resolve, reject) => {
          db.getRelease(result.id, (err, data, rateLimitInfo) => {
            if (err) {
              reject(err);
            } else {
              if (rateLimitInfo) {
                rateLimit = rateLimitInfo;
              }
              resolve(data);
            }
          });
        });

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
                albumBig: albumImage.uri,
                albumSmall: albumImage.uri150 || albumImage.uri,
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

export default searchByBarCode;
