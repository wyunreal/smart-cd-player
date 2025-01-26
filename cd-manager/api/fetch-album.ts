import fetchMatchesList from "./fetch-album-matches";
import fetchAlbumDetails from "./fetch-album-details";
import { Cd } from "./types";

const fetchAlbumData = async (
  cdidList: string[],
  userSeed: string,
  debug: boolean
): Promise<Cd> => {
  if (cdidList.length === 0) {
    return Promise.reject("Empty cd id list");
  }
  return new Promise((resolve, reject) => {
    const cdid = cdidList.shift();
    fetchAlbumDetails(cdid || "", userSeed, debug)
      .then((data) => {
        if (data.artist && data.title && data.tracks.length > 0) {
          resolve(data);
        } else if (cdidList.length > 0) {
          fetchAlbumData(cdidList, userSeed, debug).then(resolve);
        } else {
          reject();
        }
      })
      .catch(() => fetchAlbumData(cdidList, userSeed, debug).then(resolve));
  });
};

const fetchAlbum = async (
  artistName: string,
  albumName: string,
  trackCount: number,
  userSeed: string,
  debug?: boolean
): Promise<Cd> => {
  return new Promise((resolve, reject) => {
    fetchMatchesList(
      artistName,
      albumName,
      trackCount,
      userSeed,
      debug || false
    )
      .then((matches) => {
        if (matches.length === 0) {
          reject(`No matches found for ${artistName} - ${albumName}`);
          return;
        }
        fetchAlbumData(
          matches.map((match) => match.cdid),
          userSeed,
          debug || false
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
