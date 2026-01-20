import { Client } from "disconnect";
import { Cd } from "../types";

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
      "Discogs authentication required. Set DISCOGS_USER_TOKEN or DISCOGS_CONSUMER_KEY/DISCOGS_CONSUMER_SECRET in .env.local",
    );
  }
};

const searchByBarCode = async (barcode: string): Promise<Cd | null> => {
  try {
    const dis = getDiscogsClient();
    const db = dis.database();

    // Buscar por código de barras
    const searchResults = await db.search({
      barcode: barcode,
      type: "release",
    });

    if (!searchResults.results || searchResults.results.length === 0) {
      return null;
    }

    // Obtener detalles del primer resultado
    const firstResult = searchResults.results[0];
    const release = await db.getRelease(firstResult.id);

    // Extraer información del artista
    const artist =
      release.artists && release.artists.length > 0
        ? release.artists[0].name
        : "Unknown Artist";

    // Extraer el título del álbum (remover el nombre del artista si está incluido)
    let albumTitle = release.title;
    if (albumTitle.includes(" - ")) {
      const parts = albumTitle.split(" - ");
      albumTitle = parts.length > 1 ? parts[1] : parts[0];
    }

    // Extraer género
    const genre =
      release.styles && release.styles.length > 0
        ? release.styles[0]
        : release.genres && release.genres.length > 0
          ? release.genres[0]
          : "Unknown";

    // Extraer tracks
    const tracks =
      release.tracklist?.map((track: any, index: number) => ({
        number: index + 1,
        title: track.title,
      })) || [];

    // Extraer imágenes - obtener la imagen principal
    const primaryImage = release.images?.find(
      (img: any) => img.type === "primary",
    );
    const firstImage = release.images?.[0]; // Fallback a la primera imagen si no hay primary

    // Usar la imagen principal o la primera disponible
    const albumImage = primaryImage || firstImage;

    const cd: Cd = {
      id: 0,
      title: albumTitle,
      artist: artist,
      year: release.year,
      genre: genre,
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

    return cd;
  } catch (error) {
    console.error(`Error searching by barcode: ${error}`);
    return null;
  }
};

export default searchByBarCode;
