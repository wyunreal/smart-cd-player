import fetchMatchesList from "./fetch-album-matches";
import fetchAlbumDetails from "./fetch-album-details";
import { Cd } from "./types";

const fetchAlbumData = async (
  cdidList: string[],
  seed: string
): Promise<Cd> => {
  if (cdidList.length === 0) {
    return Promise.reject("Empty cd id list");
  }
  return new Promise((resolve, reject) => {
    const cdid = cdidList.shift();
    fetchAlbumDetails(cdid || "", seed)
      .then((data) => {
        if (data.artist && data.title && data.tracks.length > 0) {
          resolve(data);
        } else if (cdidList.length > 0) {
          fetchAlbumData(cdidList, seed).then(resolve);
        } else {
          reject();
        }
      })
      .catch(() => fetchAlbumData(cdidList, seed).then(resolve));
  });
};

const fetchAlbum = async (
  artistName: string,
  albumName: string,
  trackCount: number
): Promise<Cd> => {
  return new Promise((resolve, reject) => {
    const seed = Math.round(Math.random() * 10000000).toString();
    fetchMatchesList(artistName, albumName, trackCount, seed)
      .then((matches) => {
        if (matches.length === 0) {
          reject(`No matches found for ${artistName} - ${albumName}`);
          return;
        }
        fetchAlbumData(
          matches.map((match) => match.cdid),
          seed
        )
          .then((data) => {
            if (data) {
              resolve(data);
            } else {
              reject(`No matches found for ${artistName} - ${albumName}`);
            }
          })
          .catch(reject);
      })
      .catch(reject);
  });
};

export default fetchAlbum;
