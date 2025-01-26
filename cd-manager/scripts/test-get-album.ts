import { getGnuDbSeed } from "@/api/config";
import fetchAlbum from "../api/fetch-album";

const [, , artist, album, tracks] = process.argv;

const fetchAlbumData = async (
  artist: string,
  album: string,
  tracks: number
) => {
  const userSeed = await getGnuDbSeed();
  try {
    const albumData = await fetchAlbum(
      artist,
      album,
      Number(tracks),
      userSeed,
      true
    );
    console.log(albumData);
  } catch (error) {
    console.error(error);
  }
};

await fetchAlbumData(artist, album, Number(tracks));
